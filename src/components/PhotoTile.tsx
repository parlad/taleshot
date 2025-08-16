import React, { useState } from 'react';
import { Images, Calendar, Tag, X } from 'lucide-react';
import { PhotoCard } from './PhotoCard';
import { supabase } from '../utils/supabase';
import type { Photo } from '../types';

interface PhotoTileProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedPhoto: Photo) => void;
  viewMode: 'flip' | 'slide';
  onGroupSelect?: (groupId: string) => void;
}

export function PhotoTile({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode, onGroupSelect }: PhotoTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFlippedCards, setExpandedFlippedCards] = useState<Set<string>>(new Set());
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);

  const handleExpandedFlip = (photoId: string) => {
    setExpandedFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleDeleteFromGallery = (photoId: string) => {
    onDelete(photoId);
    // If this was the last photo in the gallery, the tile will be removed automatically
    // by the parent component's photo filtering logic
  };

  const handleUpdateInGallery = (updatedPhoto: Photo) => {
    onUpdate(updatedPhoto);
  };

  // Load gallery photos when expanding
  const loadGalleryPhotos = async () => {
    if (!photo.batch_id) return;
    
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('batch_id', photo.batch_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (photos && photos.length > 0) {
        // Add tags to each photo
        const photosWithTags = await Promise.all(
          photos.map(async (p) => {
            const { data: tags } = await supabase
              .from('photo_tags')
              .select('tag_name')
              .eq('photo_id', p.id);
            
            return {
              ...p,
              tags: tags?.map(t => t.tag_name).filter(tag => !tag.startsWith('gallery_')) || []
            };
          })
        );

        setGalleryPhotos(photosWithTags);
      }
    } catch (error) {
      console.error('Error loading gallery photos:', error);
    }
  };

  const handleExpand = () => {
    if (photo.is_gallery_tile && photo.batch_id) {
      if (onGroupSelect) {
        onGroupSelect(photo.batch_id);
      } else {
        loadGalleryPhotos();
      }
    }
    if (!onGroupSelect) {
      setIsExpanded(true);
    }
  };

  // If it's not a gallery tile, render as regular PhotoCard
  if (!photo.is_gallery_tile) {
    return (
      <PhotoCard
        photo={photo}
        isFlipped={isFlipped}
        onFlip={onFlip}
        onDelete={onDelete}
        onUpdate={onUpdate}
        viewMode={viewMode}
      />
    );
  }

  const displayPhotos = isExpanded ? galleryPhotos : [];
  const photoCount = photo.gallery_photos?.length || 0;

  // Expanded view showing all photos in the gallery
  if (isExpanded) {
    return (
      <div className="col-span-full">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Images className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                {photo.title} ({photoCount} photos)
              </h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className={`grid gap-6 ${
            viewMode === 'flip' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {displayPhotos.map(galleryPhoto => (
              <PhotoCard
                key={galleryPhoto.id}
                photo={galleryPhoto}
                isFlipped={expandedFlippedCards.has(galleryPhoto.id)}
                onFlip={() => handleExpandedFlip(galleryPhoto.id)}
                onDelete={handleDeleteFromGallery}
                onUpdate={handleUpdateInGallery}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tile view showing just the representative photo with gallery indicator
  if (viewMode === 'slide') {
    return (
      <div 
        className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleExpand}
      >
        <div className="aspect-square relative">
          <img
            src={photo.imageUrl || photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Images className="w-4 h-4" />
            {photoCount}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-lg font-semibold mb-1">{photo.title}</h3>
            <div className="flex items-center text-white/80 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              {photo.date_taken}
            </div>
          </div>
        </div>
        <div className="p-4">
          <p className="text-gray-700 text-sm line-clamp-2">{photo.reason}</p>
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {photo.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {photo.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{photo.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Flip card gallery tile view
  return (
    <div className="perspective w-full h-96">
      <div
        className="relative w-full h-full preserve-3d transition-transform duration-700 cursor-pointer"
        onClick={handleExpand}
      >
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-lg">
          <img
            src={photo.imageUrl || photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Images className="w-4 h-4" />
            {photoCount}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">{photo.title}</h3>
            <div className="flex items-center text-white/80 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              {photo.date_taken}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}