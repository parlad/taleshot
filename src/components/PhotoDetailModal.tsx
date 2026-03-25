import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Tag as TagIcon, Edit3, Save, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { LazyImage } from './LazyImage';
import type { Photo } from '../types';

interface PhotoDetailModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedPhoto: Photo) => void;
  onDelete?: (id: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function PhotoDetailModal({
  photo,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: PhotoDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: photo.title,
    date_taken: photo.date_taken || '',
    reason: photo.reason,
    tags: [...(photo.tags || [])]
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setEditData({
      title: photo.title,
      date_taken: photo.date_taken || '',
      reason: photo.reason,
      tags: [...(photo.tags?.filter(tag => !tag.startsWith('gallery_')) || [])]
    });
  }, [photo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrevious) onPrevious?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrevious, onNext, onPrevious, onClose]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...photo,
        ...editData
      });
    }
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-6xl h-[90vh] bg-[#0d0d0d] rounded-2xl shadow-2xl overflow-hidden flex"
          initial={{ scale: 0.93, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.4 }}
        >
          {/* Left: image */}
          <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
            {hasPrevious && (
              <button
                onClick={onPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <LazyImage
              src={photo.image_url || photo.imageUrl || ''}
              alt={photo.title}
              className="max-w-full max-h-full object-contain"
            />
            {hasNext && (
              <button
                onClick={onNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Right: dark info panel */}
          <div className="w-80 bg-[#111] border-l border-white/8 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Details</span>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors"
                    aria-label="Edit photo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-white text-xs font-medium transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-white/70 hover:text-white text-xs font-medium transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-3.5 h-3.5" />
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5">
                  Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/8 border border-white/12 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                ) : (
                  <p className="text-white font-semibold text-base leading-snug">{photo.title}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Date Taken
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.date_taken}
                    onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                    placeholder="e.g., December 2024"
                    className="w-full px-3 py-2 bg-white/8 border border-white/12 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                ) : (
                  <p className="text-white/65 text-sm">{photo.date_taken || 'Not specified'}</p>
                )}
              </div>

              {/* Story */}
              <div>
                <label className="block text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5">
                  Story
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.reason}
                    onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-white/8 border border-white/12 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                  />
                ) : (
                  <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">{photo.reason || <span className="text-white/25 italic">No story added</span>}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 border border-white/10 text-white/70 rounded-full text-xs"
                    >
                      {tag}
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 transition-colors ml-0.5"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {editData.tags.length === 0 && !isEditing && (
                    <span className="text-white/25 text-xs italic">No tags</span>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag…"
                      className="flex-1 px-3 py-1.5 bg-white/8 border border-white/12 rounded-lg text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/12 rounded-lg text-white/70 text-xs transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-2 pt-1">
                {photo.is_public ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/10 text-white/55 rounded-full text-xs">
                    <Eye className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 border border-white/10 text-white/55 rounded-full text-xs">
                    <EyeOff className="w-3 h-3" /> Private
                  </span>
                )}
              </div>
            </div>

            {/* Delete footer */}
            {onDelete && (
              <div className="px-5 py-4 border-t border-white/8 shrink-0">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this photo?')) {
                      onDelete(photo.id);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Photo
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
