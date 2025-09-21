import React, { useState, useEffect } from 'react';
import { Search, User, Image, ArrowLeft, Calendar, Tag, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex">
      {/* Photo Section - 70% */}
      <div className="w-[70%] h-full flex items-center justify-center bg-black">
        <img
          src={photo.image_url}
          alt={photo.title}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Info Section - 30% */}
      <div className="w-[30%] h-full bg-white overflow-y-auto">
        <div className="p-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Photo Details</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">{photo.title}</h3>
              <div className="flex items-center text-gray-500 text-sm mb-3">
                <Calendar className="w-3 h-3 mr-1" />
                {photo.date_taken}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Story</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{photo.reason}</p>
            </div>

            {photo.tags && photo.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {photo.tags.filter(tag => !tag.startsWith('gallery_')).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Visibility</h4>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs">
                  <Eye className="w-3 h-3" />
                  Public
                </span>
              </div>
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 space-y-8 px-6 py-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-purple-700 hover:bg-white rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {formatUserName(selectedUser.first_name, selectedUser.last_name, selectedUser.user_email)}'s Photos
            </h1>
            <p className="text-gray-600 font-medium">{selectedUser.photos.length} public photos shared</p>
            </div>
          </div>
        </div>

        {selectedUser.photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
              <Image className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No public photos</h3>
            <p className="text-gray-500">This photographer hasn't shared any public photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {selectedUser.photos.map(photo => (
              <div 
                key={photo.id} 
                className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-white/50 overflow-hidden cursor-pointer transition-all duration-500 hover:transform hover:scale-[1.02]"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Photo info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-bold text-white text-lg leading-tight mb-2">{photo.title}</h3>
                    <div className="flex items-center text-white/90 text-sm mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      {photo.date_taken}
                    </div>
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {photo.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white/25 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-white/20"
                          >
                            {tag}
                          </span>
                        ))}
                        {photo.tags.length > 2 && (
                          <span className="px-3 py-1 bg-white/25 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-white/20">
                            +{photo.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Hover icon */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 space-y-8 px-6 py-8">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Discover Public Photos
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Search for users and explore their beautiful public photo collections from around the world
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email to discover amazing photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl focus:ring-2 focus:ring-purple-500/50 focus:bg-white focus:border-purple-300 outline-none transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-lg hover:shadow-xl group-hover:shadow-xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>
      </div>

      {isSearching && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-4">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-gray-600 font-medium">Searching for amazing photos...</div>
        </div>
      )}

      {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Type at least 3 characters to start searching</p>
        </div>
      )}

      {searchResults.length === 0 && searchQuery.trim().length > 2 && !isSearching && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500">Try searching with different keywords or names</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Found {searchResults.length} photographer{searchResults.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-gray-600">Click on any photographer to explore their public collection</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {searchResults.map(result => (
            <div
              key={result.user_id}
              onClick={() => loadUserProfile(result.user_id, result.user_email, result.first_name, result.last_name)}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-white/50 p-6 cursor-pointer transition-all duration-500 hover:transform hover:scale-[1.02] hover:bg-white/90"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-purple-700 transition-colors duration-300">
                    {formatUserName(result.first_name, result.last_name, result.user_email)}
                  </h3>
                  <p className="text-gray-500 text-sm">{result.user_email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-gray-600 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full">
                  <Image className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">{result.photo_count} public photos</span>
                </div>
              </div>

              {result.sample_photos && result.sample_photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {result.sample_photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                  <span className="text-sm font-medium">View Collection</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}