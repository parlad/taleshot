import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Unlock, Heart, Calendar, MapPin, Tag, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../hooks/useFavorites';
import type { Photo } from '../types';

type TabId = 'photo' | 'timeline' | 'map' | 'tags';

interface PhotoViewerModalProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoViewerModal({ photos, initialIndex, isOpen, onClose }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeTab, setActiveTab] = useState<TabId>('photo');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const currentPhoto = photos[currentIndex];
  const { isFavorite, toggleFavorite } = useFavorites(currentPhoto?.id);

  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setActiveTab('photo');
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
    setActiveTab('photo');
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setActiveTab('photo');
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
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrevious();
  };

  if (!isOpen || photos.length === 0) return null;

  const visibleTags = currentPhoto.tags?.filter((t) => !t.startsWith('gallery_')) ?? [];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'photo', label: 'Photo', icon: ImageIcon },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

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

        {/* Modal card */}
        <motion.div
          className="relative w-full max-w-4xl card-glass overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-start justify-between gap-4 pb-4">
              <div className="flex-1 min-w-0">
                <motion.h2
                  key={`title-${currentIndex}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold gradient-text leading-snug"
                >
                  {currentPhoto.title}
                </motion.h2>

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

                {/* Meta badges */}
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

            {/* ── Tabs — same style as AlbumDetailView ── */}
            <div className="flex flex-wrap gap-0 border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-semibold'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab content ── */}
          <AnimatePresence mode="wait">

            {/* Photo tab — image with nav arrows */}
            {activeTab === 'photo' && (
              <motion.div
                key="tab-photo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-center min-h-[300px] rounded-b-2xl overflow-hidden"
              >
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

                {photos.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 shadow-sm transition-all"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            )}

            {/* Timeline tab */}
            {activeTab === 'timeline' && (
              <motion.div
                key="tab-timeline"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-8 rounded-b-2xl"
              >
                <div className="space-y-5">
                  {currentPhoto.date_taken ? (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date Taken</p>
                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{formatDate(currentPhoto.date_taken)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No capture date available for this photo.</p>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Added to Library</p>
                      <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{formatDate(currentPhoto.created_at)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Map tab */}
            {activeTab === 'map' && (
              <motion.div
                key="tab-map"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-8 rounded-b-2xl"
              >
                {currentPhoto.gps_latitude != null && currentPhoto.gps_longitude != null ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      <span className="font-medium tabular-nums">
                        {currentPhoto.gps_latitude.toFixed(5)}, {currentPhoto.gps_longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-56">
                      <iframe
                        title="Photo location"
                        width="100%"
                        height="100%"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentPhoto.gps_longitude - 0.01},${currentPhoto.gps_latitude - 0.01},${currentPhoto.gps_longitude + 0.01},${currentPhoto.gps_latitude + 0.01}&layer=mapnik&marker=${currentPhoto.gps_latitude},${currentPhoto.gps_longitude}`}
                        style={{ border: 0 }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-3">
                    <MapPin className="w-10 h-10 opacity-40" />
                    <p className="text-sm">No location data available for this photo.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Tags tab */}
            {activeTab === 'tags' && (
              <motion.div
                key="tab-tags"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-8 rounded-b-2xl"
              >
                {visibleTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm rounded-full font-medium border border-teal-100 dark:border-teal-800"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 gap-3">
                    <Tag className="w-10 h-10 opacity-40" />
                    <p className="text-sm">No tags added to this photo yet.</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
