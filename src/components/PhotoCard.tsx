import React, { useState } from 'react';
import { Calendar, Pencil, Trash2, Save, Plus, Lock, Unlock, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { LazyImage } from './LazyImage';
import { useToast } from '../context/ToastContext';
import type { Photo, ViewMode } from '../types';

interface PhotoCardProps {
  photo: Photo;
  isFlipped: boolean;      // kept for API compatibility
  onFlip: () => void;      // kept for API compatibility
  onDelete: (id: string) => void;
  onUpdate: (updatedPhoto: Photo) => void;
  viewMode: ViewMode;      // kept for API compatibility
  onTogglePublic?: () => void;
}

export function PhotoCard({ photo, onDelete, onUpdate, onTogglePublic }: PhotoCardProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          title: editData.title,
          date_taken: editData.date_taken,
          reason: editData.reason,
          is_public: editData.is_public
        })
        .eq('id', photo.id);

      if (error) throw error;

      const { error: deleteTagsError } = await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', photo.id);

      if (deleteTagsError) throw deleteTagsError;

      if (editData.tags.length > 0) {
        const tagInserts = editData.tags.map(tagName => ({
          photo_id: photo.id,
          tag_name: tagName
        }));

        const { error: insertTagsError } = await supabase
          .from('photo_tags')
          .insert(tagInserts);

        if (insertTagsError) throw insertTagsError;
      }

      const updatedPhoto: Photo = {
        ...photo,
        title: editData.title,
        date_taken: editData.date_taken,
        reason: editData.reason,
        is_public: editData.is_public,
        tags: editData.tags
      };

      onUpdate(updatedPhoto);
      setIsEditing(false);
      showToast('Photo updated successfully');
    } catch (error) {
      console.error('Error updating photo:', error);
      showToast('Failed to update photo. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: photo.title,
      date_taken: photo.date_taken || '',
      reason: photo.reason,
      is_public: photo.is_public || false,
      tags: [...(photo.tags || [])]
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      onDelete(photo.id);
      showToast('Photo deleted');
    } catch (error) {
      console.error('Error deleting photo:', error);
      showToast('Failed to delete photo. Please try again.', 'error');
    }
  };

  // ─── Edit view ─────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Edit photo</h3>
            <button
              onClick={handleCancel}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500/30 focus:border-slate-400 outline-none transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Date taken</label>
            <input
              type="text"
              value={editData.date_taken}
              onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500/30 focus:border-slate-400 outline-none transition-all"
              placeholder="e.g. Jan 2025"
            />
          </div>

          {/* Story */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Story</label>
            <textarea
              value={editData.reason}
              onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500/30 focus:border-slate-400 outline-none transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    editData.tags.includes(tag)
                      ? 'bg-slate-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewTag(true)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {showNewTag && (
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Tag name"
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="px-2.5 py-1.5 text-xs bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewTag(false); setNewTag(''); }}
                  className="px-2.5 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Visibility */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={editData.is_public}
              onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-4 h-4 rounded text-slate-700 border-gray-300 focus:ring-slate-500"
            />
            <span className="text-sm text-gray-700">Make this photo public</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Photo card view ────────────────────────────────────────────────
  const visibleTags = photo.tags?.filter(t => !t.startsWith('gallery_')) ?? [];

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-900 aspect-[4/3]">
      <LazyImage
        src={photo.image_url ?? ''}
        alt={photo.title}
        className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Top-right actions — revealed on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePublic?.(); }}
          className={`p-2 rounded-full backdrop-blur-sm text-white transition-all ${
            photo.is_public
              ? 'bg-blue-500/90 hover:bg-blue-600'
              : 'bg-black/50 border border-white/20 hover:bg-black/70'
          }`}
          title={photo.is_public ? 'Public' : 'Private'}
        >
          {photo.is_public ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); setConfirmingDelete(false); }}
          className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {confirmingDelete ? (
          <div
            className="flex items-center gap-1 bg-black/75 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/90 text-xs font-medium">Delete?</span>
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 font-bold ml-1">
              Yes
            </button>
            <span className="text-white/30 mx-0.5">·</span>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); }}
              className="text-xs text-white/70 hover:text-white"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500/80 hover:border-red-400 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom info — always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
        <h3 className="text-white font-semibold text-sm leading-snug truncate drop-shadow">
          {photo.title}
        </h3>
        {photo.date_taken && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 text-white/50 flex-shrink-0" />
            <span className="text-white/60 text-xs">{photo.date_taken}</span>
          </div>
        )}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {visibleTags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-white/15 backdrop-blur-sm text-white/85 text-[10px] rounded-full font-medium border border-white/10"
              >
                {tag}
              </span>
            ))}
            {visibleTags.length > 2 && (
              <span className="px-1.5 py-0.5 bg-white/15 text-white/55 text-[10px] rounded-full">
                +{visibleTags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

