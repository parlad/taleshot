import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag as TagIcon, Edit3, Save, Trash2, ChevronLeft, ChevronRight, Lock, Unlock, Plus } from 'lucide-react';
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
    setIsEditing(false);
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
      onUpdate({ ...photo, ...editData });
    }
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      setEditData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const visibleTags = editData.tags.filter(t => !t.startsWith('gallery_'));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <div className="relative min-h-screen flex items-start justify-center p-4 py-8">
          <motion.div
            className="relative w-full max-w-4xl card-glass"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header: title + meta ── */}
            <div className="px-8 pt-8 pb-6">
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
                    <h1 className="text-3xl font-bold gradient-text leading-snug">{photo.title}</h1>
                  )}

                  {/* Story — sits like a subtitle right under title */}
                  <div className="mt-1.5">
                    {isEditing ? (
                      <textarea
                        value={editData.reason}
                        onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                        rows={2}
                        placeholder="Add a story…"
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/50 text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none"
                      />
                    ) : (
                      photo.reason && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{photo.reason}</p>
                      )
                    )}
                  </div>

                  {/* Meta badges row — no raw date text */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {isEditing && (
                      <input
                        type="text"
                        value={editData.date_taken}
                        onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                        placeholder="Date taken (e.g. Jan 2025)"
                        className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 text-gray-700 dark:text-gray-300 placeholder-gray-400"
                      />
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      photo.is_public
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {photo.is_public ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {photo.is_public ? 'Public' : 'Private'}
                    </span>
                    {(hasPrevious || hasNext) && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={onPrevious}
                          disabled={!hasPrevious}
                          className="p-1.5 rounded-lg disabled:opacity-30 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={onNext}
                          disabled={!hasNext}
                          className="p-1.5 rounded-lg disabled:opacity-30 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {visibleTags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium"
                        >
                          {tag}
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveTag(tag)}
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
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="Add tag"
                            className="w-24 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-400"
                          />
                          <button
                            onClick={handleAddTag}
                            className="p-1 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-colors"
                            title="Add tag"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
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
                    <button
                      onClick={handleSave}
                      className="p-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this photo?')) {
                          onDelete(photo.id);
                          onClose();
                        }
                      }}
                      className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Image — seamless, no gray separator ── */}
            <div className="rounded-b-2xl overflow-hidden">
              <LazyImage
                src={photo.image_url || photo.imageUrl || ''}
                alt={photo.title}
                className="w-full max-h-[65vh] object-contain"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

