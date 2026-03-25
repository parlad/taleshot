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
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div
          className="relative w-full h-full flex flex-col items-center justify-center px-16 py-8 gap-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          {photos.length > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tracking-widest uppercase">
              {currentIndex + 1} &nbsp;/&nbsp; {photos.length}
            </div>
          )}

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={currentIndex}
            className="flex-shrink-0"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <img
              src={currentPhoto.image_url ?? ''}
              alt={currentPhoto.title}
              className="max-h-[62vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </motion.div>

          {/* Info panel */}
          <motion.div
            key={`info-${currentIndex}`}
            className="w-full max-w-2xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-xl leading-snug truncate">
                  {currentPhoto.title}
                </h2>
                {currentPhoto.date_taken && (
                  <p className="text-white/50 text-sm mt-0.5">{currentPhoto.date_taken}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>
                <div
                  className={`p-2 rounded-full ${currentPhoto.is_public ? 'bg-blue-600/80' : 'bg-white/10'}`}
                  title={currentPhoto.is_public ? 'Public' : 'Private'}
                >
                  {currentPhoto.is_public ? (
                    <Unlock className="w-4 h-4 text-white" />
                  ) : (
                    <Lock className="w-4 h-4 text-white/60" />
                  )}
                </div>
              </div>
            </div>

            {currentPhoto.reason && (
              <p className="text-white/70 text-sm leading-relaxed mt-3 line-clamp-3">
                {currentPhoto.reason}
              </p>
            )}

            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {visibleTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white/10 text-white/80 text-xs rounded-full font-medium border border-white/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
