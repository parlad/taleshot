import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Loader, Camera } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { AdvancedSearchFilters } from '../components/AdvancedSearchFilters';
import { PhotoGridItem } from '../components/PhotoGridItem';
import { PhotoDetailModal } from '../components/PhotoDetailModal';
import { MasonryGrid } from '../components/MasonryGrid';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Photo } from '../types';

interface SearchFilters {
  tags?: string[];
  dateRange?: { start?: string; end?: string };
  colorTone?: string;
  isPublic?: boolean;
  storyId?: string;
}

export function SearchPage() {
  const { user } = useSupabaseAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<any>(null);

  useEffect(() => {
    fetchAvailableTags();
  }, [user]);

  const fetchAvailableTags = async () => {
    try {
      const { data: tags } = await supabase
        .from('photo_tags')
        .select('tag_name')
        .order('tag_name');

      if (tags) {
        const uniqueTags = Array.from(new Set(tags.map(t => t.tag_name)))
          .filter(tag => !tag.startsWith('gallery_'));
        setAvailableTags(uniqueTags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleAISearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const apiUrl = `${supabaseUrl}/functions/v1/ai-search`;

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: searchQuery,
          filters,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.photos || []);
      setSearchMetadata(data.metadata);
    } catch (error) {
      console.error('AI search error:', error);
      await fallbackSearch();
    } finally {
      setLoading(false);
    }
  };

  const fallbackSearch = async () => {
    try {
      let query = supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      }

      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      if (filters.colorTone) {
        query = query.eq('color_tone', filters.colorTone);
      }

      if (filters.dateRange?.start) {
        query = query.gte('created_at', filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        query = query.lte('created_at', filters.dateRange.end);
      }

      const { data: photos, error } = await query;

      if (error) throw error;

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

      let filtered = photosWithTags;

      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(photo =>
          filters.tags!.some(tag => photo.tags?.includes(tag))
        );
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(photo => {
          const searchableText = [
            photo.title,
            photo.reason,
            photo.ai_description,
            ...(photo.tags || [])
          ].join(' ').toLowerCase();
          return searchableText.includes(query);
        });
      }

      setSearchResults(filtered);
    } catch (error) {
      console.error('Fallback search error:', error);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handlePhotoUpdate = async (updatedPhoto: Photo) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          title: updatedPhoto.title,
          date_taken: updatedPhoto.date_taken,
          reason: updatedPhoto.reason
        })
        .eq('id', updatedPhoto.id);

      if (error) throw error;

      if (updatedPhoto.tags) {
        await supabase.from('photo_tags').delete().eq('photo_id', updatedPhoto.id);

        if (updatedPhoto.tags.length > 0) {
          const tagInserts = updatedPhoto.tags.map(tagName => ({
            photo_id: updatedPhoto.id,
            tag_name: tagName
          }));
          await supabase.from('photo_tags').insert(tagInserts);
        }
      }

      setSearchResults(results =>
        results.map(p => p.id === updatedPhoto.id ? updatedPhoto : p)
      );
      setSelectedPhoto(updatedPhoto);
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const photo = searchResults.find(p => p.id === photoId);
      if (photo?.image_url) {
        const fileName = photo.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('photos').remove([fileName]);
        }
      }

      await supabase.from('photo_tags').delete().eq('photo_id', photoId);
      await supabase.from('photos').delete().eq('id', photoId);

      setSearchResults(results => results.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  useEffect(() => {
    if (Object.keys(filters).length > 0 || searchQuery.trim()) {
      handleAISearch();
    }
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">AI-Powered Search</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search naturally: "mountains in Japan", "blue ocean photos", "family vacation"
        </p>
      </div>

      <form onSubmit={handleAISearch} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Sparkles className="w-5 h-5 text-sky-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Try: 'sunset photos', 'pictures from last summer', 'blue images'..."
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            aria-label="AI search query"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute inset-y-0 right-0 px-6 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 text-white rounded-r-xl hover:from-sky-600 hover:via-cyan-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
            aria-label="Search"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {searchMetadata && (
        <div className="mb-4 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300">
            <Sparkles className="w-4 h-4" />
            <span>
              AI found: {searchMetadata.extractedTags?.length > 0 && (
                <>tags: {searchMetadata.extractedTags.join(', ')}</>
              )}
              {searchMetadata.colorHints?.length > 0 && (
                <> • colors: {searchMetadata.colorHints.join(', ')}</>
              )}
            </span>
          </div>
        </div>
      )}

      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
      />

      {loading ? (
        <SkeletonLoader count={8} variant="masonry" />
      ) : searchResults.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No photos found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery.trim() || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'Start searching with AI-powered natural language'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              Found {searchResults.length} photo{searchResults.length !== 1 ? 's' : ''}
            </p>
          </div>

          <MasonryGrid>
            {searchResults.map((photo) => (
              <PhotoGridItem
                key={photo.id}
                photo={photo}
                onClick={() => handlePhotoClick(photo)}
              />
            ))}
          </MasonryGrid>
        </div>
      )}

      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handlePhotoUpdate}
          onDelete={handlePhotoDelete}
        />
      )}
    </div>
  );
}
