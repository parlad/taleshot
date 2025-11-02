import React, { useState, useEffect } from 'react';
import { Book, Calendar, Images, Plus } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { LazyImage } from '../components/LazyImage';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Photo } from '../types';

interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
  photo_count: number;
  cover_photo?: string;
}

export function StoriesPage() {
  const { user } = useSupabaseAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionPhotos, setCollectionPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get photo count and cover photo for each collection
      const collectionsWithDetails = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          const { data: photos } = await supabase
            .from('collection_photos')
            .select('photo_id')
            .eq('collection_id', collection.id);

          let coverPhoto = '';
          if (photos && photos.length > 0) {
            const { data: photoData } = await supabase
              .from('photos')
              .select('image_url')
              .eq('id', photos[0].photo_id)
              .single();

            coverPhoto = photoData?.image_url || '';
          }

          return {
            ...collection,
            photo_count: photos?.length || 0,
            cover_photo: coverPhoto
          };
        })
      );

      setCollections(collectionsWithDetails);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionPhotos = async (collectionId: string) => {
    try {
      const { data: photoIds, error } = await supabase
        .from('collection_photos')
        .select('photo_id')
        .eq('collection_id', collectionId);

      if (error) throw error;

      if (!photoIds || photoIds.length === 0) {
        setCollectionPhotos([]);
        return;
      }

      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .in('id', photoIds.map(p => p.photo_id));

      if (photosError) throw photosError;

      const photosWithTags = await Promise.all(
        (photos || []).map(async (photo) => {
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

      setCollectionPhotos(photosWithTags);
    } catch (error) {
      console.error('Error fetching collection photos:', error);
    }
  };

  const handleCollectionClick = async (collection: Collection) => {
    setSelectedCollection(collection);
    await fetchCollectionPhotos(collection.id);
  };

  const handleCreateCollection = async () => {
    if (!user || !newCollectionName.trim()) return;

    try {
      const { error } = await supabase
        .from('collections')
        .insert([{
          user_id: user.id,
          name: newCollectionName.trim(),
          description: newCollectionDesc.trim()
        }]);

      if (error) throw error;

      setNewCollectionName('');
      setNewCollectionDesc('');
      setIsCreating(false);
      fetchCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  const handlePhotoClick = (photoId: string) => {
    const index = collectionPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setViewerPhotoIndex(index);
      setViewerOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="skeleton h-20 w-full rounded-2xl mb-8" />
        <SkeletonLoader count={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Book className="w-8 h-8 text-blue-600" />
          Stories & Collections
        </h1>
        <p className="text-gray-600">Organize your photos into beautiful curated albums</p>
      </div>

      {!selectedCollection ? (
        <>
          {/* Create New Collection Button */}
          <div className="mb-6">
            {!isCreating ? (
              <button
                onClick={() => setIsCreating(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Collection
              </button>
            ) : (
              <div className="glass-morphism rounded-xl p-6 shadow-elevation-3">
                <h3 className="text-lg font-semibold mb-4">Create New Collection</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="input-field"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewCollectionName('');
                        setNewCollectionDesc('');
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collections Grid */}
          {collections.length === 0 ? (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No collections yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first collection to organize your photos into beautiful albums
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection)}
                  className="group cursor-pointer bg-white rounded-xl shadow-elevation-2 hover:shadow-elevation-4 overflow-hidden transition-all duration-300 hover:transform hover:scale-[1.02]"
                >
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100">
                    {collection.cover_photo ? (
                      <LazyImage
                        src={collection.cover_photo}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="w-16 h-16 text-blue-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center gap-2 text-sm">
                        <Images className="w-4 h-4" />
                        <span>{collection.photo_count} photos</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{collection.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Collection Detail View */}
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedCollection(null);
                setCollectionPhotos([]);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              ← Back to Collections
            </button>

            <div className="glass-morphism rounded-xl p-6 shadow-elevation-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCollection.name}</h2>
              {selectedCollection.description && (
                <p className="text-gray-600 mb-4">{selectedCollection.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Images className="w-4 h-4" />
                  <span>{collectionPhotos.length} photos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(selectedCollection.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Photos */}
          {collectionPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Images className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos in this collection</h3>
              <p className="text-gray-600">Add photos from your library to this collection</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {collectionPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo.id)}
                  className="group cursor-pointer bg-white rounded-xl shadow-elevation-2 hover:shadow-elevation-4 overflow-hidden transition-all duration-300 hover:transform hover:scale-[1.02]"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <LazyImage
                      src={photo.imageUrl || photo.image_url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="font-semibold mb-1">{photo.title}</h3>
                      <p className="text-sm text-white/80">{photo.date_taken}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{photo.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{photo.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photos={collectionPhotos}
        initialIndex={viewerPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
