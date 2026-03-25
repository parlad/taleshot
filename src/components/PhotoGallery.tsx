import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Grid, LayoutGrid, Camera, Heart, Users, Gift } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useToast } from '../hooks/useToast';
import { PhotoCard } from './PhotoCard';
import { AddPhotoModal } from './AddPhotoModal';
import { TagFilter } from './TagFilter';
import { LoadingSpinner } from './LoadingSpinner';
import type { Photo, ViewMode } from '../types';

export function PhotoGallery() {
  const { user } = useSupabaseAuth();
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('flip');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_photos_with_tags', {
        user_uuid: user.id
      });

      if (error) throw error;

      const photosWithTags: Photo[] = (data ?? []).map((photo: Photo & { tags: string[] | null }) => ({
        ...photo,
        tags: photo.tags ?? []
      }));

      setPhotos(photosWithTags);

      const tags = new Set<string>();
      photosWithTags.forEach(p => p.tags?.forEach(t => tags.add(t)));
      setAvailableTags(Array.from(tags).sort());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load photos';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    setFilteredPhotos(
      selectedTag === 'all'
        ? photos
        : photos.filter(p => p.tags?.includes(selectedTag))
    );
  }, [photos, selectedTag]);

  const handleFlip = (photoId: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) { next.delete(photoId); } else { next.add(photoId); }
      return next;
    });
  };

  const handleDelete = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setFlippedCards(prev => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
  };

  const handleUpdate = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" message="Loading your photos…" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setIsAddModalOpen(true)} />
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
          <p className="text-gray-500 mt-1 text-sm">
            {filteredPhotos.length} of {photos.length} photos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TagFilter
            availableTags={availableTags}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />

          {/* View mode toggle */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('flip')}
              className={`p-2 transition-colors ${
                viewMode === 'flip' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Flip card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('slide')}
              className={`p-2 transition-colors ${
                viewMode === 'slide' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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
          <p className="text-gray-500 mb-4">No photos match your current filters</p>
          <button
            onClick={() => setSelectedTag('all')}
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
            <PhotoCard
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/50 backdrop-blur-lg rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full opacity-50 animate-pulse" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-100 rounded-full opacity-50 animate-pulse delay-300" />
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-purple-100 rounded-full opacity-50 animate-pulse delay-700" />
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto mb-8">
            {[
              { icon: Camera, from: 'from-blue-500', to: 'to-blue-600' },
              { icon: Heart, from: 'from-indigo-500', to: 'to-indigo-600' },
              { icon: Users, from: 'from-purple-500', to: 'to-purple-600' },
              { icon: Gift, from: 'from-pink-500', to: 'to-pink-600' },
            ].map(({ icon: Icon, from, to }) => (
              <div key={from} className={`aspect-square rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-lg`}>
                <Icon className="w-full h-full text-white" />
              </div>
            ))}
          </div>

          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-4">
            Welcome to Taleshot
          </h2>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            Start building your photo collection by adding your first memory. Each photo tells a story — what's yours?
          </p>

          <button
            onClick={onAdd}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-6 h-6" />
            Add Your First Photo
          </button>
        </div>
      </div>
    </div>
  );
}
