import React, { useState } from 'react';
import { Eye, EyeOff, Edit2, Trash2, Calendar, Tag, User } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Photo, ViewMode } from '../types';

interface PhotoCardProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (photoId: string) => void;
  onUpdate: (photo: Photo) => void;
  viewMode: ViewMode;
}

export function PhotoCard({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode }: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(photo.title || '');
  const [editDescription, setEditDescription] = useState(photo.description || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const togglePublic = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ is_public: !photo.is_public })
        .eq('id', photo.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
    } catch (error) {
      console.error('Error updating photo visibility:', error);
      alert('Failed to update photo visibility. Please try again.');
    }
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) return;

    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim()
        })
        .eq('id', photo.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate({ ...photo, ...data });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
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
      alert('Failed to delete photo. Please try again.');
    }
  };

  return (
    <div className="photo-card group">
      <div className={`photo-card-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of card */}
        <div className="photo-card-front">
          <div className="relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="aspect-square overflow-hidden">
              <img
                src={photo.image_url}
                alt={photo.title || 'Photo'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                  {photo.title || 'Untitled'}
                </h3>
                <div className="flex items-center gap-1 ml-2">
                  {photo.is_public ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              {photo.description && (
                <p className="text-gray-600 text-xs line-clamp-2 mb-3">
                  {photo.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(photo.created_at).toLocaleDateString()}
                </div>
                <button
                  onClick={onFlip}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="photo-card-back">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter photo title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    placeholder="Enter photo description"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating || !editTitle.trim()}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(photo.title || '');
                      setEditDescription(photo.description || '');
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {photo.title || 'Untitled'}
                  </h3>
                  {photo.description && (
                    <p className="text-gray-600 text-sm mb-4">
                      {photo.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {new Date(photo.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {photo.tags.filter(tag => !tag.startsWith('gallery_')).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {photo.is_public ? (
                      <>
                        <Eye className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Public</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={togglePublic}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    {photo.is_public ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Make Public
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                onClick={onFlip}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}