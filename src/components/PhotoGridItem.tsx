import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, Eye, Calendar, Tag as TagIcon } from 'lucide-react';
import { LazyImage } from './LazyImage';
import type { Photo } from '../types';

interface PhotoGridItemProps {
  photo: Photo;
  onClick: () => void;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
}

export function PhotoGridItem({ photo, onClick, onFavoriteToggle, isFavorite }: PhotoGridItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  const photoCount = photo.gallery_photos?.length || 0;
  const displayTags = photo.tags?.filter(tag => !tag.startsWith('gallery_')).slice(0, 2) || [];

  return (
    <motion.div
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View photo: ${photo.title}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <LazyImage
        src={photo.image_url || photo.imageUrl || ''}
        alt={photo.title || 'Photo'}
        className="w-full h-auto"
      />

      {photoCount > 1 && (
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
          <Eye className="w-4 h-4" />
          {photoCount}
        </div>
      )}

      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{photo.title}</h3>

          {photo.date_taken && (
            <div className="flex items-center gap-1.5 text-sm text-gray-200 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{photo.date_taken}</span>
            </div>
          )}

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                >
                  <TagIcon className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleFavoriteClick}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>
            <button
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              aria-label="Share photo"
              onClick={(e) => e.stopPropagation()}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
