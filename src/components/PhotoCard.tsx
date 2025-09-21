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

  // Expanded view - 60% photo, 40% info
  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="w-full h-full flex">
          {/* Photo Section - 60% */}
          <div className="w-[60%] h-full flex items-center justify-center bg-black">
            <img
              src={photo.imageUrl || photo.image_url}
              alt={photo.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Info Section - 40% */}
          <div className="w-[40%] h-full bg-white overflow-y-auto">
            <div className="p-8">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Photo Details</h2>
                <button
                  onClick={handleCloseExpanded}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Taken</label>
                    <input
                      type="text"
                      value={editData.date_taken}
                      onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Story</label>
                    <textarea
                      value={editData.reason}
                      onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              editData.tags.includes(tag)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setShowNewTag(true)}
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Tag name"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewTag}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewTag(false);
                              setNewTag('');
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editData.is_public}
                        onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Make this photo public</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{photo.title}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <Calendar className="w-4 h-4 mr-2" />
                      {photo.date_taken}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Story</h4>
                    <p className="text-gray-700 leading-relaxed">{photo.reason}</p>
                  </div>

                  {photo.tags && photo.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Tag className="w-4 h-4 mr-2" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {photo.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {photo.batch_id && batchCount > 1 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Gallery</h4>
                      <button
                        onClick={handleGalleryClick}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Images className="w-4 h-4" />
                        View Gallery ({batchCount} photos)
                      </button>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Visibility</h4>
                    <div className="flex items-center gap-2">
                      {photo.is_public ? (
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          <Eye className="w-4 h-4" />
                          Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          <EyeOff className="w-4 h-4" />
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  {!isPublicView && (
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Photo
                      </button>
                      <button
                        onClick={togglePublic}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        {photo.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        Make {photo.is_public ? 'Private' : 'Public'}
                      </button>
                      <button
                        onClick={() => onDelete(photo.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

  // Regular card view (slide mode)
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-square relative cursor-pointer" onClick={handleExpand}>
        <img
          src={photo.imageUrl || photo.image_url}
          alt={photo.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <button className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-colors">
            <Maximize2 className="w-6 h-6" />
          </button>
        </div>
        {photo.batch_id && batchCount > 1 && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Images className="w-3 h-3" />
            {batchCount}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{photo.title}</h3>
          {!isPublicView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePublic();
              }}
              className={`p-1 rounded-lg transition-colors ${
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
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <Calendar className="w-4 h-4 mr-2" />
          {photo.date_taken}
        </div>
        <p className="text-gray-700 text-sm line-clamp-2">{photo.reason}</p>
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {photo.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {photo.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{photo.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="aspect-square">
          <img
            src={photo.imageUrl || photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{photo.title}</h3>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <Calendar className="w-4 h-4 mr-2" />
                {photo.date_taken}
              </div>
            </div>
            {!isPublicView && (
              <div className="flex items-center gap-2">
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
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(photo.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{photo.reason}</p>
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {photo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {photo.batch_id && batchCount > 1 && (
            <button
              onClick={handleGalleryClick}
              className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <Images className="w-4 h-4" />
              View Gallery ({batchCount} photos)
            </button>
          )}
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

  return (
    <div className="perspective w-full h-96">
      <div
        className={`relative w-full h-full preserve-3d transition-transform duration-700 cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        } ${isEditing ? 'cursor-default' : ''}`}
        onClick={isEditing ? undefined : onFlip}
      >
        {/* Front of card */}
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-lg">
          <img
            src={photo.imageUrl || photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">{photo.title}</h3>
            <div className="flex items-center text-white/80 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              {photo.date_taken}
            </div>
            {photo.batch_id && batchCount > 1 && (
              <button
                onClick={handleGalleryClick}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 hover:bg-opacity-70 transition-colors"
              >
                <Images className="w-3 h-3" />
                {batchCount}
              </button>
            )}
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl shadow-lg flex flex-col">
          {isEditing ? (
            <div className="flex-1 space-y-4 p-4 overflow-y-auto max-h-full">
              <input
                id={`edit-title-${photo.id}`}
                name={`edit-title-${photo.id}`}
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Photo title"
              />
              <input
                id={`edit-date-${photo.id}`}
                name={`edit-date-${photo.id}`}
                type="text"
                value={editData.date_taken}
                onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Date taken"
              />
              <textarea
                id={`edit-reason-${photo.id}`}
                name={`edit-reason-${photo.id}`}
                value={editData.reason}
                onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
                placeholder="Why is this photo special?"
              />
              
              {/* Tags Section */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          editData.tags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowNewTag(true)}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add New
                    </button>
                  </div>

                  {showNewTag && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                        placeholder="Tag name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTag}
                        className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewTag(false);
                          setNewTag('');
                        }}
                        className="px-2 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <label className="flex items-center gap-2">
                <input
                  id={`edit-public-${photo.id}`}
                  name={`edit-public-${photo.id}`}
                  type="checkbox"
                  checked={editData.is_public}
                  onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">Make this photo public</span>
              </label>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{photo.title}</h3>
                  {!isPublicView && (
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
                  )}
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  {photo.date_taken}
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">{photo.reason}</p>
                {photo.tags && photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {photo.batch_id && batchCount > 1 && (
                  <button
                    onClick={handleGalleryClick}
                    className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Images className="w-4 h-4" />
                    View Gallery ({batchCount} photos)
                  </button>
                )}
              </div>
              {!isPublicView && (
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(photo.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <PhotoGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          photos={batchPhotos}
          initialIndex={galleryIndex}
        />

        <PhotoGalleryModal
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          photos={[photo]}
          initialIndex={0}
        />
      </div>
    </div>
  );
}