import React, { useState } from 'react';
import { Calendar, Edit3, Trash2, Eye, EyeOff, Save, X, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useToast } from '../hooks/useToast';
import type { PhotoCardProps, Photo } from '../types';

export function PhotoCard({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode = 'flip', isPublicView = false }: PhotoCardProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [editData, setEditData] = useState({
    title: photo.title,
    date_taken: photo.date_taken || '',
    reason: photo.reason,
    is_public: photo.is_public || false,
    tags: [...(photo.tags || [])]
  });

  const handleSave = async () => {
    setIsSaving(true);
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

      // Sync tags: delete all existing then insert new ones
      const { error: deleteTagsError } = await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', photo.id);

      if (deleteTagsError) throw deleteTagsError;

      if (editData.tags.length > 0) {
        const { error: insertTagsError } = await supabase
          .from('photo_tags')
          .insert(editData.tags.map(tag => ({ photo_id: photo.id, tag_name: tag })));

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

      onUpdate?.(updatedPhoto);
      setIsEditing(false);
      showToast('Photo updated successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update photo';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
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
    setNewTagInput('');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      onDelete(photo.id);
      showToast('Photo deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete photo';
      showToast(message, 'error');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const togglePublic = async () => {
    try {
      const newPublicState = !photo.is_public;
      const { error } = await supabase
        .from('photos')
        .update({ is_public: newPublicState })
        .eq('id', photo.id);

      if (error) throw error;

      onUpdate?.({ ...photo, is_public: newPublicState });
      showToast(newPublicState ? 'Photo is now public' : 'Photo is now private');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update visibility';
      showToast(message, 'error');
    }
  };

  const addTag = () => {
    const tag = newTagInput.trim();
    if (!tag || editData.tags.includes(tag)) return;
    setEditData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    setNewTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // ─── Slide / card view ───────────────────────────────────────────────────────
  if (viewMode === 'slide') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="aspect-square">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">{photo.title}</h3>
              {photo.date_taken && (
                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  {photo.date_taken}
                </div>
              )}
            </div>
            {!isPublicView && (
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={togglePublic}
                  className={`p-2 rounded-lg transition-colors ${
                    photo.is_public
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={photo.is_public ? 'Make private' : 'Make public'}
                >
                  {photo.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-700 leading-relaxed">{photo.reason}</p>

          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {photo.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Inline delete confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Delete this photo?</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-1.5 px-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit modal (overlay) for slide view */}
        {isEditing && (
          <SlideEditOverlay
            editData={editData}
            setEditData={setEditData}
            newTagInput={newTagInput}
            setNewTagInput={setNewTagInput}
            addTag={addTag}
            removeTag={removeTag}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        )}
      </div>
    );
  }

  // ─── Flip card view ──────────────────────────────────────────────────────────
  return (
    <div className="perspective w-full h-96">
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-700 ${
          isFlipped ? 'rotate-y-180' : ''
        } ${!isEditing ? 'cursor-pointer' : ''}`}
        onClick={!isEditing ? onFlip : undefined}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-lg">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-semibold mb-1">{photo.title}</h3>
            {photo.date_taken && (
              <div className="flex items-center text-white/80 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                {photo.date_taken}
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg p-6 flex flex-col overflow-y-auto">
          {isEditing ? (
            <FlipEditForm
              editData={editData}
              setEditData={setEditData}
              newTagInput={newTagInput}
              setNewTagInput={setNewTagInput}
              addTag={addTag}
              removeTag={removeTag}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          ) : (
            <>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1 min-w-0 truncate pr-2">{photo.title}</h3>
                  {!isPublicView && (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublic(); }}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        photo.is_public
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={photo.is_public ? 'Make private' : 'Make public'}
                    >
                      {photo.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {photo.date_taken && (
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    {photo.date_taken}
                  </div>
                )}

                <p className="text-gray-700 leading-relaxed text-sm mb-3">{photo.reason}</p>

                {photo.tags && photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!isPublicView && (
                <>
                  {showDeleteConfirm ? (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Delete this photo?</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                          disabled={isDeleting}
                          className="flex-1 py-1.5 px-3 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, delete'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                          className="flex-1 py-1.5 px-3 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between pt-3 border-t border-gray-200 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared edit form pieces ─────────────────────────────────────────────────

interface EditFormData {
  title: string;
  date_taken: string;
  reason: string;
  is_public: boolean;
  tags: string[];
}

interface EditFormProps {
  editData: EditFormData;
  setEditData: React.Dispatch<React.SetStateAction<EditFormData>>;
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function TagEditor({ editData, newTagInput, setNewTagInput, addTag, removeTag }: Pick<EditFormProps, 'editData' | 'newTagInput' | 'setNewTagInput' | 'addTag' | 'removeTag'>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
      <div className="flex flex-wrap gap-1 mb-2">
        {editData.tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-600">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add a tag…"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function FlipEditForm({ editData, setEditData, newTagInput, setNewTagInput, addTag, removeTag, onSave, onCancel, isSaving }: EditFormProps) {
  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
      <input
        type="text"
        value={editData.title}
        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="Photo title"
        onClick={(e) => e.stopPropagation()}
      />
      <input
        type="text"
        value={editData.date_taken}
        onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        placeholder="Date taken (e.g. Summer 2023)"
        onClick={(e) => e.stopPropagation()}
      />
      <textarea
        value={editData.reason}
        onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        rows={3}
        placeholder="Why is this photo special?"
        onClick={(e) => e.stopPropagation()}
      />
      <div onClick={(e) => e.stopPropagation()}>
        <TagEditor
          editData={editData}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          addTag={addTag}
          removeTag={removeTag}
        />
      </div>
      <label className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={editData.is_public}
          onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-gray-700 text-xs">Make public</span>
      </label>
      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          <Save className="w-3 h-3" />
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

function SlideEditOverlay(props: EditFormProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Photo</h3>
          <button onClick={props.onCancel} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={props.editData.title}
            onChange={(e) => props.setEditData(prev => ({ ...prev, title: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Taken</label>
          <input
            type="text"
            value={props.editData.date_taken}
            onChange={(e) => props.setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
            className="input-field"
            placeholder="e.g. Summer 2023"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Story</label>
          <textarea
            value={props.editData.reason}
            onChange={(e) => props.setEditData(prev => ({ ...prev, reason: e.target.value }))}
            className="input-field resize-none"
            rows={4}
          />
        </div>
        <TagEditor
          editData={props.editData}
          newTagInput={props.newTagInput}
          setNewTagInput={props.setNewTagInput}
          addTag={props.addTag}
          removeTag={props.removeTag}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={props.editData.is_public}
            onChange={(e) => props.setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">Make this photo public</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button
            onClick={props.onSave}
            disabled={props.isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {props.isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={props.onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
