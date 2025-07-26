/*
  # Add public photos feature
  
  1. Changes
    - Add is_public column to photos table
    - Add public photos view policy
    - Add user search functionality
*/

-- Add is_public column to photos table
ALTER TABLE photos 
ADD COLUMN is_public boolean DEFAULT false;

-- Add policy for public access to public photos
CREATE POLICY "Anyone can view public photos"
  ON photos FOR SELECT
  TO public
  USING (is_public = true);

-- Create a function to search users and their public photos
CREATE OR REPLACE FUNCTION search_public_photos(search_query text)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  photo_count bigint,
  sample_photos jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email as user_email,
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
      SELECT 1 FROM photos 
      WHERE user_id = u.id AND is_public = true
    )
  GROUP BY u.id, u.email;
END;
$$;