import React, { useState } from 'react';
import { X, MapPin, Calendar, Users, Image, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';

interface AlbumCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedPhotos?: string[];
}

export function AlbumCreationModal({
  isOpen,
  onClose,
  onCreated,
  preselectedPhotos = []
}: AlbumCreationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    date_range_start: '',
    date_range_end: '',
    collaborators: [] as string[],
    is_public: false,
    auto_cover: true
  });
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: album, error: albumError } = await supabase
        .from('collections')
        .insert([{
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          location: formData.location || null,
          date_range_start: formData.date_range_start || null,
          date_range_end: formData.date_range_end || null,
          collaborators: formData.collaborators,
          is_public: formData.is_public,
          auto_cover: formData.auto_cover
        }])
        .select()
        .single();

      if (albumError) throw albumError;

      if (preselectedPhotos.length > 0) {
        const photoInserts = preselectedPhotos.map((photoId, index) => ({
          collection_id: album.id,
          photo_id: photoId,
          order_index: index
        }));

        const { error: photosError } = await supabase
          .from('collection_photos')
          .insert(photoInserts);

        if (photosError) throw photosError;

        if (formData.auto_cover) {
          const { error: coverError } = await supabase
            .from('collections')
            .update({ cover_photo_id: preselectedPhotos[0] })
            .eq('id', album.id);

          if (coverError) throw coverError;
        }
      }

      onCreated();
      handleClose();
    } catch (err) {
      console.error('Error creating album:', err);
      setError(err instanceof Error ? err.message : 'Failed to create album');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      date_range_start: '',
      date_range_end: '',
      collaborators: [],
      is_public: false,
      auto_cover: true
    });
    setCollaboratorInput('');
    setError('');
    onClose();
  };

  const addCollaborator = () => {
    if (collaboratorInput.trim() && !formData.collaborators.includes(collaboratorInput.trim())) {
      setFormData({
        ...formData,
        collaborators: [...formData.collaborators, collaboratorInput.trim()]
      });
      setCollaboratorInput('');
    }
  };

  const removeCollaborator = (email: string) => {
    setFormData({
      ...formData,
      collaborators: formData.collaborators.filter(c => c !== email)
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card-glass p-8"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-3xl font-bold gradient-text mb-2">Create Album</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {preselectedPhotos.length > 0
                ? `Create an album with ${preselectedPhotos.length} selected photo${preselectedPhotos.length !== 1 ? 's' : ''}`
                : 'Create a new album to organize your memories'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Album Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Summer Vacation 2024"
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell the story behind this album..."
                rows={3}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.date_range_start}
                  onChange={(e) => setFormData({ ...formData, date_range_start: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.date_range_end}
                  onChange={(e) => setFormData({ ...formData, date_range_end: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Tokyo, Japan"
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborators
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={collaboratorInput}
                  onChange={(e) => setCollaboratorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCollaborator())}
                  placeholder="colleague@example.com"
                  className="flex-1 px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={addCollaborator}
                  className="px-6 btn-outlined"
                >
                  Add
                </button>
              </div>

              {formData.collaborators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.collaborators.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeCollaborator(email)}
                        className="hover:text-teal-900 dark:hover:text-teal-100 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Make album public</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Anyone with the link can view this album
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_cover}
                  onChange={(e) => setFormData({ ...formData, auto_cover: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Auto-select cover photo</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      AI will choose the best photo for the album cover
                    </p>
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-filled flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Image className="w-5 h-5" />
                    Create Album
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
