import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import type { Photo } from '../types';

interface AlbumMapViewProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function AlbumMapView({ photos, onPhotoClick }: AlbumMapViewProps) {
  const photosWithGPS = useMemo(() => {
    return photos.filter(p => p.gps_latitude && p.gps_longitude);
  }, [photos]);

  const bounds = useMemo(() => {
    if (photosWithGPS.length === 0) return null;

    const lats = photosWithGPS.map(p => p.gps_latitude!);
    const lngs = photosWithGPS.map(p => p.gps_longitude!);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
      centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2
    };
  }, [photosWithGPS]);

  if (photosWithGPS.length === 0) {
    return (
      <div className="card-glass p-8 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Location Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Photos in this album don't have GPS metadata. Add location data to see them on the map.
        </p>
      </div>
    );
  }

  const normalizeCoord = (value: number, min: number, max: number) => {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 80 + 10;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Map View
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {photosWithGPS.length} photo{photosWithGPS.length !== 1 ? 's' : ''} with location
        </span>
      </div>

      <div className="relative bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="aspect-video relative">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-400" />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {bounds && photosWithGPS.map((photo) => {
            const x = normalizeCoord(photo.gps_longitude!, bounds.minLng, bounds.maxLng);
            const y = 100 - normalizeCoord(photo.gps_latitude!, bounds.minLat, bounds.maxLat);

            return (
              <div
                key={photo.id}
                onClick={() => onPhotoClick(photo)}
                className="absolute group cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-75" />
                  <div className="relative w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-white dark:bg-gray-700 hover:scale-125 transition-transform">
                    <img
                      src={photo.image_url || photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-xl">
                      {photo.title}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {bounds && (
            <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="font-medium">
                  Lat: {bounds.centerLat.toFixed(4)}, Lng: {bounds.centerLng.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Live Locations
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {photosWithGPS.slice(0, 4).map((photo) => (
          <div
            key={photo.id}
            onClick={() => onPhotoClick(photo)}
            className="card-glass p-3 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2">
              <img
                src={photo.image_url || photo.imageUrl}
                alt={photo.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {photo.title}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">
                    {photo.gps_latitude?.toFixed(2)}, {photo.gps_longitude?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
