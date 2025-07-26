import React, { useState, useRef, useEffect } from 'react';
import { Plus, Image, Camera, Heart, Users, Gift } from 'lucide-react';
import type { Photo, Category } from '../types';
import { PhotoCard } from './PhotoCard';
import { AddPhotoModal } from './AddPhotoModal';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../utils/supabase';

type ViewMode = 'flip' | 'slide';

interface PhotoGalleryProps {
  selectedCategory?: string;
  viewMode?: ViewMode;
  categories?: Category[];
}

export function PhotoGallery({ selectedCategory = 'all', viewMode = 'flip', categories = [] }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: photosData, error: photosError, isLoading: isLoadingPhotos } = useSupabaseQuery(
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      return supabase
        .from('photos')
        .select(`
          *,
          photo_categories (
            categories (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    },
    []
  );

  useEffect(() => {
    if (photosData) {
      const transformedPhotos = photosData.map(photo => ({
        ...photo,
        categories: photo.photo_categories
          ?.map(pc => pc.categories?.name)
          .filter(Boolean) || []
      }));
      console.log('Transformed photos with categories:', transformedPhotos);
      setPhotos(transformedPhotos);
    }
  }, [photosData]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredPhotos(photos);
    } else {
      const filtered = photos.filter(photo => {
        const photoCategories = photo.categories || [];
        
        // Check if photo has the selected category (case-insensitive)
        return photoCategories.some(category => 
          category && category.toLowerCase() === selectedCategory.toLowerCase()
        );
      });
      
      console.log(`Category "${selectedCategory}": showing ${filtered.length} out of ${photos.length} photos`);
      setFilteredPhotos(filtered);
    }
  }, [photos, selectedCategory]);

  const handleFlip = (id: string) => {
    setFlippedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setIsModalOpen(true);
  };

  const fetchPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: photos, error } = await supabase
      .from('photos')
      .select(`
        *,
        photo_categories (
          categories (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }

    const transformedPhotos = photos?.map(photo => ({
      ...photo,
      categories: photo.photo_categories
        ?.map(pc => pc.categories?.name)
        .filter(Boolean) || []
    })) || [];

    setPhotos(transformedPhotos);
  };

  const handleUpdatePhoto = async (updatedPhoto: Photo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, update the photo details
      const { error: updateError } = await supabase
        .from('photos')
        .update({
          title: updatedPhoto.title,
          date_taken: updatedPhoto.date_taken,
          reason: updatedPhoto.reason,
          is_public: updatedPhoto.is_public
        })
        .eq('id', updatedPhoto.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating photo:', updateError);
        return;
      }

      // Get category IDs for the selected categories
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id, name')
        .in('name', updatedPhoto.categories || []);

      if (categoryData) {
        // First, delete existing category associations
        await supabase
          .from('photo_categories')
          .delete()
          .eq('photo_id', updatedPhoto.id);

        // Then, insert new category associations
        if (categoryData.length > 0) {
          const categoryAssociations = categoryData.map(category => ({
            photo_id: updatedPhoto.id,
            category_id: category.id
          }));

          await supabase
            .from('photo_categories')
            .insert(categoryAssociations);
        }
      }

      // Fetch the updated photo with all its relations
      const { data: refreshedPhoto, error: refreshError } = await supabase
        .from('photos')
        .select(`
          *,
          photo_categories (
            categories (
              name
            )
          )
        `)
        .eq('id', updatedPhoto.id)
        .single();

      if (refreshError) {
        console.error('Error refreshing photo data:', refreshError);
        return;
      }

      // Transform the refreshed photo data
      const transformedPhoto = {
        ...refreshedPhoto,
        categories: refreshedPhoto.photo_categories
          ?.map(pc => pc.categories?.name)
          .filter(Boolean) || []
      };

      // Update local state
      setPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === updatedPhoto.id ? transformedPhoto : photo
        )
      );

      setFilteredPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === updatedPhoto.id ? transformedPhoto : photo
        )
      );
    } catch (error) {
      console.error('Error in handleUpdatePhoto:', error);
    }
  };

  const handleAddPhotos = async (details: Omit<Photo, 'id' | 'imageUrl'>) => {
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of selectedFiles) {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}.${fileExt}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        // Insert the photo record
        const { data: photo, error: insertError } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            title: details.title,
            date_taken: details.dateTaken,
            reason: details.reason,
            image_url: publicUrl,
            is_public: details.is_public || false
          })
          .select()
          .single();

        if (insertError || !photo) {
          console.error('Error inserting photo:', insertError);
          continue;
        }

        // Add categories if any were selected
        if (details.categories && details.categories.length > 0) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id, name')
            .in('name', details.categories);

          if (categoryData && categoryData.length > 0) {
            const categoryAssociations = categoryData.map(category => ({
              photo_id: photo.id,
              category_id: category.id
            }));

            const { error: categoryError } = await supabase
              .from('photo_categories')
              .insert(categoryAssociations);

            if (categoryError) {
              console.error('Error inserting categories:', categoryError);
            }
          }
        }
      }

      await fetchPhotos();
      
      setSelectedFiles([]);
      setIsModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    try {
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      const fileName = photo.image_url?.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([fileName]);

        if (storageError) throw storageError;
      }

      setPhotos(prev => prev.filter(p => p.id !== id));
      setFilteredPhotos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const EmptyState = () => (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/50 backdrop-blur-lg rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-100 rounded-full opacity-50 animate-pulse delay-300"></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-purple-100 rounded-full opacity-50 animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto mb-8">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-lg">
              <Camera className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 shadow-lg">
              <Heart className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-lg">
              <Users className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 p-4 shadow-lg">
              <Gift className="w-full h-full text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-4">
            {photos.length === 0 ? 'Start Your Memory Collection' : 'No Memories Found'}
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            {photos.length === 0 
              ? "Every photo tells a unique story. Begin your journey of capturing and preserving life's precious moments."
              : `No memories found in the "${selectedCategory}" category. Try selecting a different category or add new photos to this collection.`}
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">
              {photos.length === 0 ? 'Add Your First Memory' : 'Add New Photos'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-16rem)] pb-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        accept="image/*"
      />

      {filteredPhotos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPhotos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isFlipped={flippedIds.has(photo.id)}
              onFlip={() => handleFlip(photo.id)}
              onDelete={handleDeletePhoto}
              onUpdate={handleUpdatePhoto}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Add Photo Button - Fixed at bottom right, above footer */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="fixed bottom-24 right-8 w-16 h-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 z-40"
        title="Add Photos"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Add Photo Modal */}
      <AddPhotoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFiles([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        onAdd={handleAddPhotos}
        fileCount={selectedFiles.length}
        selectedFiles={selectedFiles}
        categories={categories}
      />
    </div>
  );
}