import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Users, Edit2, Trash2, Eye, Share2, LayoutGrid, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { AlbumEditor } from './AlbumEditor';
import { PhotoGridItem } from './PhotoGridItem';
import { PhotoDetailModal } from './PhotoDetailModal';
import { AlbumTimeline } from './AlbumTimeline';
import { AlbumMapView } from './AlbumMapView';
import { AlbumThemeSelector, AlbumThemeLayout, type AlbumTheme } from './AlbumThemeSelector';
import { AlbumStatistics } from './AlbumStatistics';
import { AlbumExportOptions } from './AlbumExportOptions';
import type { Photo } from '../types';

interface Album {
  id: string;
  name: string;
  description: string;
  location: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  collaborators: string[];
  is_public: boolean;
  photo_count: number;
  view_count: number;
  like_count: number;
  cover_photo_id: string | null;
  auto_cover: boolean;
  theme: AlbumTheme;
  music_url: string | null;
  created_at: string;
}

interface AlbumDetailViewProps {
  albumId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export function AlbumDetailView({
  albumId,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: AlbumDetailViewProps) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'photos' | 'timeline' | 'map' | 'stats' | 'export'>('photos');
  const [currentTheme, setCurrentTheme] = useState<AlbumTheme>('grid');

  useEffect(() => {
    if (isOpen && albumId) {
      fetchAlbumDetails();
      incrementViewCount();
    }
  }, [isOpen, albumId]);

  const fetchAlbumDetails = async () => {
    setLoading(true);
    try {
      const { data: albumData, error: albumError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', albumId)
        .single();

      if (albumError) throw albumError;
      setAlbum(albumData);
      setCurrentTheme(albumData.theme || 'grid');

      const { data: collectionPhotos, error: photosError } = await supabase
        .from('collection_photos')
        .select('photo_id, order_index')
        .eq('collection_id', albumId)
        .order('order_index');

      if (photosError) throw photosError;

      const photosWithDetails = await Promise.all(
        (collectionPhotos || []).map(async (cp) => {
          const { data: photo } = await supabase
            .from('photos')
            .select('*')
            .eq('id', cp.photo_id)
            .single();

          if (!photo) return null;

          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);

          return {
            ...photo,
            tags: tags?.map(t => t.tag_name) || []
          };
        })
      );

      setPhotos(photosWithDetails.filter(p => p !== null) as Photo[]);
    } catch (error) {
      console.error('Error fetching album details:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase
        .from('collections')
        .update({
          view_count: (album?.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', albumId);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this album? Photos will not be deleted.')) return;

    try {
      await supabase.from('collection_photos').delete().eq('collection_id', albumId);
      await supabase.from('collections').delete().eq('id', albumId);
      onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsPhotoModalOpen(true);
  };

  const handleThemeChange = async (theme: AlbumTheme) => {
    setCurrentTheme(theme);
    try {
      await supabase
        .from('collections')
        .update({ theme })
        .eq('id', albumId);
      onUpdate();
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen || !album) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative min-h-screen flex items-start justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl card-glass p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold gradient-text mb-3">{album.name}</h1>
                    {album.description && (
                      <p className="text-gray-700 dark:text-gray-300 text-lg mb-4 leading-relaxed">
                        {album.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {album.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{album.location}</span>
                        </div>
                      )}

                      {(album.date_range_start || album.date_range_end) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(album.date_range_start)}
                            {album.date_range_end && ` - ${formatDate(album.date_range_end)}`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{album.view_count || 0} views</span>
                      </div>

                      {album.collaborators.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{album.collaborators.length} collaborator{album.collaborators.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`p-3 rounded-xl transition-colors ${
                        isEditing
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={isEditing ? 'View mode' : 'Edit mode'}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleDelete}
                      className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Delete album"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {album.is_public && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      This album is public and can be viewed by anyone with the link
                    </span>
                  </div>
                )}

{isEditing ? (
                  <AlbumEditor albumId={albumId} onUpdate={fetchAlbumDetails} />
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
                      {[
                        { id: 'photos' as const, label: 'Photos', icon: LayoutGrid },
                        { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
                        { id: 'map' as const, label: 'Map', icon: MapPin },
                        { id: 'stats' as const, label: 'Statistics', icon: Eye },
                        { id: 'export' as const, label: 'Export', icon: Share2 }
                      ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                              activeView === tab.id
                                ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-semibold'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {activeView === 'photos' && (
                      <div className="space-y-6">
                        <AlbumThemeSelector
                          currentTheme={currentTheme}
                          onChange={handleThemeChange}
                        />
                        <AlbumThemeLayout
                          theme={currentTheme}
                          photos={photos}
                          onPhotoClick={handlePhotoClick}
                        />
                      </div>
                    )}

                    {activeView === 'timeline' && (
                      <AlbumTimeline
                        photos={photos}
                        onPhotoClick={handlePhotoClick}
                      />
                    )}

                    {activeView === 'map' && (
                      <AlbumMapView
                        photos={photos}
                        onPhotoClick={handlePhotoClick}
                      />
                    )}

                    {activeView === 'stats' && (
                      <AlbumStatistics
                        photoCount={photos.length}
                        viewCount={album.view_count || 0}
                        likeCount={album.like_count || 0}
                        isPublic={album.is_public}
                        location={album.location}
                        dateRange={{
                          start: album.date_range_start,
                          end: album.date_range_end
                        }}
                        collaboratorCount={album.collaborators.length}
                      />
                    )}

                    {activeView === 'export' && (
                      <AlbumExportOptions
                        albumName={album.name}
                        photos={photos}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {selectedPhoto && (
          <PhotoDetailModal
            photo={selectedPhoto}
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
