import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, Plus } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoAdded: () => void;
}

export function AddPhotoModal({ isOpen, onClose, onPhotoAdded }: AddPhotoModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    date_taken: '',
    reason: '',
    is_public: false,
    tags: [] as string[]
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([
    'Family', 'Vacation', 'Celebration', 'Nature', 'Food', 'Pets', 'Travel', 'Japan', 'Village'
  ]);
  const [newTag, setNewTag] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(files);
      
      // Generate previews for all selected files
      const previews: string[] = [];
      let loadedCount = 0;
      
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews[index] = e.target?.result as string;
          loadedCount++;
          
          if (loadedCount === files.length) {
            setImagePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
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
    
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(trimmedTag) ? prev.tags : [...prev.tags, trimmedTag]
    }));
    
    setNewTag('');
    setShowNewTag(false);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload all images and create photo records
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imageUrl = await uploadImage(file);
        
        // Create a unique title for each photo if multiple files
        const photoTitle = imageFiles.length > 1 
          ? `${formData.title} (${i + 1})`
          : formData.title;

        const { data: photo, error: photoError } = await supabase
          .from('photos')
          .insert([{
            user_id: user.id,
            title: photoTitle,
            date_taken: formData.date_taken,
            reason: formData.reason,
            image_url: imageUrl,
            is_public: formData.is_public
          }])
          .select()
          .single();

        if (photoError) throw photoError;

        // Add tag associations for each photo
        if (formData.tags.length > 0) {
          const tagInserts = formData.tags.map(tagName => ({
            photo_id: photo.id,
            tag_name: tagName
          }));

          const { error: tagError } = await supabase
            .from('photo_tags')
            .insert(tagInserts);

          if (tagError) throw tagError;
        }
      }

      onPhotoAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      date_taken: '',
      reason: '',
      is_public: false,
      tags: []
    });
    setImageFiles([]);
    setImagePreviews([]);
    setNewTag('');
    setShowNewTag(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Add New Photo{imageFiles.length > 1 ? 's' : ''}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            {imagePreviews.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageFiles([]);
                    setImagePreviews([]);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear All Photos
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> multiple photos or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 10MB each)</p>
                </div>
                <input
                  id="photo-upload"
                  name="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  required
                />
              </label>
            )}
            {imageFiles.length > 1 && (
              <p className="text-sm text-blue-600 mt-2">
                {imageFiles.length} photos selected. They will be uploaded with the same details below.
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="photo-title" className="block text-sm font-medium text-gray-700 mb-2">
              Title {imageFiles.length > 1 && '(will be numbered for multiple photos)'}
            </label>
            <input
              id="photo-title"
              name="photo-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder={imageFiles.length > 1 ? "Base title for your photos" : "Give your photo a title"}
            />
          </div>

          {/* Date Taken */}
          <div>
            <label htmlFor="photo-date" className="block text-sm font-medium text-gray-700 mb-2">
              Date Taken
            </label>
            <input
              id="photo-date"
              name="photo-date"
              type="text"
              required
              value={formData.date_taken}
              onChange={(e) => setFormData(prev => ({ ...prev, date_taken: e.target.value }))}
              className="input-field"
              placeholder="e.g., December 2024, Summer 2023"
            />
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="photo-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Why {imageFiles.length > 1 ? 'are these photos' : 'is this photo'} special?
            </label>
            <textarea
              id="photo-reason"
              name="photo-reason"
              required
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="input-field resize-none"
              placeholder={imageFiles.length > 1 ? "Tell the story behind these photos..." : "Tell the story behind this photo..."}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
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
                    id="new-tag"
                    name="new-tag"
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

          {/* Public Toggle */}
          <div>
            <label className="flex items-center gap-3">
              <input
                id="photo-public"
                name="photo-public"
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Make {imageFiles.length > 1 ? 'these photos' : 'this photo'} public (others can discover {imageFiles.length > 1 ? 'them' : 'it'})
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || imageFiles.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Add Photo{imageFiles.length > 1 ? 's' : ''}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}