import React, { useState, useRef, useEffect } from 'react';
import { Plus, Image, Camera, Heart, Users, Gift } from 'lucide-react';
import type { Photo, Category } from '../types';
import { PhotoCard } from './PhotoCard';
import { AddPhotoModal } from './AddPhotoModal';
import { supabase } from '../utils/supabase';

type ViewMode = 'flip' | 'slide';

interface PhotoGalleryProps {
  selectedCategory?: string;
  selectedTag?: string;
  viewMode?: ViewMode;
  categories?: Category[];
}

export function PhotoGallery({ selectedCategory = 'all', selectedTag = 'all', viewMode = 'flip', categories = [] }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Fetch photos based on selected category or tag
  const fetchPhotos = async () => {
    setIsLoadingPhotos(true);
    setPhotos([]); // Clear photos immediately when filter changes
    
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPhotos([]);
        return;
      }

      if (selectedTag !== 'all') {
        // Use the database function to get photos by tag
        const { data: photosData, error } = await supabase
          .rpc('get_photos_by_tag', {
            user_uuid: user.id,
            tag_name: selectedTag
          });

        if (error) {
          console.error('Error fetching photos with tag:', error);
          setPhotos([]);
          return;
        }

        const transformedPhotos = (photosData || []).map(photo => ({
          ...photo,
          imageUrl: photo.image_url,
          tags: photo.tag_names || [],
          categories: photo.tag_names || []
        }));

        setPhotos(transformedPhotos);
      } else if (selectedCategory !== 'all') {
        // Use the database function to get photos by category (treating categories as tags)
        const { data: photosData, error } = await supabase
          .rpc('get_photos_by_tag', {
            user_uuid: user.id,
            tag_name: selectedCategory
          });

        if (error) {
          console.error('Error fetching photos with category:', error);
          setPhotos([]);
          return;
        }

        const transformedPhotos = (photosData || []).map(photo => ({
          ...photo,
          imageUrl: photo.image_url,
          tags: photo.tag_names || [],
          categories: photo.tag_names || []
        }));

        setPhotos(transformedPhotos);
      } else {
        // Show all photos using the database function
        const { data: photosData, error } = await supabase
          .rpc('get_photos_with_tags', {
            user_uuid: user.id
          });

        if (error) {
          console.error('Error fetching all photos:', error);
          setPhotos([]);
          return;
        }

        const transformedPhotos = (photosData || []).map(photo => ({
          ...photo,
          imageUrl: photo.image_url,
          tags: photo.tag_names || [],
          categories: photo.tag_names || []
        }));

        setPhotos(transformedPhotos);
      }

    } catch (error) {
      console.error('Error in fetchPhotos:', error);
      setPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Force a complete reload of photos when filter changes
    fetchPhotos();
  }, [selectedCategory, selectedTag]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setAllCategories(categoriesData || []);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    }
  };

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

      // Delete existing photo-tag relationships
      await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', updatedPhoto.id);

      // Create new photo-tag relationships
      if (updatedPhoto.categories && updatedPhoto.categories.length > 0) {
        for (const tagName of updatedPhoto.categories) {
          // Ensure the tag exists
          let { data: existingTag, error: tagSelectError } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .eq('user_id', user.id)
            .single();

          if (tagSelectError && tagSelectError.code === 'PGRST116') {
            // Tag doesn't exist, create it
            const { data: newTag, error: tagInsertError } = await supabase
              .from('tags')
              .insert({
                name: tagName,
                user_id: user.id
              })
              .select('id')
              .single();

            if (tagInsertError) {
              console.error('Error creating tag:', tagInsertError);
              continue;
            }
            existingTag = newTag;
          } else if (tagSelectError) {
            console.error('Error selecting tag:', tagSelectError);
            continue;
          }

          // Create photo-tag relationship
          const { error: photoTagError } = await supabase
            .from('photo_tags')
            .insert({
              photo_id: updatedPhoto.id,
              tag_id: existingTag.id
            });

          if (photoTagError) {
            console.error('Error creating photo-tag relationship:', photoTagError);
          }
        }
      }

      // Refresh photos to get updated data
      await fetchPhotos();
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
            date_taken: details.date_taken,
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
        
        // Insert tags and create photo-tag relationships
        if (details.categories && details.categories.length > 0) {
          for (const tagName of details.categories) {
            // First, ensure the tag exists
            let { data: existingTag, error: tagSelectError } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .eq('user_id', user.id)
              .single();

            if (tagSelectError && tagSelectError.code === 'PGRST116') {
              // Tag doesn't exist, create it
              const { data: newTag, error: tagInsertError } = await supabase
                .from('tags')
                .insert({
                  name: tagName,
                  user_id: user.id
                })
                .select('id')
                .single();

              if (tagInsertError) {
                console.error('Error creating tag:', tagInsertError);
                continue;
              }
              existingTag = newTag;
            } else if (tagSelectError) {
              console.error('Error selecting tag:', tagSelectError);
              continue;
            }

            // Create photo-tag relationship
            const { error: photoTagError } = await supabase
              .from('photo_tags')
              .insert({
                photo_id: photo.id,
                tag_id: existingTag.id
              });

            if (photoTagError) {
              console.error('Error creating photo-tag relationship:', photoTagError);
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

      await fetchPhotos(); // Refresh the photos after deletion
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
            {(selectedCategory === 'all' && selectedTag === 'all') ? 'Start Your Memory Collection' : 'No Memories Found'}
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            {(selectedCategory === 'all' && selectedTag === 'all')
              ? "Every photo tells a unique story. Begin your journey of capturing and preserving life's precious moments."
              : `No memories found with the selected filter. Try selecting a different filter or add new photos.`}
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">
              {(selectedCategory === 'all' && selectedTag === 'all') ? 'Add Your First Memory' : 'Add New Photos'}
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

      {photos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map(photo => (
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
        categories={allCategories}
      />
    </div>
  );
}