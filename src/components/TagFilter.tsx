import React, { useState, useEffect } from 'react';
import { Tag, ChevronDown, X } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface TagFilterProps {
  selectedTag: string;
  onTagChange: (tag: string) => void;
}

export function TagFilter({ selectedTag, onTagChange }: TagFilterProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all unique tags for the current user
      const { data, error } = await supabase
        .from('photo_tags')
        .select(`
          tag_name,
          photos!inner(user_id)
        `)
        .eq('photos.user_id', user.id);

      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }

      // Extract unique tag names
      const uniqueTags = [...new Set(data?.map(item => item.tag_name) || [])];
      setAvailableTags(uniqueTags.sort());
    } catch (error) {
      console.error('Error in fetchAvailableTags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSelect = (tag: string) => {
    onTagChange(tag);
    setIsDropdownOpen(false);
  };

  const clearFilter = () => {
    onTagChange('all');
    setIsDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-gray-500">
        <Tag className="w-4 h-4 animate-spin" />
        <span>Loading tags...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
      >
        <Tag className="w-4 h-4" />
        <span className="font-medium">
          {selectedTag === 'all' ? 'All Tags' : selectedTag}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
            {/* All Tags Option */}
            <button
              onClick={clearFilter}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                selectedTag === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                <Tag className="w-3 h-3 text-white" />
              </div>
              <span>All Tags</span>
              {selectedTag === 'all' && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* Divider */}
            {availableTags.length > 0 && (
              <div className="border-t border-gray-100 my-2" />
            )}

            {/* Individual Tags */}
            {availableTags.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No tags found. Add some tags to your photos!
              </div>
            ) : (
              availableTags.map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    selectedTag === tag ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium`}
                    style={{
                      background: `hsl(${(index * 137.5) % 360}, 70%, 60%)`
                    }}
                  >
                    {tag.charAt(0).toUpperCase()}
                  </div>
                  <span>{tag}</span>
                  {selectedTag === tag && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))
            )}

            {/* Clear Filter Option */}
            {selectedTag !== 'all' && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <button
                  onClick={clearFilter}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filter</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}