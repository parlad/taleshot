import React, { useState, useRef, useEffect } from 'react';
import { Plus, LogOut, Image } from 'lucide-react';
import type { Photo, Category } from '../types';
import { PhotoCard } from './PhotoCard';
import { AddPhotoModal } from './AddPhotoModal';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
    fetchCategories();
  }, []);

  const fetchPhotos = async () => {
    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }

    setPhotos(photos || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
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

  const handleAddPhotos = async (details: Omit<Photo, 'id' | 'imageUrl'>) => {
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of selectedFiles) {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}.${fileExt}`;

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

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from('photos')
          .insert({
            user_id: user.id,
            title: details.title,
            description: details.description,
            date_taken: details.dateTaken,
            reason: details.reason,
            image_url: publicUrl
          });

        if (insertError) {
          console.error('Error inserting photo:', insertError);
          continue;
        }
      }

      // Refresh photos after upload
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
      // Delete from photos table
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Extract filename from URL and delete from storage
      const fileName = photo.image_url?.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([fileName]);

        if (storageError) throw storageError;
      }

      // Update local state
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Add Photos"
          disabled={isUploading}
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No memories yet</h2>
          <p className="text-gray-600 text-center mb-8 max-w-md">
            Start capturing your precious moments by clicking the plus button above.
            Each photo tells a story - what's yours?
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Memory</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={{
                ...photo,
                imageUrl: photo.image_url,
                dateTaken: photo.date_taken
              }}
              isFlipped={flippedIds.has(photo.id)}
              onFlip={() => handleFlip(photo.id)}
              onDelete={handleDeletePhoto}
            />
          ))}
        </div>
      )}

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