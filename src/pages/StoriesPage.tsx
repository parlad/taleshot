import React, { useState, useEffect } from 'react';
import { Book, Plus, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { AlbumCreationModal } from '../components/AlbumCreationModal';
import { AlbumDetailView } from '../components/AlbumDetailView';
import { SkeletonLoader } from '../components/SkeletonLoader';

interface Album {
  id: string;
  name: string;
  description: string;
  location: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  photo_count: number;
  cover_photo_id: string | null;
  cover_photo_url?: string;
  is_public: boolean;
  created_at: string;
}

export function StoriesPage() {
  const { user } = useSupabaseAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlbums();
    }
  }, [user]);

  const fetchAlbums = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: albumsData, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const albumsWithCovers = await Promise.all(
        (albumsData || []).map(async (album) => {
          let coverPhotoUrl = '';

          if (album.cover_photo_id) {
            const { data: photo } = await supabase
              .from('photos')
              .select('image_url')
              .eq('id', album.cover_photo_id)
              .single();

            coverPhotoUrl = photo?.image_url || '';
          } else if (album.photo_count > 0) {
            const { data: firstPhoto } = await supabase
              .from('collection_photos')
              .select('photo_id')
              .eq('collection_id', album.id)
              .order('order_index')
              .limit(1)
              .single();

            if (firstPhoto) {
              const { data: photo } = await supabase
                .from('photos')
                .select('image_url')
                .eq('id', firstPhoto.photo_id)
                .single();

              coverPhotoUrl = photo?.image_url || '';
            }
          }

          return {
            ...album,
            cover_photo_url: coverPhotoUrl
          };
        })
      );

      setAlbums(albumsWithCovers);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2 flex items-center gap-3">
            <Book className="w-9 h-9" />
            My Albums
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your photos into beautiful albums with stories
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="btn-filled flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Album
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={6} variant="masonry" />
      ) : albums.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-teal-100 to-blue-100 dark:from-teal-900/20 dark:to-blue-900/20 mb-6">
            <Book className="w-12 h-12 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No albums yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first album to organize your photos with titles, descriptions, dates, and locations.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-filled inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Your First Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAlbumId(album.id)}
              className="card-glass overflow-hidden cursor-pointer group"
            >
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                {album.cover_photo_url ? (
                  <img
                    src={album.cover_photo_url}
                    alt={album.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {album.is_public && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                    Public
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {album.name}
                </h3>

                {album.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {album.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{album.photo_count} photo{album.photo_count !== 1 ? 's' : ''}</span>
                  </div>

                  {album.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{album.location}</span>
                    </div>
                  )}

                  {(album.date_range_start || album.date_range_end) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {formatDate(album.date_range_start)}
                        {album.date_range_end && ` - ${formatDate(album.date_range_end)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AlbumCreationModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreated={fetchAlbums}
      />

      {selectedAlbumId && (
        <AlbumDetailView
          albumId={selectedAlbumId}
          isOpen={true}
          onClose={() => setSelectedAlbumId(null)}
          onUpdate={fetchAlbums}
          onDelete={() => {
            setSelectedAlbumId(null);
            fetchAlbums();
          }}
        />
      )}
    </div>
  );
}
