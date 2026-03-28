import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Camera, Heart, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useToast } from '../hooks/useToast';
import { PhotoCard } from './PhotoCard';
import { PhotoTile } from './PhotoTile';
import { AddPhotoModal } from './AddPhotoModal';
import { TagFilter } from './TagFilter';
import { SkeletonLoader } from './SkeletonLoader';
import { PhotoViewerModal } from './PhotoViewerModal';
import type { Photo } from '../types';

export function PhotoGallery() {
  const { user } = useSupabaseAuth();
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  const fetchPhotos = useCallback(async () => {
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
      showToast('Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const filterPhotos = useCallback(() => {
    let filtered: Photo[] = [];

    const galleryGroups = new Map<string, Photo[]>();
    const individualPhotos: Photo[] = [];

    photos.forEach(photo => {
      const photoGalleryTag = photo.tags?.find(tag => tag.startsWith('gallery_'));

      if (photoGalleryTag) {
        if (!galleryGroups.has(photoGalleryTag)) {
          galleryGroups.set(photoGalleryTag, []);
        }
        galleryGroups.get(photoGalleryTag)!.push(photo);
      } else {
        individualPhotos.push(photo);
      }
    });

    filtered = [...individualPhotos];

    galleryGroups.forEach((groupPhotos) => {
      if (groupPhotos.length > 1) {
        const representative: Photo = {
          ...groupPhotos[0],
          is_gallery_tile: true,
          gallery_photos: groupPhotos
        };
        filtered.push(representative);
      } else if (groupPhotos.length === 1) {
        filtered.push(groupPhotos[0]);
      }
    });

    let finalFiltered = filtered;

    if (selectedTag !== 'all') {
      finalFiltered = finalFiltered.filter(photo => {
        if (photo.is_gallery_tile && photo.gallery_photos) {
          return photo.gallery_photos.some(p => p.tags?.includes(selectedTag));
        }
        return photo.tags?.includes(selectedTag);
      });
    }

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

    const sorted = [...finalFiltered].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    setFilteredPhotos(sorted);
  }, [photos, selectedTag, searchQuery]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, fetchPhotos]);

  useEffect(() => {
    filterPhotos();
  }, [filterPhotos]);

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

      const updatedPhoto: Photo = { ...photo, is_public: newPublicState };
      handleUpdate(updatedPhoto);
      showToast(`Photo made ${newPublicState ? 'public' : 'private'}`, 'success');
    } catch (error) {
      console.error('Error updating photo visibility:', error);
      showToast('Failed to update photo visibility', 'error');
    }
  };

  // ─── Empty state ───────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center relative">
        {/* Floating icon trio */}
        <div className="flex items-end justify-center gap-4 mb-10">
          {[
            { icon: Camera, bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)', delay: '0s', size: 'w-16 h-16' },
            { icon: Heart,  bg: 'rgba(236,72,153,0.08)', color: '#ec4899', border: 'rgba(236,72,153,0.18)', delay: '0.4s', size: 'w-12 h-12', extra: 'mb-2' },
            { icon: Users,  bg: 'rgba(245,158,11,0.08)', color: '#d97706', border: 'rgba(245,158,11,0.18)', delay: '0.8s', size: 'w-14 h-14' },
          ].map(({ icon: Icon, bg, color, border, delay, size, extra = '' }) => (
            <div
              key={delay}
              className={`${size} ${extra} rounded-2xl flex items-center justify-center floating`}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: `0 8px 32px ${color}18`,
                animationDelay: delay,
              }}
            >
              <Icon style={{ color, width: '50%', height: '50%' }} />
            </div>
          ))}
        </div>

        <h2
          className="text-4xl font-extrabold mb-4 leading-tight"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
        >
          Your story starts here
        </h2>
        <p className="text-base mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Upload your first photo and begin preserving the moments that matter most.
          Every image holds a story — what's yours?
        </p>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary btn-hover-effect inline-flex items-center gap-3 px-8 py-4 text-base font-bold"
        >
          <Plus className="w-5 h-5" />
          Add Your First Photo
        </button>
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
      </>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2"
            style={{ color: 'var(--accent)' }}
          >
            Memory Library
          </p>
          <h1
            className="text-5xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            My Photos
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--text-muted)' }}>
            {photos.length} {photos.length === 1 ? 'memory' : 'memories'} in your collection
          </p>
        </div>
        {/* Decorative accent mark */}
        <div
          className="hidden sm:block w-16 h-1 rounded-full mb-1"
          style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7,transparent)' }}
        />
      </div>

      {/* ── Search & filter ── */}
      <TagFilter
        availableTags={availableTags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        onSearch={setSearchQuery}
      />

      {/* ── Photo grid ── */}
      {filteredPhotos.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? `No photos found for "${searchQuery}"` : 'No photos match your filters'}
          </p>
          <button
            onClick={() => { setSelectedTag('all'); setSearchQuery(''); }}
            className="text-sm font-semibold transition-colors"
            style={{ color: '#7c3aed' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#6d28d9'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed'}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div
          className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredPhotos.map((photo, index) => {
              const isFeatured = index === 0 && filteredPhotos.length > 2;
              return photo.is_gallery_tile ? (
                <motion.div
                  key={photo.id}
                  className={isFeatured ? 'lg:col-span-2' : ''}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  layout
                >
                  <PhotoTile
                    photo={photo}
                    isFlipped={false}
                    onFlip={() => {}}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    viewMode="slide"
                    onPhotoAdded={() => {
                      fetchPhotos();
                      showToast('Photo added to gallery!', 'success');
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={photo.id}
                  className={isFeatured ? 'lg:col-span-2 cursor-pointer' : 'cursor-pointer'}
                  onClick={() => handlePhotoClick(photo.id)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  layout
                >
                  <PhotoCard
                    photo={photo}
                    isFlipped={false}
                    onFlip={() => {}}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    viewMode="slide"
                    onTogglePublic={() => togglePhotoPublic(photo)}
                    featured={isFeatured}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Floating add button */}
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

      <PhotoViewerModal
        photos={filteredPhotos}
        initialIndex={viewerPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
