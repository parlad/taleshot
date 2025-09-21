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
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300 text-gray-700 text-sm"
      >
        <Tag className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <div className="py-1">
            <button
              onClick={() => {
                onTagChange('all');
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                selectedTag === 'all' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
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
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  selectedTag === tag ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
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