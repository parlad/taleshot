import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Unlock, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../hooks/useFavorites';
import type { Photo } from '../types';

interface PhotoViewerModalProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoViewerModal({ photos, initialIndex, isOpen, onClose }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const currentPhoto = photos[currentIndex];
  const { isFavorite, toggleFavorite } = useFavorites(currentPhoto?.id);

  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (!isOpen || photos.length === 0) return null;

  const visibleTags = currentPhoto.tags?.filter((t) => !t.startsWith('gallery_')) ?? [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 py-8">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal card — light, centered, scrollable */}
        <motion.div
          className="relative w-full max-w-4xl card-glass overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header: title + meta + actions ── */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <motion.h2
                  key={`title-${currentIndex}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold gradient-text leading-snug"
                >
                  {currentPhoto.title}
                </motion.h2>

                {/* Story — sits like a subtitle, right under title */}
                {currentPhoto.reason && (
                  <motion.p
                    key={`reason-${currentIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
                  >
                    {currentPhoto.reason}
                  </motion.p>
                )}

                {/* Meta badges row */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {currentPhoto.is_public !== undefined && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      currentPhoto.is_public
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {currentPhoto.is_public ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {currentPhoto.is_public ? 'Public' : 'Private'}
                    </span>
                  )}
                  {photos.length > 1 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium tabular-nums">
                      {currentIndex + 1} / {photos.length}
                    </span>
                  )}
                  {visibleTags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isFavorite
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400'
                  }`}
                  title={isFavorite ? 'Unfavorite' : 'Favorite'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>
                <button
                  onClick={onClose}
                  className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Image — no background, seamless with card ── */}
          <div className="relative flex items-center justify-center min-h-[300px] rounded-b-2xl overflow-hidden">
            {/* Prev */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 shadow-sm transition-all"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <motion.div
              key={currentIndex}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <img
                src={currentPhoto.image_url ?? ''}
                alt={currentPhoto.title}
                className="w-full max-h-[60vh] object-contain"
              />
            </motion.div>

            {/* Next */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 shadow-sm transition-all"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
