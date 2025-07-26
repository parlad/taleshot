-- Drop existing functions
DROP FUNCTION IF EXISTS search_public_photos_with_profile(text);
DROP FUNCTION IF EXISTS get_user_email(uuid);

-- Create improved get_user_email function
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS TABLE (
  email text,
  found boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    users.email::text,
    true
  FROM auth.users
  WHERE users.id = user_id;
END;
$$;

-- Create improved search function with better profile handling
CREATE OR REPLACE FUNCTION search_public_photos_with_profile(search_query text)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  first_name text,
  last_name text,
  photo_count bigint,
  sample_photos jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_photos AS (
    SELECT 
      ph.user_id,
      COUNT(ph.id) as photo_count,
      jsonb_agg(
        jsonb_build_object(
          'id', ph.id,
          'title', ph.title,
          'image_url', ph.image_url,
          'date_taken', ph.date_taken
        )
      ) FILTER (WHERE ph.id IS NOT NULL) as sample_photos
    FROM photos ph
    WHERE ph.is_public = true
    GROUP BY ph.user_id
  )
  SELECT 
    u.id as user_id,
    u.email::text as user_email,
    p.first_name,
    p.last_name,
    COALESCE(up.photo_count, 0) as photo_count,
    COALESCE(up.sample_photos, '[]'::jsonb) as sample_photos
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN user_photos up ON u.id = up.user_id
  WHERE 
    (u.email ILIKE '%' || search_query || '%'
    OR p.first_name ILIKE '%' || search_query || '%'
    OR p.last_name ILIKE '%' || search_query || '%')
    AND EXISTS (
      SELECT 1 FROM photos p2
      WHERE p2.user_id = u.id 
      AND p2.is_public = true
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION search_public_photos_with_profile TO authenticated;