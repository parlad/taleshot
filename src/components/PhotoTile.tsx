import React, { useState } from 'react';
import { Images, Calendar, Tag, X, Edit3, Trash2, Eye, EyeOff, Save, Plus, Maximize2 } from 'lucide-react';
import { PhotoCard } from './PhotoCard';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import { AddPhotoModal } from './AddPhotoModal';
import { supabase } from '../utils/supabase';
import type { Photo } from '../types';

interface PhotoTileProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedPhoto: Photo) => void;
  viewMode: 'flip' | 'slide';
  onGroupSelect?: (groupId: string) => void;
  onPhotoAdded?: () => void;
}

export function PhotoTile({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode, onGroupSelect, onPhotoAdded }: PhotoTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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

  // If it's not a gallery tile, render as regular PhotoCard
  if (!photo.is_gallery_tile) {
    return (
      <PhotoCard
        photo={photo}
        isFlipped={isFlipped}
        onFlip={onFlip}
        onDelete={onDelete}
        onUpdate={onUpdate}
        viewMode={viewMode}
      />
    );
  }

  const photoCount = photo.gallery_photos?.length || 0;
  const currentPhoto = photo.gallery_photos?.[currentPhotoIndex] || photo;

  const handleExpand = () => {
    setIsExpanded(true);
    setCurrentPhotoIndex(0);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsEditing(false);
    setCurrentPhotoIndex(0);
  };

  const goToPrevious = () => {
    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : photoCount - 1);
  };

  const goToNext = () => {
    setCurrentPhotoIndex(prev => prev < photoCount - 1 ? prev + 1 : 0);
  };

  const handleSave = async () => {
    try {
      // Update the current photo
      const { error } = await supabase
        .from('photos')
        .update({
          title: editData.title,
          date_taken: editData.date_taken,
          reason: editData.reason,
          is_public: editData.is_public
        })
        .eq('id', currentPhoto.id);

      if (error) throw error;

      // Delete existing photo tags
      const { error: deleteTagsError } = await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', currentPhoto.id);

      if (deleteTagsError) throw deleteTagsError;

      // Insert new photo tags
      if (editData.tags.length > 0) {
        const tagInserts = editData.tags.map(tagName => ({
          photo_id: currentPhoto.id,
          tag_name: tagName
        }));

        const { error: insertTagsError } = await supabase
          .from('photo_tags')
          .insert(tagInserts);

        if (insertTagsError) throw insertTagsError;
      }

      // Update the photo in the gallery_photos array
      if (photo.gallery_photos) {
        const updatedGalleryPhotos = [...photo.gallery_photos];
        updatedGalleryPhotos[currentPhotoIndex] = {
          ...currentPhoto,
          title: editData.title,
          date_taken: editData.date_taken,
          reason: editData.reason,
          is_public: editData.is_public,
          tags: editData.tags
        };

        const updatedPhoto: Photo = {
          ...photo,
          gallery_photos: updatedGalleryPhotos
        };

        onUpdate(updatedPhoto);
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: currentPhoto.title,
      date_taken: currentPhoto.date_taken || '',
      reason: currentPhoto.reason,
      is_public: currentPhoto.is_public || false,
      tags: [...(currentPhoto.tags || [])]
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
      const newPublicState = !currentPhoto.is_public;
      const { error } = await supabase
        .from('photos')
        .update({ is_public: newPublicState })
        .eq('id', currentPhoto.id);

      if (error) throw error;

      // Update the photo in the gallery_photos array
      if (photo.gallery_photos) {
        const updatedGalleryPhotos = [...photo.gallery_photos];
        updatedGalleryPhotos[currentPhotoIndex] = {
          ...currentPhoto,
          is_public: newPublicState
        };

        const updatedPhoto: Photo = {
          ...photo,
          gallery_photos: updatedGalleryPhotos
        };

        onUpdate(updatedPhoto);
      }
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
        .eq('id', currentPhoto.id);

      if (error) throw error;

      // If this was the last photo in the gallery, delete the entire tile
      if (photoCount <= 1) {
        onDelete(photo.id);
        return;
      }

      // Remove the photo from the gallery_photos array
      if (photo.gallery_photos) {
        const updatedGalleryPhotos = photo.gallery_photos.filter(p => p.id !== currentPhoto.id);
        
        // Adjust current index if needed
        if (currentPhotoIndex >= updatedGalleryPhotos.length) {
          setCurrentPhotoIndex(updatedGalleryPhotos.length - 1);
        }

        const updatedPhoto: Photo = {
          ...photo,
          gallery_photos: updatedGalleryPhotos
        };

        onUpdate(updatedPhoto);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Update edit data when current photo changes
  React.useEffect(() => {
    if (currentPhoto && !isEditing) {
      setEditData({
        title: currentPhoto.title,
        date_taken: currentPhoto.date_taken || '',
        reason: currentPhoto.reason,
        is_public: currentPhoto.is_public || false,
        tags: [...(currentPhoto.tags || [])]
      });
    }
  }, [currentPhotoIndex, currentPhoto, isEditing]);

  // Fullscreen expanded view - 60% photo, 40% info
  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex">
        {/* Photo Section - 60% */}
        <div className="w-[70%] h-full flex items-center justify-center bg-black relative">
          <img
            src={currentPhoto.image_url ?? ''}
            alt={currentPhoto.title}
            className="w-full h-full object-contain"
          />
          
          {/* Edit and Delete icons overlay on photo */}
          {!isEditing && (
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-blue-600 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                title="Edit photo"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto();
                }}
                className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-red-600 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                title="Delete photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation arrows for gallery */}
          {photoCount > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Photo counter */}
          {photoCount > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
              {currentPhotoIndex + 1} of {photoCount}
            </div>
          )}
        </div>

        {/* Info Section - 30% */}
        <div className="w-[30%] h-full bg-white overflow-y-auto">
          <div className="p-4">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Gallery Photo</h2>
              <button
                onClick={handleClose}
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
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{currentPhoto.title}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    {currentPhoto.date_taken}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Story</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{currentPhoto.reason}</p>
                </div>

                {currentPhoto.tags && currentPhoto.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {currentPhoto.tags.filter(tag => !tag.startsWith('gallery_')).map((tag, index) => (
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

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Visibility</h4>
                  <div className="flex items-center gap-2">
                    {currentPhoto.is_public ? (
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

                {/* Gallery thumbnails */}
                {photoCount > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Gallery ({photoCount} photos)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Add Photo Button */}
                      <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors flex items-center justify-center bg-gray-50 hover:bg-indigo-50 cursor-pointer group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddModalOpen(true);
                          }}
                          className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-indigo-600 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium">Add Photo</span>
                        </button>
                      </div>
                      
                      {photo.gallery_photos?.map((galleryPhoto, index) => (
                        <div
                          key={galleryPhoto.id}
                          className={`aspect-square rounded-xl overflow-hidden border-3 transition-colors relative group ${
                            index === currentPhotoIndex
                              ? 'border-slate-500'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPhotoIndex(index);
                            }}
                            className="w-full h-full"
                          >
                            <img
                              src={galleryPhoto.image_url ?? ''}
                              alt={galleryPhoto.title}
                              className={`w-full h-full object-cover hover:scale-110 transition-transform duration-300 ${
                                index === currentPhotoIndex ? 'ring-2 ring-slate-500 ring-inset' : ''
                              }`}
                            />
                          </button>
                          
                          {/* Edit and Delete icons on hover */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(index);
                                setIsEditing(true);
                              }}
                              className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-blue-600 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                              title="Edit photo"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPhotoIndex(index);
                                handleDeletePhoto();
                              }}
                              className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-red-600 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Selected indicator */}
                          {index === currentPhotoIndex && (
                            <div className="absolute top-2 left-2 w-5 h-5 bg-slate-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Gallery info */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Viewing: Photo {currentPhotoIndex + 1} of {photoCount}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-3 border-t border-gray-200 mt-4">
                  <button
                    onClick={togglePublic}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    {currentPhoto.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Make {currentPhoto.is_public ? 'Private' : 'Public'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Photo Modal */}
        <AddPhotoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onPhotoAdded={() => {
            setIsAddModalOpen(false);
            onPhotoAdded?.();
          }}
          existingGalleryId={photo.tags?.find(tag => tag.startsWith('gallery_'))?.replace('gallery_', '') || undefined}
          galleryTitle={photo.title}
        />
      </div>
    );
  }

  // Regular tile view showing just the representative photo with gallery indicator
  // Gallery tile view
  return (
    <div
      className="group relative rounded-2xl overflow-hidden shadow-md bg-gray-900 aspect-[4/3] cursor-pointer"
      onClick={handleExpand}
    >
      <img
        src={photo.image_url ?? ''}
        alt={photo.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Gallery badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-full border border-white/20">
        <Images className="w-3.5 h-3.5" />
        {photoCount} photos
      </div>

      {/* Expand hint on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="p-3 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
          <Maximize2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <h3 className="text-white font-semibold text-sm leading-snug truncate drop-shadow">
          {photo.title}
        </h3>
        {photo.date_taken && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 text-white/50 flex-shrink-0" />
            <span className="text-white/60 text-xs">{photo.date_taken}</span>
          </div>
        )}
      </div>
    </div>
  );
}