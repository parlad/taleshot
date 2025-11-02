import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { Photo } from '../types';

export function usePhotos(userId?: string) {
  return useQuery({
    queryKey: ['photos', userId],
    queryFn: async () => {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithTags = await Promise.all(
        (photos || []).map(async (photo) => {
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

      return photosWithTags as Photo[];
    },
    enabled: !!userId,
  });
}

export function usePublicPhotos() {
  return useQuery({
    queryKey: ['photos', 'public'],
    queryFn: async () => {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithTags = await Promise.all(
        (photos || []).map(async (photo) => {
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

      return photosWithTags as Photo[];
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { data: photo } = await supabase
        .from('photos')
        .select('image_url')
        .eq('id', photoId)
        .single();

      if (photo?.image_url) {
        const fileName = photo.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('photos').remove([fileName]);
        }
      }

      const { error: tagError } = await supabase
        .from('photo_tags')
        .delete()
        .eq('photo_id', photoId);

      if (tagError) throw tagError;

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, updates }: { photoId: string; updates: Partial<Photo> }) => {
      const { error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', photoId);

      if (error) throw error;

      if (updates.tags) {
        await supabase.from('photo_tags').delete().eq('photo_id', photoId);

        if (updates.tags.length > 0) {
          const tagInserts = updates.tags.map(tagName => ({
            photo_id: photoId,
            tag_name: tagName
          }));

          await supabase.from('photo_tags').insert(tagInserts);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}
