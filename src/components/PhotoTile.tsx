import React, { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, Plus, Images } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import { AddPhotoModal } from './AddPhotoModal';
import type { Photo, ViewMode } from '../types';

interface PhotoTileProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (photoId: string) => void;
  onUpdate: (photo: Photo) => void;
  viewMode: ViewMode;
  onPhotoAdded: () => void;
}

export function PhotoTile({ 
  photo, 
  isFlipped, 
  onFlip, 
  onDelete, 
  onUpdate, 
  viewMode,
  onPhotoAdded 
}: PhotoTileProps) {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const togglePublic = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ is_public: !photo.is_public })
        .eq('id', photo.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onUpdate({ ...photo, is_public: data.is_public });
      }
    } catch (error) {
      console.error('Error updating photo visibility:', error);
      alert('Failed to update photo visibility. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this gallery tile?')) return;

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      onDelete(photo.id);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handleTileClick = () => {
    setIsGalleryModalOpen(true);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddModalOpen(true);
  };

  return (
    <>
      <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105">
        <div onClick={handleTileClick} className="relative">
          {/* Gallery Tile Image */}
          <div className="aspect-square relative overflow-hidden">
            <img
              src={photo.image_url}
              alt={photo.title || 'Gallery tile'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Gallery Icon Overlay */}
            <div className="absolute top-4 right-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <Images className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">
                {photo.title || 'Gallery Collection'}
              </h3>
              {photo.description && (
                <p className="text-white/80 text-sm line-clamp-2">
                  {photo.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePublic();
            }}
            disabled={isUpdating}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors duration-200 disabled:opacity-50"
            title={photo.is_public ? 'Make Private' : 'Make Public'}
          >
            {photo.is_public ? (
              <EyeOff className="w-4 h-4 text-gray-700" />
            ) : (
              <Eye className="w-4 h-4 text-gray-700" />
            )}
          </button>
          
          <button
            onClick={handleAddClick}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors duration-200"
            title="Add Photo to Gallery"
          >
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors duration-200"
            title="Delete Gallery"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>

        {/* Public/Private Indicator */}
        <div className="absolute bottom-2 right-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            photo.is_public 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {photo.is_public ? 'Public' : 'Private'}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        galleryPhoto={photo}
      />

      {/* Add Photo Modal */}
      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPhotoAdded={onPhotoAdded}
        galleryId={photo.id}
      />
    </>
  );
}