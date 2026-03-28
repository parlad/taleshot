import React, { useState } from 'react';
import { Calendar, Pencil, Trash2, Save, Plus, Lock, Unlock, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { LazyImage } from './LazyImage';
import { useToast } from '../hooks/useToast';
import type { Photo, ViewMode } from '../types';

interface PhotoCardProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedPhoto: Photo) => void;
  viewMode: ViewMode;
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
    tags: [...(photo.tags || [])],
  });
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Family', 'Vacation', 'Celebration', 'Nature', 'Food', 'Pets', 'Travel', 'Japan', 'Village',
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
          is_public: editData.is_public,
        })
        .eq('id', photo.id);

      if (error) throw error;

      await supabase.from('photo_tags').delete().eq('photo_id', photo.id);

      if (editData.tags.length > 0) {
        const tagInserts = editData.tags.map((tagName) => ({
          photo_id: photo.id,
          tag_name: tagName,
        }));
        const { error: insertTagsError } = await supabase.from('photo_tags').insert(tagInserts);
        if (insertTagsError) throw insertTagsError;
      }

      const updatedPhoto: Photo = {
        ...photo,
        title: editData.title,
        date_taken: editData.date_taken,
        reason: editData.reason,
        is_public: editData.is_public,
        tags: editData.tags,
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
      tags: [...(photo.tags || [])],
    });
    setNewTag('');
    setShowNewTag(false);
    setIsEditing(false);
  };

  const handleTagToggle = (tagName: string) => {
    setEditData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const handleAddNewTag = () => {
    if (!newTag.trim()) return;
    const trimmedTag = newTag.trim();
    if (!availableTags.includes(trimmedTag)) {
      setAvailableTags((prev) => [...prev, trimmedTag].sort());
    }
    setEditData((prev) => ({
      ...prev,
      tags: prev.tags.includes(trimmedTag) ? prev.tags : [...prev.tags, trimmedTag],
    }));
    setNewTag('');
    setShowNewTag(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('photos').delete().eq('id', photo.id);
      if (error) throw error;
      onDelete(photo.id);
      showToast('Photo deleted');
    } catch (error) {
      console.error('Error deleting photo:', error);
      showToast('Failed to delete photo. Please try again.', 'error');
    }
  };

  // ─── Edit form ────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Edit photo
            </h3>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Title
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Date */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Date taken
            </label>
            <input
              type="text"
              value={editData.date_taken}
              onChange={(e) => setEditData((prev) => ({ ...prev, date_taken: e.target.value }))}
              placeholder="e.g. Jan 2025"
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Story */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Story
            </label>
            <textarea
              value={editData.reason}
              onChange={(e) => setEditData((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none"
              rows={3}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(45,212,191,0.4)';
                (e.target as HTMLTextAreaElement).style.boxShadow =
                  '0 0 0 3px rgba(45,212,191,0.08)';
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)';
                (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                  style={
                    editData.tags.includes(tag)
                      ? {
                          background: 'rgba(45,212,191,0.15)',
                          color: '#2dd4bf',
                          border: '1px solid rgba(45,212,191,0.3)',
                        }
                      : {
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }
                  }
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewTag(true)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1"
                style={{
                  background: 'rgba(45,212,191,0.08)',
                  color: '#2dd4bf',
                  border: '1px solid rgba(45,212,191,0.2)',
                }}
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
                  placeholder="Tag name"
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="px-2.5 py-1.5 text-xs rounded-lg transition-colors"
                  style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTag(false);
                    setNewTag('');
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg transition-colors"
                  style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
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
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, is_public: e.target.checked }))
              }
              className="w-4 h-4 rounded"
              style={{ accentColor: '#2dd4bf' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Make this photo public
            </span>
          </label>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3.5 flex gap-2"
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#2dd4bf,#06b6d4)',
              color: '#060a14',
              boxShadow: '0 4px 16px rgba(45,212,191,0.3)',
            }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'transparent' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
            }
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Card view ────────────────────────────────────────────────────────
  const visibleTags = photo.tags?.filter((t) => !t.startsWith('gallery_')) ?? [];

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: '#07090f',
        aspectRatio: '4 / 3',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 20px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(45,212,191,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
      }}
    >
      {/* Photo */}
      <LazyImage
        src={photo.image_url ?? ''}
        alt={photo.title}
        className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]"
        style={{ objectFit: 'cover' }}
      />

      {/* Gradient layers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0) 100%)',
        }}
      />
      {/* Top fade (for action buttons readability) */}
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
      />

      {/* Action buttons — fade in on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        {/* Public toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePublic?.();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
          style={
            photo.is_public
              ? { background: 'rgba(45,212,191,0.8)', color: '#060a14' }
              : {
                  background: 'rgba(0,0,0,0.55)',
                  color: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }
          }
          title={photo.is_public ? 'Public — click to make private' : 'Private — click to make public'}
        >
          {photo.is_public ? (
            <Unlock className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Edit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
            setConfirmingDelete(false);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)')
          }
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Delete / confirm */}
        {confirmingDelete ? (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 backdrop-blur-sm"
            style={{
              background: 'rgba(0,0,0,0.82)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/80 text-[11px] font-medium">Delete?</span>
            <button
              onClick={handleDelete}
              className="text-[11px] font-bold ml-1"
              style={{ color: '#f87171' }}
            >
              Yes
            </button>
            <span className="text-white/25 mx-0.5">·</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(false);
              }}
              className="text-[11px] text-white/55 hover:text-white transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            style={{
              background: 'rgba(0,0,0,0.55)',
              color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.75)';
              (e.currentTarget as HTMLButtonElement).style.color = 'white';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                'rgba(255,255,255,0.15)';
            }}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom info — always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
        <h3
          className="text-white font-semibold text-[15px] leading-snug truncate"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          {photo.title}
        </h3>

        {photo.date_taken && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(45,212,191,0.55)' }} />
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {photo.date_taken}
            </span>
          </div>
        )}

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {visibleTags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full backdrop-blur-sm"
                style={{
                  background: 'rgba(45,212,191,0.1)',
                  color: 'rgba(45,212,191,0.85)',
                  border: '1px solid rgba(45,212,191,0.15)',
                }}
              >
                {tag}
              </span>
            ))}
            {visibleTags.length > 3 && (
              <span
                className="px-2 py-0.5 text-[10px] rounded-full backdrop-blur-sm"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                +{visibleTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
