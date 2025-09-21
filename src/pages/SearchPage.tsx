import React, { useState, useEffect } from 'react';
import { Plus, Camera, Heart, Users, Gift } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { PhotoCard } from './PhotoCard';
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
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Expose reload function to parent
  React.useEffect(() => {
    if (onReload) {
      const reloadFunction = () => {
        setFlippedCards(new Set());
        fetchPhotos();
      };
      return reloadFunction;
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get tags for each photo
      const photosWithTags = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);
          
          return {
            ...photo,
            tags: tags?.map(t => t.tag_name) || []
          };
        })
      );

      setPhotos(photosWithTags);

      // Extract unique tags
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
      setFilteredPhotos(photos.filter(photo => 
        photo.tags?.includes(selectedTag)
      ));
    }
  };

  const PhotoTile = ({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode, onPhotoAdded }: any) => {
    return (
      photo.is_gallery_tile ? (
        <div 
          key={photo.id} 
          className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-white/50 overflow-hidden cursor-pointer transition-all duration-500 hover:transform hover:scale-[1.02]"
          onClick={() => setSelectedPhoto(photo.gallery_photos?.[0] || photo)}
        >
          <div className="aspect-square relative overflow-hidden">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Gallery indicator */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-lg backdrop-blur-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {photo.gallery_photos?.length || 1}
            </div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Photo info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-bold text-white text-lg leading-tight mb-2">{photo.title}</h3>
              <div className="flex items-center text-white/90 text-sm mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                {photo.date_taken}
              </div>
              <div className="text-white/80 text-xs">
                Gallery • {photo.gallery_photos?.length || 1} photos
              </div>
            </div>
            
            {/* Hover icon */}
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          key={photo.id} 
          className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-white/50 overflow-hidden cursor-pointer transition-all duration-500 hover:transform hover:scale-[1.02]"
          onClick={() => setSelectedPhoto(photo)}
        >
          <div className="aspect-square relative overflow-hidden">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Photo info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-bold text-white text-lg leading-tight mb-2">{photo.title}</h3>
              <div className="flex items-center text-white/90 text-sm mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                {photo.date_taken}
              </div>
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/25 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                  {photo.tags.length > 2 && (
                    <span className="px-3 py-1 bg-white/25 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-white/20">
                      +{photo.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Hover icon */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )
    );
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
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-2">
          {filteredPhotos.map(photo => 
            photo.is_gallery_tile ? (
              <PhotoTile
                key={photo.id}
                photo={photo}
                isFlipped={flippedCards.has(photo.id)}
                onFlip={() => handleFlip(photo.id)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                viewMode={viewMode}
                onPhotoAdded={fetchPhotos}
              />
            ) : (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isFlipped={flippedCards.has(photo.id)}
                onFlip={() => handleFlip(photo.id)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                viewMode={viewMode}
              />
            )
          )}
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