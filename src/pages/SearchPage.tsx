import React, { useState } from 'react';
import { Search, Users, Camera, Eye, Calendar, Tag, Images } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { PhotoGalleryModal } from '../components/PhotoGalleryModal';
import type { Photo, User } from '../types';

interface SearchResult {
  user_id: string;
  user_email: string;
  first_name?: string;
  last_name?: string;
  photo_count: number;
  sample_photos: Photo[];
}

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserPhotos, setSelectedUserPhotos] = useState<Photo[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Search for users with public photos
      const { data: users, error } = await supabase
        .rpc('search_public_photos_with_profile', { search_query: searchQuery });

      if (error) throw error;

      // Group photos by batch_id for each user
      const processedResults = await Promise.all(
        (users || []).map(async (user) => {
          // Get all public photos for this user
          const { data: allPhotos, error: photosError } = await supabase
            .from('photos')
            .select('*')
            .eq('user_id', user.user_id)
            .eq('is_public', true)
            .order('created_at', { ascending: false });

          if (photosError) throw photosError;

          // Get tags for each photo
          const photosWithTags = await Promise.all(
            (allPhotos || []).map(async (photo) => {
              const { data: tags } = await supabase
                .from('photo_tags')
                .select('tag_name')
                .eq('photo_id', photo.id);
              
              return {
                ...photo,
                tags: tags?.map(t => t.tag_name).filter(tag => !tag.startsWith('gallery_')) || []
              };
            })
          );

          // Group photos by batch_id
          const batchGroups = new Map<string, Photo[]>();
          const individualPhotos: Photo[] = [];
          
          photosWithTags.forEach(photo => {
            if (photo.batch_id && photo.upload_type === 'group') {
              if (!batchGroups.has(photo.batch_id)) {
                batchGroups.set(photo.batch_id, []);
              }
              batchGroups.get(photo.batch_id)!.push(photo);
            } else {
              individualPhotos.push(photo);
            }
          });
          
          // Create display photos array with gallery tiles
          const displayPhotos: Photo[] = [...individualPhotos];
          
          batchGroups.forEach((groupPhotos, batchId) => {
            if (groupPhotos.length > 1) {
              // Create a gallery tile using the first photo as representative
              const representative: Photo = {
                ...groupPhotos[0],
                is_gallery_tile: true,
                gallery_photos: groupPhotos
              };
              displayPhotos.push(representative);
            } else if (groupPhotos.length === 1) {
              // Single photo in batch, treat as individual
              displayPhotos.push(groupPhotos[0]);
            }
          });

          return {
            ...user,
            sample_photos: displayPhotos.slice(0, 6) // Show up to 6 photos/tiles
          };
        })
      );

      setSearchResults(processedResults);
    } catch (error) {
      console.error('Error searching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = async (userId: string, photoIndex: number) => {
    try {
      // Get all public photos for this user
      const { data: allPhotos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get tags for each photo
      const photosWithTags = await Promise.all(
        (allPhotos || []).map(async (photo) => {
          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);
          
          return {
            ...photo,
            tags: tags?.map(t => t.tag_name).filter(tag => !tag.startsWith('gallery_')) || []
          };
        })
      );

      setSelectedUserPhotos(photosWithTags);
      setGalleryIndex(photoIndex);
      setIsGalleryOpen(true);
    } catch (error) {
      console.error('Error loading user photos:', error);
    }
  };

  const handleGalleryClick = async (photo: Photo) => {
    if (!photo.batch_id || !photo.gallery_photos) return;

    setSelectedUserPhotos(photo.gallery_photos);
    setGalleryIndex(0);
    setIsGalleryOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">Discover Photos</h1>
        <p className="text-gray-600">Search for users and explore their public photo collections</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-lg"
            placeholder="Search by email or name..."
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-8">
          {searchResults.map((result) => (
            <div key={result.user_id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {result.first_name && result.last_name 
                      ? `${result.first_name} ${result.last_name}` 
                      : result.user_email
                    }
                  </h3>
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {result.photo_count} public photos shared
                  </p>
                </div>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {result.sample_photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative group"
                    onClick={() => {
                      if (photo.is_gallery_tile && photo.gallery_photos) {
                        handleGalleryClick(photo);
                      } else {
                        handlePhotoClick(result.user_id, index);
                      }
                    }}
                  >
                    <img
                      src={photo.image_url || photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Gallery indicator */}
                    {photo.is_gallery_tile && photo.gallery_photos && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Images className="w-3 h-3" />
                        {photo.gallery_photos.length}
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <h4 className="font-medium text-sm truncate">{photo.title}</h4>
                        <div className="flex items-center text-xs text-white/80 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {photo.date_taken}
                        </div>
                      </div>
                    </div>
                    
                    {/* Public indicator */}
                    <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full">
                      <Eye className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              {result.photo_count > 6 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => handlePhotoClick(result.user_id, 0)}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all {result.photo_count} photos →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {searchQuery && !loading && searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            No users found matching "{searchQuery}". Try searching with a different email or name.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!searchQuery && searchResults.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Exploring</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Search for users by their email address or name to discover their public photo collections.
          </p>
        </div>
      )}

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={selectedUserPhotos}
        initialIndex={galleryIndex}
      />
    </div>
  );
}