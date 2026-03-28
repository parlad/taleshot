import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTag: string;
  onTagChange: (tag: string) => void;
  onSearch?: (query: string) => void;
}

export function TagFilter({ availableTags, selectedTag, onTagChange, onSearch }: TagFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    onSearch?.(searchQuery);
  }, [searchQuery, onSearch]);

  return (
    <div className="space-y-3">
      {/* ── Search bar ── */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200"
          style={{ color: focused ? '#7c3aed' : 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search photos, stories, tags…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full pl-11 pr-10 py-2.5 rounded-2xl text-sm outline-none transition-all duration-200"
          style={{
            background: '#ffffff',
            border: `1px solid ${focused ? 'rgba(124,58,237,0.3)' : 'rgba(0,0,0,0.1)'}`,
            color: 'var(--text-primary)',
            boxShadow: focused
              ? '0 0 0 3px rgba(124,58,237,0.07), 0 2px 8px rgba(0,0,0,0.06)'
              : '0 1px 3px rgba(0,0,0,0.05)',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Tag chips ── */}
      {availableTags.length > 0 && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* "All" pill */}
          <button
            onClick={() => onTagChange('all')}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
            style={
              selectedTag === 'all'
                ? {
                    background: '#7c3aed',
                    color: '#ffffff',
                    boxShadow: '0 2px 10px rgba(124,58,237,0.28)',
                  }
                : {
                    background: '#ffffff',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }
            }
            onMouseEnter={(e) => {
              if (selectedTag !== 'all') {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.3)';
                (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTag !== 'all') {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }
            }}
          >
            All
          </button>

          {availableTags.map((tag) => {
            const active = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onTagChange(active ? 'all' : tag)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150"
                style={
                  active
                    ? {
                        background: '#7c3aed',
                        color: '#ffffff',
                        boxShadow: '0 2px 10px rgba(124,58,237,0.28)',
                      }
                    : {
                        background: '#ffffff',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#7c3aed';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
