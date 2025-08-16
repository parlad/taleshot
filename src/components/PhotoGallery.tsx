import React, { useState, useEffect } from 'react';
import { Plus, Grid, LayoutGrid, Camera, Heart, Users, Gift } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { PhotoCard } from './PhotoCard';
import { PhotoTile } from './PhotoTile';
import { AddPhotoModal } from './AddPhotoModal';
import { TagFilter } from './TagFilter';
import type { Photo, ViewMode } from '../types';

export function PhotoGallery() {
  const { user } = useSupabaseAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('flip');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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
    // Group photos by batch_id (gallery groups) and create tiles
    const galleryMap = new Map<string, Photo[]>();
    const singlePhotos: Photo[] = [];
    
    photos.forEach(photo => {
      if (photo.batch_id) {
        if (!galleryMap.has(photo.batch_id)) {
          galleryMap.set(photo.batch_id, []);
        }
        galleryMap.get(photo.batch_id)!.push(photo);
      } else {
        singlePhotos.push(photo);
      }
    });
    
    // Create photo tiles (single photos + gallery representatives)
    let photoTiles: Photo[] = [...singlePhotos];
    
    // Add one representative photo per gallery
    galleryMap.forEach((galleryPhotos, galleryId) => {
      if (galleryPhotos.length > 0) {
        const representative = {
          ...galleryPhotos[0],
          gallery_photos: galleryPhotos,
          is_gallery_tile: true
        };
        photoTiles.push(representative);
      }
    });
    
    // Apply tag filtering
    let filtered = photoTiles;

    if (selectedTag !== 'all') {
      filtered = filtered.filter(photo => 
        photo.tags?.includes(selectedTag) || 
        (photo.gallery_photos && photo.gallery_photos.some(p => p.tags?.includes(selectedTag)))
      );
    }

    setFilteredPhotos(filtered);
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
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleUpdate = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
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
            Welcome to Taleshot
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            Start building your photo collection by adding your first memory. Each photo tells a story - what's yours?
          </p>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
        <div className="text-gray-500">Loading your photos...</div>
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
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Photos</h1>
          <p className="text-gray-600 mt-1">
            {filteredPhotos.length} of {photos.length} photos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TagFilter
            availableTags={availableTags}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />

          <div className="flex items-center bg-white border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('flip')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'flip'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Flip view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('slide')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'slide'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Card view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors add-photo-btn"
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
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {filteredPhotos.map(photo => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              isFlipped={flippedCards.has(photo.id)}
              onFlip={() => handleFlip(photo.id)}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              viewMode={viewMode}
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