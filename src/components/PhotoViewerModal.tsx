import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Unlock, Heart, Share2 } from 'lucide-react';
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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
      <div
        className="relative w-full h-full max-w-7xl mx-auto flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Image Container */}
        <motion.div
          className="relative max-w-5xl max-h-[80vh] flex flex-col items-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.img
            src={currentPhoto.imageUrl || currentPhoto.image_url}
            alt={currentPhoto.title}
            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Photo Info */}
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-white mb-2">{currentPhoto.title}</h2>
                <p className="text-white/80 text-sm">{currentPhoto.date_taken}</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  className={`p-2 rounded-full transition-all ${
                    isFavorite
                      ? 'bg-red-600 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>
                <div
                  className={`p-2 rounded-full ${
                    currentPhoto.is_public ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  title={currentPhoto.is_public ? 'Public' : 'Private'}
                >
                  {currentPhoto.is_public ? (
                    <Unlock className="w-4 h-4 text-white" />
                  ) : (
                    <Lock className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </div>

            <p className="text-white/90 leading-relaxed mb-4">{currentPhoto.reason}</p>

            {currentPhoto.tags && currentPhoto.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentPhoto.tags
                  .filter((tag) => !tag.startsWith('gallery_'))
                  .map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/20 text-white text-sm rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Counter */}
          {photos.length > 1 && (
            <div className="mt-4 text-white/80 text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </motion.div>
      </div>
      </motion.div>
    </AnimatePresence>
  );
}
