import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tag, Search } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  onSearch?: (query: string) => void;
}

export function TagFilter({ availableTags, selectedTag, onTagChange, onSearch }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState(availableTags);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredTags(availableTags);
  }, [availableTags]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = availableTags.filter(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTags(filtered);
      onSearch?.(searchQuery);
    } else {
      setFilteredTags(availableTags);
      onSearch?.('');
    }
  }, [searchQuery, availableTags, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayText = selectedTag === 'all' ? 'All Tags' : selectedTag;

  return (
    <div className="flex items-center gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 w-64"
        />
      </div>

      {/* Tag Filter Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`tag-button ${
            selectedTag === 'all' ? 'tag-button-inactive' : 'tag-button-active'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{displayText}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-[1000] py-2 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  onTagChange('all');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg mx-2 ${
                  selectedTag === 'all' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                All Tags
              </button>
              {filteredTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    onTagChange(tag);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg mx-2 ${
                    selectedTag === tag 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}