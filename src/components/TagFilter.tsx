import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  onSearch?: (query: string) => void;
}

export function TagFilter({ availableTags, selectedTag, onTagChange, onSearch }: TagFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSearch?.(searchQuery);
  }, [searchQuery, onSearch]);

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search photos, tags, or stories…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => {
            (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.4)';
            (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)';
            (e.target as HTMLInputElement).style.background = 'var(--bg-overlay)';
          }}
          onBlur={e => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
            (e.target as HTMLInputElement).style.boxShadow = 'none';
            (e.target as HTMLInputElement).style.background = 'var(--bg-elevated)';
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag chip strip */}
      {availableTags.length > 0 && (
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All pill */}
          <button
            onClick={() => onTagChange('all')}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={
              selectedTag === 'all'
                ? { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', boxShadow: '0 0 12px rgba(45,212,191,0.1)' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
            onMouseEnter={e => {
              if (selectedTag !== 'all') {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={e => {
              if (selectedTag !== 'all') {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }
            }}
          >
            All
          </button>

          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagChange(selectedTag === tag ? 'all' : tag)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={
                selectedTag === tag
                  ? { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', boxShadow: '0 0 12px rgba(45,212,191,0.1)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
              onMouseEnter={e => {
                if (selectedTag !== tag) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
                }
              }}
              onMouseLeave={e => {
                if (selectedTag !== tag) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                }
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
