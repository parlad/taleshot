import React, { useState } from 'react';
import { Calendar, Trash2, Edit3, Save, X, Eye, EyeOff } from 'lucide-react';
import type { PhotoCardProps, Category } from '../types';

export function PhotoCard({ 
  photo, 
  isFlipped, 
  onFlip, 
  onDelete, 
  onUpdate, 
  viewMode = 'flip',
  isPublicView = false 
}: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: photo.title,
    date_taken: photo.date_taken || photo.dateTaken || '',
    reason: photo.reason,
    is_public: photo.is_public || false,
    categories: photo.categories || []
  });

  const handleCardClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onFlip();
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...photo,
        title: editData.title,
        date_taken: editData.date_taken,
        reason: editData.reason,
        is_public: editData.is_public,
        categories: editData.categories
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      title: photo.title,
      date_taken: photo.date_taken || photo.dateTaken || '',
      reason: photo.reason,
      is_public: photo.is_public || false,
      categories: photo.categories || []
    });
    setIsEditing(false);
  };

  if (viewMode === 'slide') {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="aspect-square">
          <img 
            src={photo.image_url || photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{photo.title}</h3>
            {!isPublicView && (
              <div className="flex items-center gap-2">
                {photo.is_public ? (
                  <Eye className="w-4 h-4 text-green-600" title="Public" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" title="Private" />
                )}
                <button
                  onClick={() => onDelete(photo.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{photo.date_taken}</span>
          </div>
          <p className="text-gray-700 text-sm">{photo.reason}</p>
          {photo.categories && photo.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {photo.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[400px] cursor-pointer group perspective"
      onClick={handleCardClick}
    >
      <div className={`preserve-3d duration-500 w-full h-full ${
        isFlipped ? 'rotate-y-180' : ''
      }`}>
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden">
          <img 
            src={photo.image_url || photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
          {!isPublicView && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              {photo.is_public ? (
                <div className="p-1.5 bg-green-500 text-white rounded-full" title="Public">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1.5 bg-gray-500 text-white rounded-full" title="Private">
                  <EyeOff className="w-3.5 h-3.5" />
                </div>
              )}
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
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg">
            <h3 className="text-white text-sm font-medium">{photo.title}</h3>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-lg shadow-lg p-3">
          <div className="h-full flex flex-col">
            {!isPublicView && (
              <div className="flex justify-end mb-2">
                {!isEditing ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave();
                      }}
                      className="p-1 text-green-500 hover:text-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel();
                      }}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {isEditing ? (
              <div className="flex-grow space-y-2">
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-sm font-bold border border-gray-300 rounded px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <input
                  type="date"
                  value={editData.date_taken}
                  onChange={(e) => setEditData(prev => ({ ...prev, date_taken: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <textarea
                  value={editData.reason}
                  onChange={(e) => setEditData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 flex-grow resize-none"
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`public-${photo.id}`}
                    checked={editData.is_public}
                    onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.checked }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor={`public-${photo.id}`} className="text-xs text-gray-600">
                    Make public
                  </label>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold mb-2">{photo.title}</h3>
                
                <div className="flex items-center gap-1.5 text-gray-600 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">{photo.date_taken}</span>
                </div>
                
                <div className="flex-grow">
                  <h4 className="font-medium text-xs mb-1">Memory</h4>
                  <p className="text-gray-700 text-xs">{photo.reason}</p>
                </div>

                {photo.categories && photo.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {photo.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {photo.is_public ? (
                      <>
                        <Eye className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Public</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Private</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}