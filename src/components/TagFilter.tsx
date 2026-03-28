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
          style={{ color: focused ? 'rgba(45,212,191,0.7)' : 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search photos, stories, tags…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full pl-11 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-200"
          style={{
            background: focused ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
            border: `1px solid ${focused ? 'rgba(45,212,191,0.35)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
            boxShadow: focused ? '0 0 0 3px rgba(45,212,191,0.07)' : 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--border-strong)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
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
                    background: 'rgba(45,212,191,0.14)',
                    color: '#2dd4bf',
                    border: '1px solid rgba(45,212,191,0.28)',
                    boxShadow: '0 0 10px rgba(45,212,191,0.08)',
                  }
                : {
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }
            }
            onMouseEnter={(e) => {
              if (selectedTag !== 'all') {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTag !== 'all') {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
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
                        background: 'rgba(45,212,191,0.14)',
                        color: '#2dd4bf',
                        border: '1px solid rgba(45,212,191,0.28)',
                        boxShadow: '0 0 10px rgba(45,212,191,0.08)',
                      }
                    : {
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'var(--border-strong)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-overlay)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
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
