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
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-indigo-200 transition-all duration-300 text-gray-700 text-sm font-medium shadow-sm hover:shadow-md"
      >
        <Tag className="w-4 h-4 text-indigo-500" />
        <span className="font-medium text-gray-700">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50 py-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/80 pointer-events-none"></div>
          <div className="py-1">
            <button
              onClick={() => {
                onTagChange('all');
                setIsOpen(false);
              }}
              className={`relative w-full text-left px-4 py-2.5 text-sm transition-all duration-200 ${
                selectedTag === 'all' 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold border-r-2 border-indigo-500' 
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
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
                className={`relative w-full text-left px-4 py-2.5 text-sm transition-all duration-200 ${
                  selectedTag === tag 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold border-r-2 border-indigo-500' 
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
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