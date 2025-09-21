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
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 hover:shadow-sm transition-all duration-300 text-gray-700 text-sm font-medium"
      >
        <Tag className="w-4 h-4 text-indigo-500" />
        <span>{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] py-1 overflow-hidden">
          <div>
            <button
              onClick={() => {
                onTagChange('all');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm font-medium transition-all duration-200 ${
                selectedTag === 'all' 
                  ? 'bg-indigo-50 text-indigo-700 border-r-3 border-indigo-500' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
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
                className={`w-full text-left px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedTag === tag 
                    ? 'bg-indigo-50 text-indigo-700 border-r-3 border-indigo-500' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
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