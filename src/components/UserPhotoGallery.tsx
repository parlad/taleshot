import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { SearchResult, Photo } from '../types';

interface UserPhotoGalleryProps {
  user: SearchResult;
}

export function UserPhotoGallery({ user }: UserPhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchUserPhotos();
  }, [user.user_id]);

  const fetchUserPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user photos:', error);
        return;
      }

      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching user photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading photos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* User Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {(user.first_name?.[0] || user.user_email[0]).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.user_email
              }
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.user_email}</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">{photos.length} public photos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No public photos</h3>
          <p className="text-gray-600">This user hasn't shared any photos publicly yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{photo.title}</h3>
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{photo.date_taken}</span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{photo.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex">
              <div className="flex-1">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-cover max-h-[70vh]"
                />
              </div>
              <div className="w-80 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedPhoto.title}</h2>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{selectedPhoto.date_taken}</span>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Memory</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedPhoto.reason}</p>
                </div>

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <User className="w-4 h-4" />
                  <span>
                    by {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.user_email
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}