import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // First ensure profile exists
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error('Error ensuring profile exists:', upsertError);
        throw upsertError;
      }

      // Then fetch the profile
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!data) {
        throw new Error('Profile not found');
      }

      setProfile({
        ...data,
        email: user.email!
      });
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile');
      console.error('Profile error:', error);
      setError(error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: updates.first_name,
          last_name: updates.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (updates.email && updates.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: updates.email
        });

        if (emailError) throw emailError;
      }

      await fetchProfile();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      console.error('Update error:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile
  };
}