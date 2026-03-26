import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Calendar, Tag as TagIcon, Lock, Unlock, Palette, ChevronDown } from 'lucide-react';

interface SearchFilters {
  tags?: string[];
  dateRange?: { start?: string; end?: string };
  colorTone?: string;
  isPublic?: boolean;
  storyId?: string;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
  availableStories?: { id: string; name: string }[];
}

const COLOR_TONES = [
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'green', label: 'Green', color: '#10b981' },
  { value: 'yellow', label: 'Yellow', color: '#eab308' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'purple', label: 'Purple', color: '#a855f7' },
  { value: 'pink', label: 'Pink', color: '#ec4899' },
  { value: 'brown', label: 'Brown', color: '#92400e' },
  { value: 'warm', label: 'Warm', color: '#fb923c' },
  { value: 'cool', label: 'Cool', color: '#60a5fa' },
  { value: 'neutral', label: 'Neutral', color: '#9ca3af' },
];

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  availableTags
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleColorToneChange = (tone: string) => {
    const newTone = filters.colorTone === tone ? undefined : tone;
    onFiltersChange({ ...filters, colorTone: newTone });
  };

  const handlePrivacyChange = (isPublic: boolean | undefined) => {
    onFiltersChange({ ...filters, isPublic });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const dateRange = { ...filters.dateRange };
    if (type === 'start') {
      dateRange.start = value || undefined;
    } else {
      dateRange.end = value || undefined;
    }
    onFiltersChange({ ...filters, dateRange });
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    onFiltersChange({});
  };

  const activeFiltersCount = [
    selectedTags.length > 0,
    filters.colorTone,
    filters.isPublic !== undefined,
    filters.dateRange?.start || filters.dateRange?.end,
    filters.storyId
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span>Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {availableTags.length > 10 && (
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    +{availableTags.length - 10} more
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_TONES.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => handleColorToneChange(tone.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      filters.colorTone === tone.value
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: tone.color }}
                    />
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Privacy
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrivacyChange(undefined)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.isPublic === undefined
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Photos
                </button>
                <button
                  onClick={() => handlePrivacyChange(true)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filters.isPublic === true
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  Public
                </button>
                <button
                  onClick={() => handlePrivacyChange(false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filters.isPublic === false
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Private
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
