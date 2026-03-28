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
  featured?: boolean;
}

export function PhotoCard({ photo, onDelete, onUpdate, onTogglePublic, featured }: PhotoCardProps) {
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
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
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
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
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
                (e.target as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.35)';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.07)';
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
                (e.target as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.35)';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.07)';
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
                (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(124,58,237,0.35)';
                (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(124,58,237,0.07)';
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
                          background: 'rgba(124,58,237,0.1)',
                          color: '#7c3aed',
                          border: '1px solid rgba(124,58,237,0.25)',
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
                  background: 'rgba(124,58,237,0.07)',
                  color: '#7c3aed',
                  border: '1px solid rgba(124,58,237,0.18)',
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
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.35)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="px-2.5 py-1.5 text-xs rounded-lg transition-colors"
                  style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}
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
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
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
              style={{ accentColor: '#7c3aed' }}
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
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(124,58,237,0.28)',
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
              ((e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)')
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
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-white"
      style={{
        boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.06)',
        transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1), box-shadow 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 20px 48px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 1px 4px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.06)';
      }}
    >
      {/* ── Image section ── */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: featured ? '16 / 9' : '4 / 3' }}
      >
        <LazyImage
          src={photo.image_url ?? ''}
          alt={photo.title}
          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.05]"
          style={{ objectFit: 'cover' }}
        />

        {/* Top gradient for button legibility */}
        <div
          className="absolute inset-x-0 top-0 h-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)' }}
        />

        {/* Public badge — top left */}
        {photo.is_public && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm flex items-center gap-1"
            style={{
              background: 'rgba(124,58,237,0.85)',
              color: '#fff',
            }}
          >
            <Unlock className="w-2.5 h-2.5" />
            Public
          </div>
        )}

        {/* Action buttons — top right, fade in on hover */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          {/* Public toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePublic?.();
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            style={{
              background: photo.is_public ? 'rgba(124,58,237,0.85)' : 'rgba(255,255,255,0.82)',
              color: photo.is_public ? '#fff' : '#1a1714',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
            title={photo.is_public ? 'Public — click to make private' : 'Private — click to make public'}
          >
            {photo.is_public ? (
              <Unlock className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
          </button>

          {/* Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setConfirmingDelete(false);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.82)',
              color: '#1a1714',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,1)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.82)')
            }
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>

          {/* Delete / confirm */}
          {confirmingDelete ? (
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 backdrop-blur-sm"
              style={{
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[11px] font-medium" style={{ color: '#1a1714' }}>Delete?</span>
              <button
                onClick={handleDelete}
                className="text-[11px] font-bold ml-1"
                style={{ color: '#dc2626' }}
              >
                Yes
              </button>
              <span className="text-[11px] mx-0.5" style={{ color: '#a09890' }}>·</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className="text-[11px] transition-colors"
                style={{ color: '#5c5550' }}
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
              className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.82)',
                color: '#1a1714',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.9)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.82)';
                (e.currentTarget as HTMLButtonElement).style.color = '#1a1714';
              }}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Info section — below image ── */}
      <div
        style={{
          padding: featured ? '18px 20px 20px' : '14px 16px 16px',
          background: '#ffffff',
        }}
      >
        <h3
          style={{
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: featured ? '18px' : '15px',
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
            <Calendar
              className="w-3 h-3 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            />
            <span
              style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}
            >
              {photo.date_taken}
            </span>
          </div>
        )}

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {visibleTags.slice(0, featured ? 5 : 3).map((tag, i) => (
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
            {visibleTags.length > (featured ? 5 : 3) && (
              <span
                className="px-2 py-0.5 text-[11px] rounded-full"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                }}
              >
                +{visibleTags.length - (featured ? 5 : 3)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
