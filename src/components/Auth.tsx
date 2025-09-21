import React, { useState, useEffect } from 'react';
import { Plus, Camera, Heart, Users, Gift } from 'lucide-react';
import { AddPhotoModal } from './AddPhotoModal';
import { TagFilter } from './TagFilter';
import type { Photo, ViewMode } from '../types';

interface PhotoGalleryProps {
  onReload?: () => void;
}

export function PhotoGallery({ onReload }: PhotoGalleryProps) {
  const { user } = useSupabaseAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('all');
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('flip');

  useEffect(() => {
    if (onReload) {
      onReload = () => {
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
      const { data, error } = await supabase.rpc('get_user_photos_with_tags', {
        user_uuid: user.id
      });

      if (error) throw error;

      const photosWithTags = data?.map(photo => ({
        ...photo,
        tags: photo.tags || []
      })) || [];

      setPhotos(photosWithTags);

      // Extract unique tags
      const tags = new Set<string>();
      photosWithTags.forEach(photo => {
        photo.tags?.forEach(tag => {
          // Filter out internal gallery tags from the UI
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
      setFilteredPhotos(photos.filter(photo => 
        photo.tags?.includes(selectedTag)
      ));
    }
  };

  const handleFlip = (photoId: string) => {
    const newFlippedCards = new Set(flippedCards);
    if (newFlippedCards.has(photoId)) {
      newFlippedCards.delete(photoId);
    } else {
      newFlippedCards.add(photoId);
    }
    setFlippedCards(newFlippedCards);
  };

  const handleDelete = async (photoId: string) => {
    // Delete logic here
    fetchPhotos();
  };

  const handleUpdate = async (photoId: string, updates: any) => {
    // Update logic here
    fetchPhotos();
  };

  const handleGroupSelect = (groupId: string) => {
    // Group select logic here
  };

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-12 h-12 text-purple-600" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Photo Journey Starts Here
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
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Your Photos</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Camera className="w-4 h-4" />
              {photos.length} photos
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TagFilter
            availableTags={availableTags}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
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
        <div className={`grid gap-6 ${
          viewMode === 'flip' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        } p-2`}>
          {filteredPhotos.map(photo => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              isFlipped={flippedCards.has(photo.id)}
              onFlip={() => handleFlip(photo.id)}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              viewMode={viewMode}
              onGroupSelect={handleGroupSelect}
              onPhotoAdded={fetchPhotos}
            />
          ))}
        </div>
      )}
      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPhotoAdded={fetchPhotos}
      />
    </div>
  );
}