import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Tag, Maximize2 } from 'lucide-react';
import type { Photo } from '../types';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  initialIndex: number;
}

export function PhotoGalleryModal({ isOpen, onClose, photos, initialIndex }: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => prev > 0 ? prev - 1 : photos.length - 1);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length, onClose]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const goToPrevious = () => setCurrentIndex(prev => prev > 0 ? prev - 1 : photos.length - 1);
  const goToNext = () => setCurrentIndex(prev => prev < photos.length - 1 ? prev + 1 : 0);

  const handleImageClick = () => {
    setIsFullscreen(true);
  };

  const handleFullscreenClose = () => {
    setIsFullscreen(false);
  };

  return (
    <div className={`fixed inset-0 bg-black ${isFullscreen ? 'bg-opacity-100' : 'bg-opacity-90'} flex items-center justify-center z-50`}>
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={isFullscreen ? handleFullscreenClose : onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Fullscreen Toggle Button */}
        {!isFullscreen && (
          <button
            onClick={handleImageClick}
            className="absolute top-4 right-16 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            title="View fullscreen"
          >
            <Maximize2 className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Buttons */}
        {photos.length > 1 && !isFullscreen && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Main Content */}
        <div className={`flex ${isFullscreen ? 'flex-col' : 'flex-col lg:flex-row'} items-center justify-center w-full h-full max-w-7xl gap-6`}>
          {/* Image */}
          <div className={`${isFullscreen ? 'w-full h-full' : 'flex-1'} flex items-center justify-center`}>
            <img
              src={currentPhoto.image_url || currentPhoto.imageUrl}
              alt={currentPhoto.title}
              className={`${isFullscreen ? 'max-w-full max-h-full' : 'max-w-full max-h-[80vh]'} object-contain ${isFullscreen ? '' : 'rounded-lg shadow-2xl cursor-pointer'} transition-all`}
              onClick={!isFullscreen ? handleImageClick : undefined}
            />
          </div>

          {/* Photo Info */}
          {!isFullscreen && (
            <div className="w-full lg:w-80 bg-white rounded-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentPhoto.title}</h2>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {currentPhoto.date_taken}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Story</h3>
                <p className="text-gray-700 leading-relaxed">{currentPhoto.reason}</p>
              </div>

              {currentPhoto.tags && currentPhoto.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentPhoto.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {photos.length > 1 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Gallery</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setCurrentIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentIndex
                            ? 'border-blue-500'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={photo.image_url || photo.imageUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {currentIndex + 1} of {photos.length}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Fullscreen Navigation */}
        {isFullscreen && photos.length > 1 && (
          <React.Fragment>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Photo counter in fullscreen */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
              {currentIndex + 1} of {photos.length}
            </div>
          </React.Fragment>
        )}

        {/* Fullscreen Photo Info Overlay */}
        {isFullscreen && (
          <React.Fragment>
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-1">{currentPhoto.title}</h3>
            <div className="flex items-center text-white/80 text-sm mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              {currentPhoto.date_taken}
            </div>
            {currentPhoto.tags && currentPhoto.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentPhoto.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {currentPhoto.tags.length > 3 && (
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs rounded-full">
                    +{currentPhoto.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}