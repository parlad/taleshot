-- Drop existing functions
DROP FUNCTION IF EXISTS search_public_photos_with_profile(text);
DROP FUNCTION IF EXISTS get_user_email(uuid);

-- Create improved get_user_email function with better error handling
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS TABLE (
  email text,
  found boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  IF user_email IS NOT NULL THEN
    RETURN QUERY SELECT user_email::text, true;
  ELSE
    RETURN QUERY SELECT NULL::text, false;
  END IF;
END;
$$;

-- Create improved search function with better profile handling and error cases
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
SET search_path = public, auth
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
  SELECT DISTINCT
    u.id as user_id,
    u.email::text as user_email,
    p.first_name,
    p.last_name,
    COALESCE(up.photo_count, 0) as photo_count,
    COALESCE(up.sample_photos, '[]'::jsonb) as sample_photos
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  INNER JOIN photos ph ON u.id = ph.user_id AND ph.is_public = true
  LEFT JOIN user_photos up ON u.id = up.user_id
  WHERE (
    u.email ILIKE '%' || search_query || '%'
    OR COALESCE(p.first_name, '') ILIKE '%' || search_query || '%'
    OR COALESCE(p.last_name, '') ILIKE '%' || search_query || '%'
  )
  GROUP BY u.id, u.email, p.first_name, p.last_name, up.photo_count, up.sample_photos;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION search_public_photos_with_profile TO authenticated;

-- Ensure RLS policies are properly set
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_public ON photos(is_public);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);