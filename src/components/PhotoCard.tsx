import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, Trash2, X, Share2, Twitter, Facebook, Linkedin, Plus, Globe } from 'lucide-react';
import type { PhotoCardProps } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function PhotoCard({ photo, isFlipped, onFlip, onDelete, onUpdate, viewMode, isPublicView = false }: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPhoto, setEditedPhoto] = useState({
    ...photo,
    categories: photo.categories || []
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPublicView) {
      fetchCategories();
    }
  }, [isPublicView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim(), user_id: user.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('A category with this name already exists');
        } else {
          console.error('Error adding category:', error);
        }
        return;
      }

      // Ensure we don't add duplicate categories
      setCategories(prev => [...prev, data]);
      setEditedPhoto(prev => ({
        ...prev,
        categories: Array.from(new Set([...(prev.categories || []), data.name]))
      }));
      setNewCategory('');
    } catch (error) {
      console.error('Error in handleAddCategory:', error);
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setEditedPhoto(prev => {
      const currentCategories = prev.categories || [];
      const newCategories = currentCategories.includes(categoryName)
        ? currentCategories.filter(c => c !== categoryName)
        : [...currentCategories, categoryName];
      
      return {
        ...prev,
        categories: Array.from(new Set(newCategories))
      };
    });
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const shareUrl = window.location.href;
    const text = `Check out this memory: ${photo.title}`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const formatDateForInput = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const handleMouseEnter = () => {
    if (viewMode === 'slide' && !isFullscreen) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsFullscreen(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing && !isPublicView) {
      if (viewMode === 'slide') {
        setIsFullscreen(true);
      } else {
        onFlip();
      }
    }
  };

  const handleSave = () => {
    onUpdate({
      ...photo,
      title: editedPhoto.title,
      date_taken: editedPhoto.date_taken,
      reason: editedPhoto.reason,
      categories: Array.from(new Set(editedPhoto.categories || [])),
      is_public: editedPhoto.is_public
    });
    setIsEditing(false);
  };

  const renderShareMenu = () => (
    <div 
      ref={shareMenuRef}
      className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg py-1 min-w-[120px] z-50"
    >
      <button
        onClick={() => handleShare('twitter')}
        className="w-full px-3 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-100 text-xs"
      >
        <Twitter className="w-3.5 h-3.5" />
        Twitter
      </button>
      <button
        onClick={() => handleShare('facebook')}
        className="w-full px-3 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-100 text-xs"
      >
        <Facebook className="w-3.5 h-3.5" />
        Facebook
      </button>
      <button
        onClick={() => handleShare('linkedin')}
        className="w-full px-3 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-100 text-xs"
      >
        <Linkedin className="w-3.5 h-3.5" />
        LinkedIn
      </button>
    </div>
  );

  const renderDetails = () => (
    <div className="h-full flex flex-col">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editedPhoto.title}
            onChange={(e) => setEditedPhoto(prev => ({ ...prev, title: e.target.value }))}
            className="text-base font-bold mb-2 px-2 py-1 border rounded"
          />
          
          <div className="flex items-center gap-1.5 text-gray-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <input
              type="date"
              value={formatDateForInput(editedPhoto.date_taken || '')}
              onChange={(e) => setEditedPhoto(prev => ({ 
                ...prev, 
                date_taken: new Date(e.target.value).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }))}
              className="px-2 py-1 border rounded text-xs"
            />
          </div>
          
          <div className="flex-grow">
            <textarea
              value={editedPhoto.reason}
              onChange={(e) => setEditedPhoto(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full h-24 px-2 py-1 border rounded mb-3 text-xs"
              placeholder="What makes this memory special?"
            />

            <div className="space-y-2">
              <h4 className="font-medium text-xs">Categories</h4>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <label
                    key={`${photo.id}-category-${category.id}`}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full cursor-pointer text-xs transition-colors ${
                      editedPhoto.categories?.includes(category.name)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editedPhoto.categories?.includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                      className="sr-only"
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-1">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add new category"
                  className="flex-1 px-2 py-1 text-xs border rounded"
                />
                <button
                  type="submit"
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={editedPhoto.is_public}
                  onChange={(e) => setEditedPhoto(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Make this photo public
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setEditedPhoto(photo);
                setIsEditing(false);
              }}
              className="px-2.5 py-1 text-gray-600 hover:text-gray-900 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
            >
              Save
            </button>
          </div>
        </>
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
            
            {photo.categories && photo.categories.length > 0 && (
              <div className="mt-2">
                <h4 className="font-medium text-[10px] mb-1">Categories</h4>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(photo.categories)).map((category, index) => (
                    <span
                      key={`${photo.id}-category-${category}-${index}`}
                      className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {photo.is_public && (
              <div className="mt-2 flex items-center gap-1 text-green-600">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px]">Public photo</span>
              </div>
            )}
          </div>
          
          {!isPublicView && (
            <div className="flex justify-between items-center mt-auto">
              <div className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Click to flip back</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="px-2.5 py-1 text-blue-600 hover:text-blue-700 text-xs"
              >
                Edit
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (viewMode === 'slide') {
    return (
      <>
        <div 
          ref={cardRef}
          className="relative w-full h-[400px] group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img 
            src={photo.image_url} 
            alt={photo.title}
            className="w-full h-full object-cover rounded-lg shadow-lg cursor-zoom-in"
            onClick={handleCardClick}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {!isPublicView && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareMenu(!showShareMenu);
                    }}
                    className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  {showShareMenu && renderShareMenu()}
                </div>
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
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold">{photo.title}</h3>
                {photo.is_public && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-100 text-[10px] rounded-full">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">{photo.date_taken}</span>
              </div>
              <p className="text-[10px] text-gray-200">{photo.reason}</p>
              {photo.categories && photo.categories.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Array.from(new Set(photo.categories)).map((category, index) => (
                    <span
                      key={`${photo.id}-slide-${category}-${index}`}
                      className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isFullscreen && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onMouseLeave={() => setIsFullscreen(false)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 z-[101]">
              {!isPublicView && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareMenu(!showShareMenu);
                    }}
                    className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {showShareMenu && renderShareMenu()}
                </div>
              )}
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 text-white hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg cursor-zoom-out"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div 
                className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-w-4xl mx-auto text-white">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold">{photo.title}</h3>
                    {photo.is_public && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-100 text-[10px] rounded-full">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs">{photo.date_taken}</span>
                  </div>
                  <p className="text-xs text-gray-200">{photo.reason}</p>
                  {photo.categories && photo.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(new Set(photo.categories)).map((category, index) => (
                        <span
                          key={`${photo.id}-fullscreen-${category}-${index}`}
                          className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
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
        <div className="absolute w-full h-full backface-hidden">
          <img 
            src={photo.image_url}
            alt={photo.title}
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
          {!isPublicView && (
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareMenu(!showShareMenu);
                  }}
                  className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                {showShareMenu && renderShareMenu()}
              </div>
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
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">{photo.title}</h3>
              {photo.is_public && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-100 text-[10px] rounded-full">
                  <Globe className="w-3 h-3" />
                  Public
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-lg shadow-lg p-3">
          {renderDetails()}
        </div>
      </div>
    </div>
  );
}