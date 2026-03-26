import React, { useState } from 'react';
import { Calendar, Pencil, Trash2, Save, Plus, Lock, Unlock, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { LazyImage } from './LazyImage';
import { useToast } from '../hooks/useToast';
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

  // ─── Edit form ─────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Edit photo</h3>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Title
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)'; }}
              onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Date taken
            </label>
            <input
              type="text"
              value={editData.date_taken}
              onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
              placeholder="e.g. Jan 2025"
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)'; }}
              onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
            />
          </div>

          {/* Story */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Story
            </label>
            <textarea
              value={editData.reason}
              onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none"
              rows={3}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(45,212,191,0.4)'; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)'; }}
              onBlur={e =>  { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; (e.target as HTMLTextAreaElement).style.boxShadow = 'none'; }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                  style={
                    editData.tags.includes(tag)
                      ? { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }
                      : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewTag(true)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1"
                style={{ background: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }}
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
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg outline-none transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)'; }}
                  onBlur={e =>  { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
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
                  onClick={() => { setShowNewTag(false); setNewTag(''); }}
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
              onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#2dd4bf' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Make this photo public</span>
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
            style={{ background: 'linear-gradient(135deg,#2dd4bf,#06b6d4)', color: '#090d18', boxShadow: '0 4px 16px rgba(45,212,191,0.3)' }}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
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
    <div
      className="group relative rounded-2xl overflow-hidden aspect-[4/3] transition-all duration-400"
      style={{
        background: '#0a0e1a',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(45,212,191,0.15)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <LazyImage
        src={photo.image_url ?? ''}
        alt={photo.title}
        className="w-full h-full transition-transform duration-600 group-hover:scale-[1.05]"
      />

      {/* Multi-layer gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0) 70%)',
        }}
      />
      {/* Top fade for controls readability */}
      <div
        className="absolute inset-x-0 top-0 h-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
      />

      {/* Top-right actions — revealed on hover */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePublic?.(); }}
          className="p-2 rounded-full backdrop-blur-sm transition-all"
          style={
            photo.is_public
              ? { background: 'rgba(45,212,191,0.85)', color: '#090d18' }
              : { background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }
          }
          title={photo.is_public ? 'Public' : 'Private'}
        >
          {photo.is_public ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); setConfirmingDelete(false); }}
          className="p-2 rounded-full backdrop-blur-sm transition-all"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)'}
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {confirmingDelete ? (
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1.5 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/90 text-xs font-medium">Delete?</span>
            <button onClick={handleDelete} className="text-xs font-bold ml-1" style={{ color: '#f87171' }}>
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
            className="p-2 rounded-full backdrop-blur-sm transition-all"
            style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.8)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.6)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.55)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom info bar — always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
        <h3 className="text-white font-semibold text-sm leading-snug truncate drop-shadow-md">
          {photo.title}
        </h3>
        {photo.date_taken && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(45,212,191,0.6)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{photo.date_taken}</span>
          </div>
        )}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {visibleTags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] rounded-full font-medium backdrop-blur-sm"
                style={{
                  background: 'rgba(45,212,191,0.12)',
                  color: 'rgba(45,212,191,0.9)',
                  border: '1px solid rgba(45,212,191,0.18)',
                }}
              >
                {tag}
              </span>
            ))}
            {visibleTags.length > 2 && (
              <span
                className="px-2 py-0.5 text-[10px] rounded-full backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              >
                +{visibleTags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
