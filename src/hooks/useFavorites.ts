import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

export function useFavorites(photoId?: string) {
  const { user } = useSupabaseAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && photoId) {
      checkIfFavorite();
    }
  }, [user, photoId]);

  const checkIfFavorite = async () => {
    if (!user || !photoId) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('photo_id', photoId)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !photoId || loading) return;

    setLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('photo_id', photoId);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{
            user_id: user.id,
            photo_id: photoId
          }]);

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, toggleFavorite, loading };
}
