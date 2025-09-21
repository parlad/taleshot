import React, { useState } from 'react';
import { Calendar, Edit3, Trash2, Eye, EyeOff, Save, X, Plus, Tag, Images, Maximize2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import type { PhotoCardProps, Photo } from '../types';

export function PhotoCard({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode = 'slide', isPublicView = false }: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [batchPhotos, setBatchPhotos] = useState<Photo[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
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

  const handleGalleryClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!photo.batch_id) return;

    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('batch_id', photo.batch_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (photos && photos.length > 0) {
        // Add tags to each photo
        const photosWithTags = await Promise.all(
          photos.map(async (p) => {
            const { data: tags } = await supabase
              .from('photo_tags')
              .select('tag_name')
              .eq('photo_id', p.id);
            
            return {
              ...p,
              tags: tags?.map(t => t.tag_name).filter(tag => !tag.startsWith('gallery_')) || []
            };
          })
        );

        setBatchPhotos(photosWithTags);
        const currentIndex = photosWithTags.findIndex(p => p.id === photo.id);
        setGalleryIndex(Math.max(0, currentIndex));
        setIsGalleryOpen(true);
      }
    } catch (error) {
      console.error('Error loading batch photos:', error);
    }
  };

  const getBatchPhotoCount = async () => {
    if (!photo.batch_id) return 0;
    
    try {
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', photo.batch_id);
      
      return count || 0;
    } catch (error) {
      console.error('Error getting batch count:', error);
      return 0;
    }
  };

  const [batchCount, setBatchCount] = useState(0);

  React.useEffect(() => {
    if (photo.batch_id) {
      getBatchPhotoCount().then(setBatchCount);
    }
  }, [photo.batch_id]);

  const handleSave = async () => {
    try {
      // First update the photo
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

      onUpdate?.(updatedPhoto);
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

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
    setIsEditing(false);
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

      onUpdate?.(updatedPhoto);
    } catch (error) {
      console.error('Error updating photo visibility:', error);
    }
  };

  // Fullscreen expanded view - 60% photo, 40% info
  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex">
        {/* Photo Section - 60% */}
        <div className="w-[70%] h-full flex items-center justify-center bg-black">
          <img
            src={photo.imageUrl || photo.image_url}
            alt={photo.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Info Section - 30% */}
        <div className="w-[30%] h-full bg-white overflow-y-auto">
          <div className="p-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Photo Details</h2>
              <button
                onClick={handleCloseExpanded}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Taken</label>
                  <input
                    type="text"
                    value={editData.date_taken}
                    onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Story</label>
                  <textarea
                    value={editData.reason}
                    onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
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
                        className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add New
                      </button>
                    </div>

                    {showNewTag && (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Tag name"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewTag}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewTag(false);
                            setNewTag('');
                          }}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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
                      className="w-3 h-3 text-slate-600 bg-gray-100 border-gray-300 rounded focus:ring-slate-500 focus:ring-1"
                    />
                    <span className="text-xs font-medium text-gray-600">Make this photo public</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{photo.title}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    {photo.date_taken}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Story</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{photo.reason}</p>
                </div>

                {photo.tags && photo.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.filter(tag => !tag.startsWith('gallery_')).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {photo.batch_id && batchCount > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Gallery</h4>
                    <button
                      onClick={handleGalleryClick}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      <Images className="w-3 h-3" />
                      View Gallery ({batchCount} photos)
                    </button>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Visibility</h4>
                  <div className="flex items-center gap-2">
                    {photo.is_public ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs">
                        <Eye className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                        <EyeOff className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                </div>

                {!isPublicView && (
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Photo
                    </button>
                    <button
                      onClick={togglePublic}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      {photo.is_public ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      Make {photo.is_public ? 'Private' : 'Public'}
                    </button>
                    <button
                      onClick={() => onDelete(photo.id)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <PhotoGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          photos={batchPhotos}
          initialIndex={galleryIndex}
        />
      </div>
    );
  }

  // Regular card view - NO FLIP FUNCTIONALITY
  return (
    <div className="group photo-card overflow-hidden max-w-sm cursor-pointer transition-all duration-300 hover:shadow-xl" onClick={handleExpand}>
      <div className="aspect-square relative">
        <img
          src={photo.imageUrl || photo.image_url}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Gradient overlay - only visible on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Photo info overlay - only visible on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-semibold text-white text-lg leading-tight mb-2">{photo.title}</h3>
          <div className="flex items-center text-white/90 text-sm mb-3">
            <Calendar className="w-4 h-4 mr-2" />
            {photo.date_taken}
          </div>
        </div>
        
        {/* Privacy toggle button - only visible on hover for non-public view */}
        {!isPublicView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePublic();
            }}
            className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 ${
              photo.is_public
                ? 'bg-green-500/80 text-white hover:bg-green-600/80'
                : 'bg-gray-500/80 text-white hover:bg-gray-600/80'
            } backdrop-blur-sm`}
            title={photo.is_public ? 'Make private' : 'Make public'}
          >
            {photo.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}
        
        {/* Gallery indicator - only visible if part of a batch */}
        {photo.batch_id && batchCount > 1 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
            <Images className="w-3 h-3" />
            {batchCount}
          </div>
        )}
        
        {/* Expand icon - only visible on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white">
            <Maximize2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}