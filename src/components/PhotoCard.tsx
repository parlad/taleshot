import React, { useState } from 'react';
import { Calendar, Tag, X, Edit3, Trash2, Eye, EyeOff, Save, Plus } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Photo, ViewMode } from '../types';

interface PhotoCardProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedPhoto: Photo) => void;
  viewMode: ViewMode;
}

export function PhotoCard({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode }: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
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

      // Delete existing photo tags
      const { error: deleteTagsError } = await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', photo.id);

      if (deleteTagsError) throw deleteTagsError;

      // Insert new photo tags
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
    } catch (error) {
      console.error('Error updating photo:', error);
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

  const togglePublic = async () => {
    try {
      const newPublicState = !photo.is_public;
      const { error } = await supabase
        .from('photos')
        .update({ is_public: newPublicState })
        .eq('id', photo.id);

      if (error) throw error;

      const updatedPhoto: Photo = {
        ...photo,
        is_public: newPublicState
      };

      onUpdate(updatedPhoto);
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
        .eq('id', photo.id);

      if (error) throw error;

      onDelete(photo.id);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  if (!isFlipped) {
    // Front of card - show photo
    return (
      <div className="photo-card group cursor-pointer">
        <div className="aspect-square overflow-hidden rounded-t-xl">
          <img
            src={photo.image_url || photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {photo.is_gallery_tile && photo.gallery_photos && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {photo.gallery_photos.length} photos
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white rounded-b-xl">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
              {photo.title}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              {photo.is_public ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Public" />
              ) : (
                <div className="w-2 h-2 bg-gray-400 rounded-full" title="Private" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {photo.date_taken}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Back of card - show details
  return (
    <div className="photo-card bg-white rounded-xl p-4 h-full">
      {isEditing ? (
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Edit Photo</h3>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date Taken</label>
              <input
                type="text"
                value={editData.date_taken}
                onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Story</label>
              <textarea
                value={editData.reason}
                onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        editData.tags.includes(tag)
                          ? 'bg-slate-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowNewTag(true)}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                {showNewTag && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Tag name"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewTag}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTag(false);
                        setNewTag('');
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.is_public}
                  onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="w-4 h-4 text-slate-600 bg-gray-100 border-gray-300 rounded focus:ring-slate-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-600">Make this photo public</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">{photo.title}</h3>
            <button
              onClick={onFlip}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Created {photo.date_taken}
            </div>

            {photo.tags && photo.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.filter(tag => !tag.startsWith('gallery_')).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Visibility</h4>
              <div className="flex items-center gap-2">
                {photo.is_public ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <Eye className="w-4 h-4" />
                    Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    <EyeOff className="w-4 h-4" />
                    Private
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Story</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{photo.reason}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={togglePublic}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              {photo.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Make {photo.is_public ? 'Private' : 'Public'}
            </button>
            <button
              onClick={handleDeletePhoto}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}