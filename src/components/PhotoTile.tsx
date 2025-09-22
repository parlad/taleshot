import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Images, Calendar, Tag, Trash2 } from 'lucide-react';
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
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const togglePublic = async () => {
    if (!photo.gallery_photos) return;

    try {
      // Update all photos in the gallery
      const updates = photo.gallery_photos.map(p => 
        supabase
          .from('photos')
          .update({ is_public: !photo.is_public })
          .eq('id', p.id)
      );

      await Promise.all(updates);

      // Update the photo state
      const updatedPhoto = {
        ...photo,
        is_public: !photo.is_public,
        gallery_photos: photo.gallery_photos.map(p => ({
          ...p,
          is_public: !photo.is_public
        }))
      };

      onUpdate(updatedPhoto);
    } catch (error) {
      console.error('Error updating gallery visibility:', error);
      alert('Failed to update gallery visibility. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!photo.gallery_photos || !confirm('Are you sure you want to delete this entire gallery?')) return;

    try {
      // Delete all photos in the gallery
      const deletePromises = photo.gallery_photos.map(p =>
        supabase.from('photos').delete().eq('id', p.id)
      );

      await Promise.all(deletePromises);
      onDelete(photo.id);
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Failed to delete gallery. Please try again.');
    }
  };

  if (!photo.gallery_photos || photo.gallery_photos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="photo-card group">
        <div className={`photo-card-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front of card - Gallery Tile */}
          <div className="photo-card-front">
            <div className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-square overflow-hidden relative">
                {/* Main gallery image */}
                <img
                  src={photo.gallery_photos[0].image_url}
                  alt={photo.title || 'Gallery'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  loading="lazy"
                  onClick={() => setIsGalleryOpen(true)}
                />
                
                {/* Gallery overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm truncate">{photo.title}</h4>
                        <div className="flex items-center text-xs text-white/80 mt-1">
                          <Images className="w-3 h-3 mr-1" />
                          {photo.gallery_photos.length} photos
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gallery indicator */}
                <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Images className="w-3 h-3" />
                  {photo.gallery_photos.length}
                </div>

                {/* Public/Private indicator */}
                <div className="absolute top-2 left-2">
                  {photo.is_public ? (
                    <div className="bg-green-500 text-white p-1 rounded-full">
                      <Eye className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="bg-gray-500 text-white p-1 rounded-full">
                      <EyeOff className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                    {photo.title || 'Untitled Gallery'}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {photo.date_taken}
                  </div>
                  <button
                    onClick={onFlip}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Back of card - Gallery Details */}
          <div className="photo-card-back">
            <div className="bg-white rounded-xl shadow-lg p-6 h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Images className="w-4 h-4" />
                    {photo.title || 'Untitled Gallery'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {photo.reason}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{photo.date_taken}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4" />
                    <span>{photo.gallery_photos.length} photos in gallery</span>
                  </div>
                  
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {photo.tags.filter(tag => !tag.startsWith('gallery_')).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {photo.is_public ? (
                      <>
                        <Eye className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Public Gallery</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Private Gallery</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={togglePublic}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    {photo.is_public ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Make Public
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setIsGalleryOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                  >
                    <Images className="w-4 h-4" />
                    View Gallery
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={onFlip}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={photo.gallery_photos || []}
        initialIndex={0}
      />

      {/* Add Photo Modal */}
      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPhotoAdded={onPhotoAdded}
        existingGalleryId={photo.batch_id}
        galleryTitle={photo.title}
      />
    </>
  );
}