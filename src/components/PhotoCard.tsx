import React, { useState } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import type { PhotoCardProps } from '../types';

export function PhotoCard({ photo, isFlipped, onFlip, onDelete }: PhotoCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlip();
  };

  return (
    <div 
      className="relative w-full h-[400px] cursor-pointer group perspective"
      onClick={handleCardClick}
    >
      <div className={`preserve-3d duration-500 w-full h-full ${
        isFlipped ? 'rotate-y-180' : ''
      }`}>
        <div className="absolute w-full h-full backface-hidden">
          <img 
            src={photo.image_url || photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
              className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
            <h3 className="text-white text-sm font-medium">{photo.title}</h3>
          </div>
        </div>

        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-lg shadow-lg p-3">
          <div className="h-full flex flex-col">
            <h3 className="text-base font-bold mb-2">{photo.title}</h3>
            
            <div className="flex items-center gap-1.5 text-gray-600 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs">{photo.date_taken || photo.dateTaken}</span>
            </div>
            
            <div className="flex-grow">
              <h4 className="font-medium text-xs mb-1">Memory</h4>
              <p className="text-gray-700 text-xs">{photo.reason}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}