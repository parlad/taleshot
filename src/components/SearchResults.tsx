import React from 'react';
import { ArrowLeft, Users, Image as ImageIcon, Mail } from 'lucide-react';
import type { SearchResult } from '../types';
import { UserPhotoGallery } from './UserPhotoGallery';

interface SearchResultsProps {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  selectedUser: SearchResult | null;
  onUserSelect: (user: SearchResult) => void;
  onBackToSearch: () => void;
}

export function SearchResults({ 
  searchQuery, 
  searchResults, 
  isSearching, 
  selectedUser, 
  onUserSelect, 
  onBackToSearch 
}: SearchResultsProps) {
  if (selectedUser) {
    return (
      <div>
        <button
          onClick={onBackToSearch}
          className="flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to search results</span>
        </button>
        <UserPhotoGallery user={selectedUser} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!searchQuery ? (
        <div className="text-center py-16">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Search for Users
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Use the search bar above to find users who have shared their photo collections publicly
          </p>
        </div>
      ) : isSearching ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for "{searchQuery}"...</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            No users found matching "{searchQuery}". Try a different search term.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
          </h2>
          
          {searchResults.map((result) => (
            <div 
              key={result.user_id} 
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => onUserSelect(result)}
            >
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
  );
}