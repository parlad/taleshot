import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tag } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
}

export function TagFilter({ availableTags, selectedTag, onTagChange }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-300 text-gray-700 border border-gray-200"
      >
        <Tag className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu w-48">
          <div className="py-1">
            <button
              onClick={() => {
                onTagChange('all');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-all duration-300 rounded-lg ${
                selectedTag === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Tags
            </button>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  onTagChange(tag);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-all duration-300 rounded-lg ${
                  selectedTag === tag ? 'bg-indigo-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}