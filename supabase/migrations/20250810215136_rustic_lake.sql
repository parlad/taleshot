/*
  # Add tags column to photos table

  1. Changes
    - Add tags column as text array to photos table
    - Update existing functions to use the new tags column
    - Migrate any existing data from photo_tags table
*/

-- Add tags column to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Update the get_user_photos_with_tags function to use the tags column
CREATE OR REPLACE FUNCTION get_user_photos_with_tags(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  date_taken text,
  reason text,
  image_url text,
  is_public boolean,
  created_at timestamptz,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.date_taken,
    p.reason,
    p.image_url,
    p.is_public,
    p.created_at,
    COALESCE(p.tags, '{}') as tags
  FROM photos p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC;
END;
$$;

-- Update the get_photos_by_tag function to use the tags column
CREATE OR REPLACE FUNCTION get_photos_by_tag(user_uuid uuid, tag_name text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  date_taken text,
  reason text,
  image_url text,
  is_public boolean,
  created_at timestamptz,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.title,
    p.date_taken,
    p.reason,
    p.image_url,
    p.is_public,
    p.created_at,
    COALESCE(p.tags, '{}') as tags
  FROM photos p
  WHERE p.user_id = user_uuid
    AND tag_name = ANY(p.tags)
  ORDER BY p.created_at DESC;
END;
$$;

-- Migrate existing data from photo_tags to photos.tags column
UPDATE photos 
SET tags = (
  SELECT ARRAY_AGG(pt.tag_name)
  FROM photo_tags pt
  WHERE pt.photo_id = photos.id
)
WHERE EXISTS (
  SELECT 1 FROM photo_tags pt WHERE pt.photo_id = photos.id
);

-- Create index for better performance on tags column
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN (tags);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_photos_with_tags TO authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_tag TO authenticated;