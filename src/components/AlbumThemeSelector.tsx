import React from 'react';
import { Grid, Film, Image as ImageIcon, Minimize2 } from 'lucide-react';
import type { Photo } from '../types';

export type AlbumTheme = 'grid' | 'cinematic' | 'polaroid' | 'minimal';

interface AlbumThemeSelectorProps {
  currentTheme: AlbumTheme;
  onChange: (theme: AlbumTheme) => void;
}

interface AlbumThemeLayoutProps {
  theme: AlbumTheme;
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function AlbumThemeSelector({ currentTheme, onChange }: AlbumThemeSelectorProps) {
  const themes = [
    { id: 'grid' as AlbumTheme, name: 'Classic Grid', icon: Grid, desc: 'Clean masonry layout' },
    { id: 'cinematic' as AlbumTheme, name: 'Cinematic Story', icon: Film, desc: 'Wide cinematic frames' },
    { id: 'polaroid' as AlbumTheme, name: 'Polaroid Stack', icon: ImageIcon, desc: 'Vintage polaroid style' },
    { id: 'minimal' as AlbumTheme, name: 'Minimal Frame', icon: Minimize2, desc: 'Minimalist white space' }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Album Theme</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isActive = currentTheme === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => onChange(theme.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'}`} />
              <div className="text-left">
                <p className={`text-sm font-semibold mb-0.5 ${isActive ? 'text-teal-900 dark:text-teal-100' : 'text-gray-900 dark:text-white'}`}>
                  {theme.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{theme.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AlbumThemeLayout({ theme, photos, onPhotoClick }: AlbumThemeLayoutProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
        <p>No photos in this album</p>
      </div>
    );
  }

  switch (theme) {
    case 'cinematic':
      return (
        <div className="space-y-8">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-black shadow-2xl">
                <img
                  src={photo.image_url || photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <h3 className="text-2xl font-bold mb-1">{photo.title}</h3>
                  <p className="text-sm text-gray-200">{photo.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'polaroid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map((photo, index) => {
            const rotation = (index % 3 - 1) * 3;
            return (
              <div
                key={photo.id}
                onClick={() => onPhotoClick(photo)}
                className="cursor-pointer group"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="bg-white dark:bg-gray-800 p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-105 hover:rotate-0">
                  <div className="aspect-square mb-4 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={photo.image_url || photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-handwriting text-lg text-gray-800 dark:text-gray-200">
                      {photo.title}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'minimal':
      return (
        <div className="space-y-16 max-w-4xl mx-auto">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              className="cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={photo.image_url || photo.imageUrl}
                  alt={photo.title}
                  className="w-full shadow-sm group-hover:shadow-xl transition-all"
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-light text-gray-900 dark:text-white mb-2">
                  {photo.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {photo.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'grid':
    default:
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                <img
                  src={photo.image_url || photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm truncate">{photo.title}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
  }
}
