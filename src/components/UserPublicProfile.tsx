import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { PhotoCard } from './PhotoCard';
import type { Photo } from '../types';
import { ArrowLeft } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function UserPublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ email: string | null; first_name: string | null; last_name: string | null } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    try {
      // First check if user exists and get their email
      const { data: emailData, error: emailError } = await supabase.rpc('get_user_email', {
        user_id: userId
      });

      if (emailError || !emailData?.email) {
        setError('User not found');
        setIsLoading(false);
        return;
      }

      // Then get their profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      setProfile({
        email: emailData.email,
        first_name: profileData?.first_name || null,
        last_name: profileData?.last_name || null
      });

      // Finally, fetch their public photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select(`
          *,
          photo_categories (
            categories (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      const transformedPhotos = (photosData || []).map(photo => ({
        ...photo,
        categories: photo.photo_categories
          ?.map(pc => pc.categories?.name)
          .filter(Boolean) || []
      }));

      setPhotos(transformedPhotos);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (!profile) return 'User';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.email || 'User';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <p className="text-gray-500">
              The user you're looking for might not exist or their profile is not accessible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getUserDisplayName()}'s Public Photos
          </h1>
          <p className="text-gray-500">
            {photos.length} public {photos.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {photos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isFlipped={false}
                onFlip={() => {}}
                onDelete={() => {}}
                onUpdate={() => {}}
                viewMode="slide"
                isPublicView
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No public photos available
          </div>
        )}
      </div>
    </div>
  );
}