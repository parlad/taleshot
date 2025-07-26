import React, { useState } from 'react';
import { Search, Users, Image as ImageIcon, Mail } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { SearchResult } from '../types';

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.rpc('search_public_photos_with_profile', {
        search_query: searchQuery.trim()
      });

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Discover Public Memories
        </h1>
        <p className="text-gray-600 text-lg">
          Search for users and explore their shared photo collections
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {hasSearched && (
        <div>
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                Try searching with a different email or name
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
              </h2>
              
              {searchResults.map((result) => (
                <div key={result.user_id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {(result.first_name?.[0] || result.user_email[0]).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {result.first_name && result.last_name 
                                ? `${result.first_name} ${result.last_name}`
                                : result.user_email
                              }
                            </h3>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">{result.user_email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {result.photo_count} public photo{result.photo_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Sample Photos */}
                    {result.sample_photos && result.sample_photos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Sample Photos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {result.sample_photos.slice(0, 4).map((photo) => (
                            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={photo.image_url}
                                alt={photo.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="text-center py-16">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Start Your Search
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter an email address or name to find users who have shared their photo collections publicly
          </p>
        </div>
      )}
    </div>
  );
}