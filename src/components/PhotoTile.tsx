import React, { useState, useEffect } from 'react';
import { Images, Calendar, X, Edit3, Trash2, Eye, EyeOff, Save, Plus, Tag, Globe, Lock } from 'lucide-react';
import { PhotoCard } from './PhotoCard';
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
  onPhotoAdded?: () => void;
}

export function PhotoTile({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode, onPhotoAdded }: PhotoTileProps) {
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

  // Derived values — must be declared BEFORE any useEffect that references them
  // to avoid a Temporal Dead Zone (TDZ) error in minified production builds.
  const photoCount = photo.gallery_photos?.length || 0;
  const currentPhoto = photo.gallery_photos?.[currentPhotoIndex] || photo;

  // Sync edit form when navigating between photos
  useEffect(() => {
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

  // Keyboard navigation
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExpanded, currentPhotoIndex, photoCount]);

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
    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : photoCount - 1));
  };

  const goToNext = () => {
    setCurrentPhotoIndex(prev => (prev < photoCount - 1 ? prev + 1 : 0));
  };

  const handleSave = async () => {
    try {
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

      await supabase.from('photo_tags').delete().eq('photo_id', currentPhoto.id);

      if (editData.tags.length > 0) {
        const tagInserts = editData.tags.map(tagName => ({
          photo_id: currentPhoto.id,
          tag_name: tagName
        }));
        const { error: insertTagsError } = await supabase.from('photo_tags').insert(tagInserts);
        if (insertTagsError) throw insertTagsError;
      }

      if (photo.gallery_photos) {
        const updated = [...photo.gallery_photos];
        updated[currentPhotoIndex] = {
          ...currentPhoto,
          title: editData.title,
          date_taken: editData.date_taken,
          reason: editData.reason,
          is_public: editData.is_public,
          tags: editData.tags
        };
        onUpdate({ ...photo, gallery_photos: updated });
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

  const handleAddNewTag = () => {
    if (!newTag.trim()) return;
    const t = newTag.trim();
    if (!availableTags.includes(t)) setAvailableTags(prev => [...prev, t].sort());
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.includes(t) ? prev.tags : [...prev.tags, t]
    }));
    setNewTag('');
    setShowNewTag(false);
  };

  const togglePublic = async () => {
    try {
      const next = !currentPhoto.is_public;
      const { error } = await supabase
        .from('photos')
        .update({ is_public: next })
        .eq('id', currentPhoto.id);
      if (error) throw error;

      if (photo.gallery_photos) {
        const updated = [...photo.gallery_photos];
        updated[currentPhotoIndex] = { ...currentPhoto, is_public: next };
        onUpdate({ ...photo, gallery_photos: updated });
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      const { error } = await supabase.from('photos').delete().eq('id', currentPhoto.id);
      if (error) throw error;

      if (photoCount <= 1) {
        onDelete(photo.id);
        return;
      }

      if (photo.gallery_photos) {
        const updated = photo.gallery_photos.filter(p => p.id !== currentPhoto.id);
        if (currentPhotoIndex >= updated.length) setCurrentPhotoIndex(updated.length - 1);
        onUpdate({ ...photo, gallery_photos: updated });
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // ─── Fullscreen gallery lightbox ─────────────────────────────────────
  if (isExpanded) {
    const visibleTags = isEditing
      ? editData.tags.filter(t => !t.startsWith('gallery_'))
      : currentPhoto.tags?.filter(t => !t.startsWith('gallery_')) ?? [];

    const hasInfo = (isEditing ? editData.reason : currentPhoto.reason) || visibleTags.length > 0;

    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ background: '#03050c' }}
        onClick={handleClose}
      >
        {/* ── Top bar ── */}
        <div
          className="flex-shrink-0 flex items-start justify-between px-7 pt-6 pb-3 z-10"
          style={{ background: 'linear-gradient(to bottom,rgba(3,5,12,0.95) 60%,transparent)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Left — title + meta */}
          <div className="flex-1 min-w-0 pr-4">
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
                className="w-full text-2xl font-bold bg-transparent outline-none border-b pb-0.5"
                style={{ color: '#f5f8ff', borderColor: 'rgba(45,212,191,0.4)', letterSpacing: '-0.025em' }}
              />
            ) : (
              <h2
                className="text-2xl font-bold leading-tight truncate"
                style={{ color: '#f5f8ff', letterSpacing: '-0.025em' }}
              >
                {currentPhoto.title}
              </h2>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.date_taken}
                  onChange={e => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                  placeholder="Date (e.g. Jan 2025)"
                  className="text-[13px] bg-transparent outline-none border-b w-36"
                  style={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.15)' }}
                />
              ) : (
                currentPhoto.date_taken && (
                  <span className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    <Calendar className="w-3 h-3" />
                    {currentPhoto.date_taken}
                  </span>
                )
              )}

              {/* Visibility badge */}
              <button
                onClick={e => { e.stopPropagation(); togglePublic(); }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all"
                style={
                  currentPhoto.is_public
                    ? { background: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {currentPhoto.is_public ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                {currentPhoto.is_public ? 'Public' : 'Private'}
              </button>

              {photoCount > 1 && (
                <span className="text-[13px] tabular-nums" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {currentPhotoIndex + 1}
                  <span style={{ margin: '0 3px', color: 'rgba(255,255,255,0.12)' }}>/</span>
                  {photoCount}
                </span>
              )}
            </div>
          </div>

          {/* Right — action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {isEditing ? (
              <>
                <button
                  onClick={e => { e.stopPropagation(); handleSave(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
                  style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleCancel(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.09)' }}
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setIsEditing(true); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.09)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; }}
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={e => { e.stopPropagation(); handleDeletePhoto(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.09)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={e => { e.stopPropagation(); handleClose(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.09)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'; }}
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Image — dominant centrepiece ── */}
        <div
          className="flex-1 relative flex items-center justify-center min-h-0"
          style={{ padding: photoCount > 1 ? '8px 76px' : '8px 32px' }}
          onClick={e => e.stopPropagation()}
        >
          {photoCount > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <img
            key={currentPhotoIndex}
            src={currentPhoto.image_url ?? ''}
            alt={currentPhoto.title}
            className="max-h-full max-w-full rounded-xl"
            style={{ objectFit: 'contain', boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.65)' }}
            draggable={false}
          />

          {photoCount > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Bottom info + thumbnails ── */}
        <div
          className="flex-shrink-0 px-7"
          style={{ background: 'linear-gradient(to top,rgba(3,5,12,0.95) 60%,transparent)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Story + tags */}
          {(hasInfo || isEditing) && (
            <div className="pt-4 pb-3">
              {isEditing ? (
                <textarea
                  value={editData.reason}
                  onChange={e => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  placeholder="Add a story…"
                  className="w-full text-sm bg-transparent outline-none resize-none border-b mb-3"
                  style={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.1)', maxWidth: '600px' }}
                />
              ) : (
                currentPhoto.reason && (
                  <p className="text-sm leading-relaxed line-clamp-2 max-w-3xl mb-2.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    {currentPhoto.reason}
                  </p>
                )
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(45,212,191,0.06)', color: 'rgba(45,212,191,0.6)', border: '1px solid rgba(45,212,191,0.1)' }}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => setEditData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                        className="ml-0.5 hover:text-red-400 transition-colors"
                        style={{ color: 'rgba(45,212,191,0.5)' }}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}

                {isEditing && (
                  showNewTag ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddNewTag(); if (e.key === 'Escape') { setShowNewTag(false); setNewTag(''); } }}
                        autoFocus
                        placeholder="Tag name"
                        className="text-[11px] bg-transparent outline-none border-b w-20"
                        style={{ color: '#2dd4bf', borderColor: 'rgba(45,212,191,0.3)' }}
                      />
                      <button onClick={handleAddNewTag} className="text-[11px] font-semibold" style={{ color: '#2dd4bf' }}>Add</button>
                      <button onClick={() => { setShowNewTag(false); setNewTag(''); }} className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewTag(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all"
                      style={{ background: 'rgba(45,212,191,0.06)', color: 'rgba(45,212,191,0.5)', border: '1px dashed rgba(45,212,191,0.2)' }}
                    >
                      <Plus className="w-2.5 h-2.5" /> Tag
                    </button>
                  )
                )}
              </div>

              {/* Public checkbox while editing */}
              {isEditing && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.is_public}
                    onChange={e => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: '#2dd4bf' }}
                  />
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Make public</span>
                </label>
              )}
            </div>
          )}

          {/* Thumbnail strip */}
          {photoCount > 1 && (
            <div className="flex gap-2 items-center overflow-x-auto pb-4 pt-1" style={{ scrollbarWidth: 'none' }}>
              {photo.gallery_photos?.map((gp, idx) => (
                <button
                  key={gp.id}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all duration-150"
                  style={{
                    border: idx === currentPhotoIndex ? '2px solid #2dd4bf' : '2px solid rgba(255,255,255,0.07)',
                    opacity: idx === currentPhotoIndex ? 1 : 0.45,
                    boxShadow: idx === currentPhotoIndex ? '0 0 12px rgba(45,212,191,0.3)' : 'none',
                  }}
                  onMouseEnter={e => { if (idx !== currentPhotoIndex) (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; }}
                  onMouseLeave={e => { if (idx !== currentPhotoIndex) (e.currentTarget as HTMLButtonElement).style.opacity = '0.45'; }}
                >
                  <img src={gp.image_url ?? ''} alt={gp.title} className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                onClick={e => { e.stopPropagation(); setIsAddModalOpen(true); }}
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(45,212,191,0.35)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(45,212,191,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; }}
                title="Add photo"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {photoCount <= 1 && <div className="h-5" />}
        </div>

        {/* Add Photo Modal */}
        <AddPhotoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPhotoAdded={() => { setIsAddModalOpen(false); onPhotoAdded?.(); }}
          existingGalleryId={photo.tags?.find(tag => tag.startsWith('gallery_'))?.replace('gallery_', '') || undefined}
          galleryTitle={photo.title}
        />
      </div>
    );
  }

  // ─── Gallery tile card (collapsed) — matches PhotoCard light style ───
  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-white"
      style={{
        boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.06)',
        transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1), box-shadow 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={handleExpand}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 48px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.06)';
      }}
    >
      {/* ── Image section ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <img
          src={photo.image_url ?? ''}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />

        {/* Top gradient for badge/button legibility */}
        <div
          className="absolute inset-x-0 top-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)' }}
        />

        {/* Gallery count badge — top left, always visible */}
        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 text-white text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.42)' }}
        >
          <Images className="w-3 h-3" />
          {photoCount} photos
        </div>

        {/* Expand hint — center, fades in on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div
            className="p-2.5 rounded-full backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Info section — below image ── */}
      <div style={{ padding: '14px 16px 16px', background: '#ffffff' }}>
        <h3
          style={{
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '15px',
            lineHeight: 1.35,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {photo.title}
        </h3>

        {photo.date_taken && (
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {photo.date_taken}
            </span>
          </div>
        )}

        {(() => {
          const visibleTags = photo.tags?.filter(t => !t.startsWith('gallery_')) ?? [];
          return visibleTags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {visibleTags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.07)',
                    color: '#7c3aed',
                    border: '1px solid rgba(124,58,237,0.14)',
                  }}
                >
                  {tag}
                </span>
              ))}
              {visibleTags.length > 3 && (
                <span
                  className="px-2 py-0.5 text-[11px] rounded-full"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  +{visibleTags.length - 3}
                </span>
              )}
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
