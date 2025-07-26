/*
  # Fix search function type mismatch

  1. Changes
    - Update function to cast email to text type
    - Keep security definer and permissions
*/

CREATE OR REPLACE FUNCTION search_public_photos(search_query text)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  photo_count bigint,
  sample_photos jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text as user_email,
    COUNT(p.id) as photo_count,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'image_url', p.image_url,
        'date_taken', p.date_taken
      )
    ) FILTER (WHERE p.id IS NOT NULL) as sample_photos
  FROM auth.users u
  LEFT JOIN photos p ON u.id = p.user_id AND p.is_public = true
  WHERE 
    u.email ILIKE '%' || search_query || '%'
    AND EXISTS (
      SELECT 1 FROM photos p2
      WHERE p2.user_id = u.id 
      AND p2.is_public = true
    )
  GROUP BY u.id, u.email;
END;
$$;