import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Photo } from '../types';

interface AlbumTimelineProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function AlbumTimeline({ photos, onPhotoClick }: AlbumTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedPhotos = [...photos].sort((a, b) => {
    const dateA = new Date(a.capture_date || a.created_at).getTime();
    const dateB = new Date(b.capture_date || b.created_at).getTime();
    return dateA - dateB;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (sortedPhotos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No photos in timeline</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timeline View
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {sortedPhotos.length} photos chronologically
        </span>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sortedPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              className="flex-shrink-0 group/item cursor-pointer"
            >
              <div className="relative">
                <div className="w-64 h-40 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                  <img
                    src={photo.image_url || photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover transform group-hover/item:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </div>

                <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 dark:text-white shadow-lg">
                  {formatDate(photo.capture_date || photo.created_at)}
                </div>

                {index < sortedPhotos.length - 1 && (
                  <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-teal-400 to-blue-400" />
                )}
              </div>

              <div className="mt-2 px-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {photo.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}
