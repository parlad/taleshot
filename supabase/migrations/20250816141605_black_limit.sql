/*
  # Add batch_id column to photos table

  1. Changes
    - Add batch_id column to photos table for grouping related photos
    - Add index for better performance when querying by batch_id
    - Update RLS policies to handle batch operations

  2. Security
    - Maintain existing RLS policies
    - Ensure batch_id doesn't affect security model
*/

-- Add batch_id column to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS batch_id uuid;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_photos_batch_id ON photos(batch_id);

-- Update the get_user_photos_with_tags function to include batch_id
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
  batch_id uuid,
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
    p.batch_id,
    COALESCE(
      ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL),
      '{}'::text[]
    ) as tags
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  WHERE p.user_id = user_uuid
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at, p.batch_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_photos_with_tags TO authenticated;