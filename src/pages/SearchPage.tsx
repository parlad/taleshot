import React, { useState, useEffect } from 'react';
import { Search, User, Image, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Photo } from '../types';

interface SearchResult {
  user_id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  photo_count: number;
  sample_photos: any[];
}

interface UserProfile {
  user_id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  photos: Photo[];
}

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
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

  const loadUserProfile = async (userId: string, userEmail: string, firstName: string, lastName: string) => {
    setIsLoadingProfile(true);
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setSelectedUser({
        user_id: userId,
        user_email: userEmail,
        first_name: firstName,
        last_name: lastName,
        photos: photos || []
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const formatUserName = (firstName: string, lastName: string, email: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return email.split('@')[0];
  };

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formatUserName(selectedUser.first_name, selectedUser.last_name, selectedUser.user_email)}'s Photos
            </h1>
            <p className="text-gray-600">{selectedUser.photos.length} public photos</p>
          </div>
        </div>

        {selectedUser.photos.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No public photos</h3>
            <p className="text-gray-600">This user hasn't shared any public photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedUser.photos.map(photo => (
              <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{photo.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{photo.date_taken}</p>
                  <p className="text-sm text-gray-700">{photo.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Public Photos</h1>
        <p className="text-gray-600">Search for users and explore their public photo collections</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {isSearching && (
        <div className="text-center py-8">
          <div className="text-gray-500">Searching...</div>
        </div>
      )}

      {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Type at least 3 characters to search</p>
        </div>
      )}

      {searchResults.length === 0 && searchQuery.trim().length > 2 && !isSearching && (
        <div className="text-center py-8">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try searching with different keywords</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map(result => (
            <div
              key={result.user_id}
              onClick={() => loadUserProfile(result.user_id, result.user_email, result.first_name, result.last_name)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {formatUserName(result.first_name, result.last_name, result.user_email)}
                  </h3>
                  <p className="text-sm text-gray-600">{result.user_email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Image className="w-4 h-4" />
                <span>{result.photo_count} public photos</span>
              </div>

              {result.sample_photos && result.sample_photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {result.sample_photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="aspect-square rounded-md overflow-hidden">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}