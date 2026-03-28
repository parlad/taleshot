import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Calendar, Tag, Globe, Lock } from 'lucide-react';
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

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleNext();
    else if (distance < -50) handlePrevious();
  };

  if (!isOpen || photos.length === 0) return null;

  const visibleTags = currentPhoto.tags?.filter((t) => !t.startsWith('gallery_')) ?? [];
  const hasInfo = !!currentPhoto.reason || visibleTags.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        key="photo-viewer"
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ background: '#03050c' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ─── Top chrome ─────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-start justify-between px-7 pt-6 pb-3 z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(3,5,12,0.95) 60%, transparent)',
          }}
        >
          {/* Title + meta */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`meta-${currentIndex}`}
              className="flex-1 min-w-0 pr-6"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <h2
                className="text-2xl font-bold leading-tight truncate"
                style={{ color: '#f5f8ff', letterSpacing: '-0.025em' }}
              >
                {currentPhoto.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {currentPhoto.date_taken && (
                  <span
                    className="flex items-center gap-1.5 text-[13px]"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    <Calendar className="w-3 h-3" />
                    {currentPhoto.date_taken}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={
                    currentPhoto.is_public
                      ? {
                          background: 'rgba(45,212,191,0.1)',
                          color: '#2dd4bf',
                          border: '1px solid rgba(45,212,191,0.18)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.35)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }
                  }
                >
                  {currentPhoto.is_public ? (
                    <Globe className="w-2.5 h-2.5" />
                  ) : (
                    <Lock className="w-2.5 h-2.5" />
                  )}
                  {currentPhoto.is_public ? 'Public' : 'Private'}
                </span>
                {photos.length > 1 && (
                  <span
                    className="text-[13px] tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.22)' }}
                  >
                    {currentIndex + 1}
                    <span style={{ margin: '0 3px', color: 'rgba(255,255,255,0.12)' }}>/</span>
                    {photos.length}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
              style={
                isFavorite
                  ? { background: 'rgba(225,29,72,0.9)', color: 'white' }
                  : {
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.45)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }
              }
              onMouseEnter={(e) => {
                if (!isFavorite) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'rgba(225,29,72,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fb7185';
                }
              }}
              onMouseLeave={(e) => {
                if (!isFavorite) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
                }
              }}
              title={isFavorite ? 'Unfavourite' : 'Favourite'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
              }}
              title="Close  (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Image — dominant centrepiece ───────────────────────────── */}
        <div
          className="flex-1 relative flex items-center justify-center min-h-0"
          style={{ padding: photos.length > 1 ? '8px 76px' : '8px 32px' }}
        >
          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.1)';
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={currentPhoto.image_url ?? ''}
              alt={currentPhoto.title}
              className="max-h-full max-w-full rounded-xl"
              style={{
                objectFit: 'contain',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.65)',
              }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              draggable={false}
            />
          </AnimatePresence>

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'rgba(255,255,255,0.1)';
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ─── Bottom info strip ───────────────────────────────────────── */}
        <AnimatePresence>
          {hasInfo && (
            <motion.div
              key={`info-${currentIndex}`}
              className="flex-shrink-0 px-7 py-4"
              style={{
                background: 'linear-gradient(to top, rgba(3,5,12,0.95) 60%, transparent)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {currentPhoto.reason && (
                <p
                  className="text-sm leading-relaxed line-clamp-2 max-w-3xl"
                  style={{ color: 'rgba(255,255,255,0.42)' }}
                >
                  {currentPhoto.reason}
                </p>
              )}
              {visibleTags.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 ${currentPhoto.reason ? 'mt-2.5' : ''}`}>
                  {visibleTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{
                        background: 'rgba(45,212,191,0.06)',
                        color: 'rgba(45,212,191,0.6)',
                        border: '1px solid rgba(45,212,191,0.1)',
                      }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom safe area */}
        <div className="flex-shrink-0 h-4" />
      </motion.div>
    </AnimatePresence>
  );
}
