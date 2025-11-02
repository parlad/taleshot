import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { LazyImage } from '../components/LazyImage';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Photo } from '../types';

export function ExplorePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  useEffect(() => {
    fetchPublicPhotos();
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [photos, searchQuery, selectedTag]);

  const fetchPublicPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const photosWithTags = await Promise.all(
        (data || []).map(async (photo) => {
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

      setPhotos(photosWithTags);

      // Extract unique tags
      const tags = new Set<string>();
      photosWithTags.forEach(photo => {
        photo.tags?.forEach(tag => {
          if (!tag.startsWith('gallery_')) {
            tags.add(tag);
          }
        });
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error fetching public photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPhotos = () => {
    let filtered = [...photos];

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(photo => photo.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(photo => {
        const matchesTitle = photo.title.toLowerCase().includes(query);
        const matchesReason = photo.reason.toLowerCase().includes(query);
        const matchesTags = photo.tags?.some(tag => tag.toLowerCase().includes(query));
        return matchesTitle || matchesReason || matchesTags;
      });
    }

    setFilteredPhotos(filtered);
  };

  const handlePhotoClick = (photoId: string) => {
    const index = filteredPhotos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setViewerPhotoIndex(index);
      setViewerOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="skeleton h-20 w-full rounded-2xl mb-8" />
        <SkeletonLoader count={9} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Explore
        </h1>
        <p className="text-gray-600">Discover amazing photos from the Taleshot community</p>
      </div>

      {/* Search and Filter */}
      <div className="glass-morphism rounded-xl p-6 mb-8 shadow-elevation-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, story, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm min-w-[200px]"
          >
            <option value="all">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Tag Pills */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTag === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {availableTags.slice(0, 8).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600 font-medium">
          {filteredPhotos.length} {filteredPhotos.length === 1 ? 'photo' : 'photos'} found
        </p>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery ? `No photos found for "${searchQuery}"` : 'No public photos available'}
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhotos.map((photo) => (
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
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{photo.reason}</p>

                {photo.tags && photo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {photo.tags.filter(tag => !tag.startsWith('gallery_')).slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {photo.tags.filter(tag => !tag.startsWith('gallery_')).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                        +{photo.tags.filter(tag => !tag.startsWith('gallery_')).length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photos={filteredPhotos}
        initialIndex={viewerPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
