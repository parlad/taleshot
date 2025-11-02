import React, { useState, useEffect } from 'react';
import { Plus, Camera, Heart, Users, Gift, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useToast } from '../hooks/useToast';
import { PhotoCard } from './PhotoCard';
import { PhotoTile } from './PhotoTile';
import { AddPhotoModal } from './AddPhotoModal';
import { TagFilter } from './TagFilter';
import { Toast } from './Toast';
import { SkeletonLoader } from './SkeletonLoader';
import { PhotoViewerModal } from './PhotoViewerModal';
import type { Photo, ViewMode } from '../types';

interface PhotoGalleryProps {
  onReload?: () => void;
}

export function PhotoGallery({ onReload }: PhotoGalleryProps) {
  const { user } = useSupabaseAuth();
  const { toasts, showToast, hideToast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('flip');
  const [sortBy, setSortBy] = useState<'date' | 'tag' | 'privacy'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  // Expose reload function to parent
  React.useEffect(() => {
    if (onReload) {
      const originalOnReload = onReload;
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
  }, [photos, selectedTag, searchQuery, sortBy, sortOrder]);

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

      showToast('Photos loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching photos:', error);
      showToast('Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    let filtered: Photo[] = [];

    // Group photos by batch_id for gallery functionality
    const batchGroups = new Map<string, Photo[]>();
    const individualPhotos: Photo[] = [];
    
    photos.forEach(photo => {
      if (photo.batch_id && photo.upload_type === 'group') {
        if (!batchGroups.has(photo.batch_id)) {
          batchGroups.set(photo.batch_id, []);
        }
        batchGroups.get(photo.batch_id)!.push(photo);
      } else {
        individualPhotos.push(photo);
      }
    });
    
    // Start with individual photos
    filtered = [...individualPhotos];
    
    // Add gallery tiles for batched photos
    batchGroups.forEach((groupPhotos, batchId) => {
      if (groupPhotos.length > 1) {
        // Create a gallery tile using the first photo as representative
        const representative: Photo = {
          ...groupPhotos[0],
          is_gallery_tile: true,
          gallery_photos: groupPhotos
        };
        filtered.push(representative);
      } else if (groupPhotos.length === 1) {
        // Single photo in batch, treat as individual
        filtered.push(groupPhotos[0]);
      }
    });

    // Apply tag and search filtering
    let finalFiltered = filtered;

    // Filter by tag
    if (selectedTag !== 'all') {
      finalFiltered = finalFiltered.filter(photo => {
        if (photo.is_gallery_tile && photo.gallery_photos) {
          // For gallery tiles, check if any photo in the gallery has the tag
          return photo.gallery_photos.some(p => p.tags?.includes(selectedTag));
        }
        return photo.tags?.includes(selectedTag);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      finalFiltered = finalFiltered.filter(photo => {
        const matchesTitle = photo.title.toLowerCase().includes(query);
        const matchesReason = photo.reason.toLowerCase().includes(query);
        const matchesTags = photo.tags?.some(tag => tag.toLowerCase().includes(query));
        
        if (photo.is_gallery_tile && photo.gallery_photos) {
          const matchesGallery = photo.gallery_photos.some(p => 
            p.title.toLowerCase().includes(query) ||
            p.reason.toLowerCase().includes(query) ||
            p.tags?.some(tag => tag.toLowerCase().includes(query))
          );
          return matchesTitle || matchesReason || matchesTags || matchesGallery;
        }
        
        return matchesTitle || matchesReason || matchesTags;
      });
    }

    // Apply sorting
    let sorted = [...finalFiltered];

    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === 'tag') {
      sorted.sort((a, b) => {
        const tagA = (a.tags?.[0] || '').toLowerCase();
        const tagB = (b.tags?.[0] || '').toLowerCase();
        return sortOrder === 'asc' ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA);
      });
    } else if (sortBy === 'privacy') {
      sorted.sort((a, b) => {
        const privacyA = a.is_public ? 1 : 0;
        const privacyB = b.is_public ? 1 : 0;
        return sortOrder === 'asc' ? privacyA - privacyB : privacyB - privacyA;
      });
    }

    setFilteredPhotos(sorted);
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

  const handlePhotoClick = (photoId: string) => {
    const index = filteredPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setViewerPhotoIndex(index);
      setViewerOpen(true);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
      showToast('Photo deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting photo:', error);
      showToast('Failed to delete photo', 'error');
    }
  };

  const handleUpdate = (updatedPhoto: Photo) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
    showToast('Photo updated successfully', 'success');
  };

  const togglePhotoPublic = async (photo: Photo) => {
    try {
      const newPublicState = !photo.is_public;
      const { error } = await supabase
        .from('photos')
        .update({ is_public: newPublicState })
        .eq('id', photo.id);

      if (error) throw error;

      const updatedPhoto: Photo = {
        ...photo,
        is_public: newPublicState
      };

      handleUpdate(updatedPhoto);
      showToast(
        `Photo made ${newPublicState ? 'public' : 'private'}`,
        'success'
      );
    } catch (error) {
      console.error('Error updating photo visibility:', error);
      showToast('Failed to update photo visibility', 'error');
    }
  };

  const EmptyState = () => (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full empty-state relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-30 floating"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-30 floating" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full opacity-30 floating" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-4 shadow-lg floating">
              <Camera className="w-full h-full text-white" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-lg floating" style={{animationDelay: '0.5s'}}>
              <Heart className="w-full h-full text-white" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 p-4 shadow-lg floating" style={{animationDelay: '1s'}}>
              <Users className="w-full h-full text-white" />
            </div>
          </div>

          <h2 className="text-4xl font-bold gradient-text mb-4" style={{lineHeight: '1.2'}}>
            Upload your first story
          </h2>

          <p className="text-gray-600 text-base mb-8 leading-relaxed max-w-xl mx-auto" style={{lineHeight: '1.5'}}>
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
    return <SkeletonLoader count={6} />;
  }

  if (photos.length === 0) {
    return (
      <>
        <EmptyState />
        <AddPhotoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPhotoAdded={() => {
            fetchPhotos();
            showToast('Photo uploaded successfully!', 'success');
          }}
        />
        
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => hideToast(toast.id)}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-1" style={{lineHeight: '1.2'}}>Your Photos</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 font-medium">
              <Camera className="w-4 h-4" />
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'tag' | 'privacy')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="date">Date</option>
            <option value="tag">Tag</option>
            <option value="privacy">Privacy</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <TagFilter
        availableTags={availableTags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        onSearch={setSearchQuery}
      />

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery ? `No photos found for "${searchQuery}"` : 'No photos match your current filters'}
          </div>
          <button
            onClick={() => {
              setSelectedTag('all');
              setSearchQuery('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div
          className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-2 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredPhotos.map((photo, index) =>
              photo.is_gallery_tile ? (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <PhotoTile
                    photo={photo}
                    isFlipped={flippedCards.has(photo.id)}
                    onFlip={() => handleFlip(photo.id)}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    viewMode={viewMode}
                    onPhotoAdded={() => {
                      fetchPhotos();
                      showToast('Photo added to gallery!', 'success');
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo.id)}
                  className="cursor-pointer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PhotoCard
                    photo={photo}
                    isFlipped={flippedCards.has(photo.id)}
                    onFlip={() => handleFlip(photo.id)}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    viewMode={viewMode}
                    onTogglePublic={() => togglePhotoPublic(photo)}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Quick Privacy Toggle Buttons */}
      {filteredPhotos.length > 0 && (
        <div className="fixed bottom-20 right-6 flex flex-col gap-2 z-40">
          {filteredPhotos.slice(0, 3).map(photo => (
            <button
              key={`privacy-${photo.id}`}
              onClick={() => togglePhotoPublic(photo)}
              className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center backdrop-blur-sm border-2 ${
                photo.is_public
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-gray-400 text-white border-gray-500'
              }`}
              title={photo.is_public ? 'Public - Click to make private' : 'Private - Click to make public'}
            >
              {photo.is_public ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="floating-button"
        title="Add Photo"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddPhotoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPhotoAdded={() => {
          fetchPhotos();
          showToast('Photo uploaded successfully!', 'success');
        }}
      />
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photos={filteredPhotos}
        initialIndex={viewerPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}