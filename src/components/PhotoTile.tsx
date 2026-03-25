import React, { useState } from 'react';
import { Images, Calendar, Tag, X, Edit3, Trash2, Eye, EyeOff, Save, Plus, Maximize2 } from 'lucide-react';
import { PhotoCard } from './PhotoCard';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import { AddPhotoModal } from './AddPhotoModal';
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
  onPhotoAdded?: () => void;
}

export function PhotoTile({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode, onGroupSelect, onPhotoAdded }: PhotoTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [editData, setEditData] = useState({
    title: photo.title,
    date_taken: photo.date_taken || '',
    reason: photo.reason,
    is_public: photo.is_public || false,
    tags: [...(photo.tags || [])]
  });
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Family', 'Vacation', 'Celebration', 'Nature', 'Food', 'Pets', 'Travel', 'Japan', 'Village'
  ]);
  const [newTag, setNewTag] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);

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

  const photoCount = photo.gallery_photos?.length || 0;
  const currentPhoto = photo.gallery_photos?.[currentPhotoIndex] || photo;

  const handleExpand = () => {
    setIsExpanded(true);
    setCurrentPhotoIndex(0);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsEditing(false);
    setCurrentPhotoIndex(0);
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : photoCount - 1);
  };

  const goToNext = () => {
    setCurrentPhotoIndex(prev => prev < photoCount - 1 ? prev + 1 : 0);
  };

  const handleSave = async () => {
    try {
      // Update the current photo
      const { error } = await supabase
        .from('photos')
        .update({
          title: editData.title,
          date_taken: editData.date_taken,
          reason: editData.reason,
          is_public: editData.is_public
        })
        .eq('id', currentPhoto.id);

      if (error) throw error;

      // Delete existing photo tags
      const { error: deleteTagsError } = await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', currentPhoto.id);

      if (deleteTagsError) throw deleteTagsError;

      // Insert new photo tags
      if (editData.tags.length > 0) {
        const tagInserts = editData.tags.map(tagName => ({
          photo_id: currentPhoto.id,
          tag_name: tagName
        }));

        const { error: insertTagsError } = await supabase
          .from('photo_tags')
          .insert(tagInserts);

        if (insertTagsError) throw insertTagsError;
      }

      // Update the photo in the gallery_photos array
      if (photo.gallery_photos) {
        const updatedGalleryPhotos = [...photo.gallery_photos];
        updatedGalleryPhotos[currentPhotoIndex] = {
          ...currentPhoto,
          title: editData.title,
          date_taken: editData.date_taken,
          reason: editData.reason,
          is_public: editData.is_public,
          tags: editData.tags
        };

        const updatedPhoto: Photo = {
          ...photo,
          gallery_photos: updatedGalleryPhotos
        };

        onUpdate(updatedPhoto);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: currentPhoto.title,
      date_taken: currentPhoto.date_taken || '',
      reason: currentPhoto.reason,
      is_public: currentPhoto.is_public || false,
      tags: [...(currentPhoto.tags || [])]
    });
    setNewTag('');
    setShowNewTag(false);
    setIsEditing(false);
  };

  const handleTagToggle = (tagName: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const handleAddNewTag = () => {
    if (!newTag.trim()) return;
    
    const trimmedTag = newTag.trim();
    if (!availableTags.includes(trimmedTag)) {
      setAvailableTags(prev => [...prev, trimmedTag].sort());
    }
    
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.includes(trimmedTag) ? prev.tags : [...prev.tags, trimmedTag]
    }));
    
    setNewTag('');
    setShowNewTag(false);
  };

  const togglePublic = async () => {
    try {
      const newPublicState = !currentPhoto.is_public;
      const { error } = await supabase
        .from('photos')
        .update({ is_public: newPublicState })
        .eq('id', currentPhoto.id);

      if (error) throw error;

      // Update the photo in the gallery_photos array
      if (photo.gallery_photos) {
        const updatedGalleryPhotos = [...photo.gallery_photos];
        updatedGalleryPhotos[currentPhotoIndex] = {
          ...currentPhoto,
          is_public: newPublicState
        };

        const updatedPhoto: Photo = {
          ...photo,
          gallery_photos: updatedGalleryPhotos
        };

        onUpdate(updatedPhoto);
      }
    } catch (error) {
      console.error('Error updating photo visibility:', error);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', currentPhoto.id);

      if (error) throw error;

      // If this was the last photo in the gallery, delete the entire tile
      if (photoCount <= 1) {
        onDelete(photo.id);
        return;
      }

      // Remove the photo from the gallery_photos array
      if (photo.gallery_photos) {
        const updatedGalleryPhotos = photo.gallery_photos.filter(p => p.id !== currentPhoto.id);
        
        // Adjust current index if needed
        if (currentPhotoIndex >= updatedGalleryPhotos.length) {
          setCurrentPhotoIndex(updatedGalleryPhotos.length - 1);
        }

        const updatedPhoto: Photo = {
          ...photo,
          gallery_photos: updatedGalleryPhotos
        };

        onUpdate(updatedPhoto);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Update edit data when current photo changes
  React.useEffect(() => {
    if (currentPhoto && !isEditing) {
      setEditData({
        title: currentPhoto.title,
        date_taken: currentPhoto.date_taken || '',
        reason: currentPhoto.reason,
        is_public: currentPhoto.is_public || false,
        tags: [...(currentPhoto.tags || [])]
      });
    }
  }, [currentPhotoIndex, currentPhoto, isEditing]);

  // ─── Gallery lightbox view ──────────────────────────────────────────
  if (isExpanded) {
    const visibleTags = currentPhoto.tags?.filter(t => !t.startsWith('gallery_')) ?? [];

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={handleClose}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

        <div className="relative min-h-screen flex items-start justify-center p-4 py-8">
          <div
            className="relative w-full max-w-4xl card-glass"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header: title + meta + actions ── */}
            <div className="px-8 pt-8 pb-5 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full text-3xl font-bold bg-transparent border-b-2 border-teal-400 focus:outline-none text-gray-900 dark:text-white pb-1"
                      autoFocus
                    />
                  ) : (
                    <h1 className="text-3xl font-bold gradient-text leading-snug">{currentPhoto.title}</h1>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.date_taken}
                        onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                        placeholder="Date taken (e.g. Jan 2025)"
                        className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                      />
                    ) : (
                      currentPhoto.date_taken && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {currentPhoto.date_taken}
                        </span>
                      )
                    )}
                    <button
                      onClick={togglePublic}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        currentPhoto.is_public
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {currentPhoto.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {currentPhoto.is_public ? 'Public' : 'Private'}
                    </button>
                    {photoCount > 1 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {currentPhotoIndex + 1} / {photoCount}
                      </span>
                    )}
                  </div>

                  {/* Story */}
                  <div className="mt-4">
                    {isEditing ? (
                      <textarea
                        value={editData.reason}
                        onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                        rows={3}
                        placeholder="Add a story…"
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/50 text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none"
                      />
                    ) : (
                      currentPhoto.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{currentPhoto.reason}</p>
                      )
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {visibleTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium border border-gray-200 dark:border-gray-700"
                      >
                        {tag}
                        {isEditing && (
                          <button
                            onClick={() => setEditData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                            className="hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const t = newTag.trim();
                              if (t && !editData.tags.includes(t)) {
                                setEditData(prev => ({ ...prev, tags: [...prev.tags, t] }));
                              }
                              setNewTag('');
                            }
                          }}
                          placeholder="Add tag"
                          className="w-24 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button
                          onClick={handleAddNewTag}
                          className="p-1 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="p-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(); }}
                    className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Image with prev/next ── */}
            <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl overflow-hidden">
              {photoCount > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <img
                src={currentPhoto.image_url ?? ''}
                alt={currentPhoto.title}
                className="w-full max-h-[65vh] object-contain"
              />
              {photoCount > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* ── Thumbnail strip + add button ── */}
            {photoCount > 1 && (
              <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700/50 flex gap-2 items-center overflow-x-auto">
                {photo.gallery_photos?.map((gp, idx) => (
                  <button
                    key={gp.id}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all border-2 ${
                      idx === currentPhotoIndex
                        ? 'border-teal-500 opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={gp.image_url ?? ''} alt={gp.title} className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsAddModalOpen(true); }}
                  className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-400 transition-all"
                  title="Add photo"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Photo Modal */}
        <AddPhotoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPhotoAdded={() => {
            setIsAddModalOpen(false);
            onPhotoAdded?.();
          }}
          existingGalleryId={photo.tags?.find(tag => tag.startsWith('gallery_'))?.replace('gallery_', '') || undefined}
          galleryTitle={photo.title}
        />
      </div>
    );
  }

  // Regular tile view showing just the representative photo with gallery indicator
  // Gallery tile view
  return (
    <div
      className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-900 aspect-[4/3] cursor-pointer"
      onClick={handleExpand}
    >
      <img
        src={photo.image_url ?? ''}
        alt={photo.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Gallery badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-full border border-white/20">
        <Images className="w-3.5 h-3.5" />
        {photoCount} photos
      </div>

      {/* Expand hint on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="p-3 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
          <Maximize2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <h3 className="text-white font-semibold text-sm leading-snug truncate drop-shadow">
          {photo.title}
        </h3>
        {photo.date_taken && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 text-white/50 flex-shrink-0" />
            <span className="text-white/60 text-xs">{photo.date_taken}</span>
          </div>
        )}
      </div>
    </div>
  );
}