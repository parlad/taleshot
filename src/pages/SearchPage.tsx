import React, { useState, useEffect } from 'react';
import { Search, User, Image, ArrowLeft, Calendar, Tag, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo;
}

function PhotoModal({ isOpen, onClose, photo }: PhotoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row items-center justify-center w-full h-full max-w-7xl gap-6">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Photo Info */}
          <div className="w-full lg:w-80 bg-white rounded-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{photo.title}</h2>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {photo.date_taken}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Story</h3>
                <p className="text-gray-700 leading-relaxed">{photo.reason}</p>
              </div>

              {photo.tags && photo.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {photo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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

      // Add tags to each photo
      const photosWithTags = await Promise.all(
        photos.map(async (p) => {
          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', p.id);
          
          return {
            ...p,
            tags: tags?.map(t => t.tag_name) || []
          };
        })
      );

      setSelectedUser({
        user_id: userId,
        user_email: userEmail,
        first_name: firstName,
        last_name: lastName,
        photos: photosWithTags || []
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
      <>
        <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {formatUserName(selectedUser.first_name, selectedUser.last_name, selectedUser.user_email)}'s Photos
            </h1>
            <p className="text-white/70">{selectedUser.photos.length} public photos</p>
          </div>
        </div>

        {selectedUser.photos.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No public photos</h3>
            <p className="text-white/70">This user hasn't shared any public photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedUser.photos.map(photo => (
              <div 
                key={photo.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Photo info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-white text-lg leading-tight mb-2">{photo.title}</h3>
                    <div className="flex items-center text-white/80 text-sm mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      {photo.date_taken}
                    </div>
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {photo.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {photo.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                            +{photo.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Photo Modal */}
        {selectedPhoto && (
          <PhotoModal
            isOpen={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            photo={selectedPhoto}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Discover Public Photos</h1>
        <p className="text-white/70">Search for users and explore their public photo collections</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 glass-effect rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:bg-white/90 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500"
          />
        </div>
      </div>

      {isSearching && (
        <div className="text-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white/70">Searching...</div>
          </div>
        </div>
      )}

      {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
        <div className="text-center py-8">
          <p className="text-white/70">Type at least 3 characters to search</p>
        </div>
      )}

      {searchResults.length === 0 && searchQuery.trim().length > 2 && !isSearching && (
        <div className="text-center py-8">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
          <p className="text-white/70">Try searching with different keywords</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map(result => (
            <div
              key={result.user_id}
              onClick={() => loadUserProfile(result.user_id, result.user_email, result.first_name, result.last_name)}
              className="card-modern p-6 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
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
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
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