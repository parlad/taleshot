import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, MapPin, Calendar, Lock, Unlock } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { LazyImage } from '../components/LazyImage';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import type { Photo } from '../types';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    if (!username) return;

    setLoading(true);
    try {
      // Get current user to check if viewing own profile
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // For now, we'll use email as username (you can add a username field later)
      // Fetch user's public photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      // Get tags for each photo
      const photosWithTags = await Promise.all(
        (photosData || []).map(async (photo) => {
          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);

          return {
            ...photo,
            tags: tags?.map(t => t.tag_name) || []
          };
        })
      );

      setPhotos(photosWithTags);

      // Mock profile data (you can extend this later)
      if (photosData && photosData.length > 0) {
        setProfile({
          id: photosData[0].user_id,
          email: username,
          created_at: photosData[0].created_at
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (photoId: string) => {
    const index = photos.findIndex(p => p.id === photoId);
    if (index !== -1) {
      setViewerPhotoIndex(index);
      setViewerOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="skeleton h-32 w-full rounded-2xl mb-8" />
        <SkeletonLoader count={6} />
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">User not found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <div className="glass-morphism rounded-2xl p-8 mb-8 shadow-elevation-3">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-elevation-4">
            {username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{username}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Camera className="w-4 h-4" />
                <span className="text-sm">{photos.length} photos</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined {new Date(profile?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No public photos yet</div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Public Photos</h2>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => handlePhotoClick(photo.id)}
                className="group cursor-pointer bg-white rounded-xl shadow-elevation-2 hover:shadow-elevation-4 overflow-hidden transition-all duration-300 hover:transform hover:scale-[1.02]"
              >
                <div className="aspect-square relative overflow-hidden">
                  <LazyImage
                    src={photo.imageUrl || photo.image_url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-semibold mb-1">{photo.title}</h3>
                    <p className="text-sm text-white/80">{photo.date_taken}</p>
                  </div>

                  <div className="absolute top-3 right-3">
                    <div className="p-2 rounded-full bg-blue-600 shadow-lg">
                      <Unlock className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{photo.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{photo.reason}</p>

                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {photo.tags.filter(tag => !tag.startsWith('gallery_')).slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        photos={photos}
        initialIndex={viewerPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
