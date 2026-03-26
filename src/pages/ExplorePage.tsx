import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Sparkles, Tag as TagIcon, Compass, Flame, Heart, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabase';
import { PhotoGridItem } from '../components/PhotoGridItem';
import { PhotoDetailModal } from '../components/PhotoDetailModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Photo } from '../types';

interface Collection {
  id: string;
  name: string;
  description: string;
  photo_count: number;
  cover_photo?: string;
}

const CATEGORY_TAGS = [
  { name: 'All', icon: Compass, color: 'from-blue-500 to-cyan-500' },
  { name: 'Nature', icon: Sparkles, color: 'from-green-500 to-emerald-500' },
  { name: 'Architecture', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  { name: 'People', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { name: 'Food', icon: Flame, color: 'from-yellow-500 to-orange-500' },
  { name: 'Travel', icon: Compass, color: 'from-purple-500 to-indigo-500' },
  { name: 'Pets', icon: Heart, color: 'from-teal-500 to-cyan-500' },
  { name: 'Celebration', icon: Sparkles, color: 'from-pink-500 to-purple-500' },
];

export function ExplorePage() {
  const [trendingPhotos, setTrendingPhotos] = useState<Photo[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Collection[]>([]);
  const [explorePhotos, setExplorePhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 12;

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const trendingPromise = (async () => {
        try {
          const { data, error } = await supabase
            .from('photos')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(8);

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

          setTrendingPhotos(photosWithTags);
        } catch (error) {
          console.error('Error fetching trending photos:', error);
        }
      })();

      const featuredPromise = (async () => {
        try {
          const { data: collections, error } = await supabase
            .from('collections')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4);

          if (error) throw error;

          const collectionsWithDetails = await Promise.all(
            (collections || []).map(async (collection) => {
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
                  .eq('is_public', true)
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

          setFeaturedStories(collectionsWithDetails.filter(c => c.cover_photo));
        } catch (error) {
          console.error('Error fetching featured stories:', error);
        }
      })();

      await Promise.all([
        trendingPromise,
        featuredPromise
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExplorePhotos = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;

    try {
      const query = supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) throw error;

      let photosWithTags = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);

          return {
            ...photo,
            tags: tags?.map(t => t.tag_name).filter(t => !t.startsWith('gallery_')) || []
          };
        })
      );

      if (selectedCategory !== 'All') {
        photosWithTags = photosWithTags.filter(photo =>
          photo.tags?.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase())
        );
      }

      if (reset) {
        setExplorePhotos(photosWithTags);
        setPage(0);
      } else {
        setExplorePhotos(prev => [...prev, ...photosWithTags]);
      }

      setHasMore(photosWithTags.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading explore photos:', error);
    }
  }, [page, selectedCategory]);

  const loadMorePhotos = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);

    try {
      const query = supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) throw error;

      let photosWithTags = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);

          return {
            ...photo,
            tags: tags?.map(t => t.tag_name).filter(t => !t.startsWith('gallery_')) || []
          };
        })
      );

      if (selectedCategory !== 'All') {
        photosWithTags = photosWithTags.filter(photo =>
          photo.tags?.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase())
        );
      }

      setExplorePhotos(prev => [...prev, ...photosWithTags]);
      setHasMore(photosWithTags.length > 0);
    } catch (error) {
      console.error('Error loading more photos:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, selectedCategory]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadExplorePhotos(true);
  }, [selectedCategory, loadExplorePhotos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMorePhotos();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMorePhotos]);

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(0);
    setHasMore(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="skeleton h-12 w-64 rounded-xl mb-8" />
        <SkeletonLoader count={8} variant="masonry" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-bold gradient-text mb-3 flex items-center gap-3">
          <Compass className="w-10 h-10" />
          Explore
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Discover amazing photos and stories from the community
        </p>
      </motion.div>

      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trending Now
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => handlePhotoClick(photo)}
            >
              <img
                src={photo.image_url || photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{photo.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-200">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{Math.floor(Math.random() * 1000) + 100}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{Math.floor(Math.random() * 100) + 10}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" />
                HOT
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {featuredStories.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Stories
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {story.cover_photo && (
                  <img
                    src={story.cover_photo}
                    alt={story.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{story.name}</h3>
                    {story.description && (
                      <p className="text-gray-200 mb-3 line-clamp-2">{story.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Eye className="w-4 h-4" />
                      <span>{story.photo_count} photos</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TagIcon className="w-6 h-6 text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Browse by Category
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {CATEGORY_TAGS.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.name;

            return (
              <motion.button
                key={category.name}
                onClick={() => handleCategoryChange(category.name)}
                className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  isSelected
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
                {category.name}
              </motion.button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {explorePhotos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                layout
              >
                <PhotoGridItem
                  photo={photo}
                  onClick={() => handlePhotoClick(photo)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {loadingMore && (
          <div className="mt-8">
            <SkeletonLoader count={4} variant="masonry" />
          </div>
        )}

        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {!hasMore && explorePhotos.length > 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You've reached the end
            </p>
          )}
        </div>
      </section>

      {selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
