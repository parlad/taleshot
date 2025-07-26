-- Create a function to safely get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS TABLE (email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT users.email::text
  FROM auth.users
  WHERE users.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;

-- Create a function to search public photos with profile information
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
  SELECT 
    u.id as user_id,
    u.email::text as user_email,
    p.first_name,
    p.last_name,
    COUNT(ph.id) as photo_count,
    jsonb_agg(
      jsonb_build_object(
        'id', ph.id,
        'title', ph.title,
        'image_url', ph.image_url,
        'date_taken', ph.date_taken
      )
    ) FILTER (WHERE ph.id IS NOT NULL) as sample_photos
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  LEFT JOIN photos ph ON u.id = ph.user_id AND ph.is_public = true
  WHERE 
    u.email ILIKE '%' || search_query || '%'
    OR p.first_name ILIKE '%' || search_query || '%'
    OR p.last_name ILIKE '%' || search_query || '%'
    AND EXISTS (
      SELECT 1 FROM photos p2
      WHERE p2.user_id = u.id 
      AND p2.is_public = true
    )
  GROUP BY u.id, u.email, p.first_name, p.last_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_public_photos_with_profile TO authenticated;