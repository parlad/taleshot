import React, { useState, useEffect } from 'react';
import { Plus, Camera, Heart, Users, Gift } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { PhotoCard } from './PhotoCard';
import { TagFilter } from './TagFilter';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import type { Photo, ViewMode } from '../types';

interface PhotoGalleryProps {
  onReload?: () => void;
}

export function PhotoGallery({ onReload }: PhotoGalleryProps) {
  const { user } = useSupabaseAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('flip');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Expose reload function to parent
  React.useEffect(() => {
        setFlippedCards(new Set());
        fetchPhotos();
      };
    }
  }, [onReload]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  useEffect(() => {
    filterPhotos();
  }, [photos, selectedTag]);

  const fetchPhotos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
            gallery_photos: groupPhotos
          };
          displayPhotos.push(representative);
        } else if (groupPhotos.length === 1) {
          // Single photo in batch, treat as individual
          displayPhotos.push(groupPhotos[0]);
        }
      });

      setPhotos(displayPhotos);

      // Extract unique tags (excluding gallery tags)
      const tags = new Set<string>();
      photosWithTags.forEach(photo => {
        photo.tags?.forEach(tag => {
          if (!tag.startsWith('gallery_')) {
            tags.add(tag);
          }
        });
      });
      setAvailableTags(Array.from(tags).sort());

    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    if (selectedTag === 'all') {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter(photo => {
        return photo.tags?.includes(selectedTag);
      }));
    }
  };

  const handleFlip = (photoId: string) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleDelete = async (photoId: string) => {
    try {
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handleUpdate = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
  };

  const handlePhotoClick = (photo: Photo, index: number) => {
    if (photo.is_gallery_tile && photo.gallery_photos) {
      // Open gallery modal with all photos from the gallery
      setGalleryPhotos(photo.gallery_photos);
      setGalleryIndex(0);
      setIsGalleryOpen(true);
    } else {
      // Open single photo in gallery modal
      setGalleryPhotos([photo]);
      setGalleryIndex(0);
      setIsGalleryOpen(true);
    }
  };

  const EmptyState = () => (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full empty-state relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-30 floating"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-30 floating" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-30 floating" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 p-4 shadow-lg floating">
              <Camera className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-lg floating" style={{animationDelay: '0.5s'}}>
              <Heart className="w-full h-full text-white" />
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 shadow-lg floating" style={{animationDelay: '1s'}}>
              <Users className="w-full h-full text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold gradient-text mb-4">
            Welcome to Taleshot
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            Start building your photo collection by adding your first memory. Each photo tells a story - what's yours?
          </p>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary inline-flex items-center gap-3 px-8 py-4 text-lg btn-hover-effect"
          >
            <Plus className="w-6 h-6" />
            Add Your First Photo
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your photos...</div>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <>
        <EmptyState />
        <AddPhotoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPhotoAdded={fetchPhotos}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Your Photos</h1>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Camera className="w-4 h-4" />
            {photos.length} photos in your collection
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <TagFilter
            availableTags={availableTags}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 btn-hover-effect"
          >
            <Plus className="w-5 h-5" />
            Add Photo
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No photos match your current filters</div>
          <button
            onClick={() => {
              setSelectedTag('all');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPhotos.map((photo, index) => (
            <div key={photo.id} className="perspective">
              <div 
                className={`preserve-3d transition-transform duration-700 ${
                  flippedCards.has(photo.id) ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front of card */}
                <div className="backface-hidden">
                  <div className="photo-card group cursor-pointer" onClick={() => handlePhotoClick(photo, index)}>
                    <div className="aspect-square overflow-hidden rounded-t-xl">
                      <img
                        src={photo.image_url || photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {photo.is_gallery_tile && photo.gallery_photos && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {photo.gallery_photos.length} photos
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 bg-white rounded-b-xl">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                          {photo.title}
                        </h3>
                        <div className="flex items-center gap-1 ml-2">
                          {photo.is_public ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Public" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full" title="Private" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {photo.date_taken}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlip(photo.id);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of card */}
                <div className="backface-hidden rotate-y-180 absolute inset-0">
                  <PhotoCard
                    photo={photo}
                    isFlipped={true}
                    onFlip={() => handleFlip(photo.id)}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    viewMode={viewMode}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPhotoAdded={fetchPhotos}
      />

      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={galleryPhotos}
        initialIndex={galleryIndex}
      />
    </div>
  );
}