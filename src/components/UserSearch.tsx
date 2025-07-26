import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SearchResult {
  user_id: string;
  user_email: string;
  first_name: string | null;
  last_name: string | null;
  photo_count: number;
  sample_photos: Array<{
    id: string;
    title: string;
    image_url: string;
    date_taken: string;
  }>;
}

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_public_photos_with_profile', {
        search_query: query
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDisplayName = (result: SearchResult) => {
    if (result.first_name && result.last_name) {
      return `${result.first_name} ${result.last_name}`;
    }
    return result.user_email;
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search users..."
            className="w-64 pl-9 pr-4 py-1.5 bg-white/10 text-white placeholder-white/60 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showResults && (searchQuery.length >= 2 || results.length > 0) && (
        <div 
          className="absolute top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.user_id}
                  onClick={() => {
                    navigate(`/user/${result.user_id}`);
                    setShowResults(false);
                    setSearchQuery('');
                  }}
                  className="w-full p-4 border-b last:border-b-0 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{getUserDisplayName(result)}</h3>
                      {result.first_name && result.last_name && (
                        <p className="text-sm text-gray-500">{result.user_email}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {result.photo_count} public {result.photo_count === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                  {result.sample_photos && result.sample_photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {result.sample_photos.slice(0, 4).map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square rounded-lg overflow-hidden"
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No users found
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}

      {showResults && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}