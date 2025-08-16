/*
  # Add upload_type column to photos table

  1. New Columns
    - `upload_type` (text) - Either 'individual' or 'group' to differentiate upload types

  2. Changes
    - Add upload_type column to photos table with default 'individual'
    - Create index for better performance when querying by upload_type
    - Update existing photos to have proper upload_type based on batch_id

  3. Security
    - Maintain existing RLS policies
    - upload_type doesn't affect security model
*/

-- Add upload_type column to photos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'upload_type'
  ) THEN
    ALTER TABLE photos ADD COLUMN upload_type text DEFAULT 'individual';
  END IF;
END $$;

-- Create index for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'photos' AND indexname = 'idx_photos_upload_type'
  ) THEN
    CREATE INDEX idx_photos_upload_type ON photos(upload_type);
  END IF;
END $$;

-- Update existing photos to have proper upload_type based on batch_id
UPDATE photos 
SET upload_type = CASE 
  WHEN batch_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM photos p2 
    WHERE p2.batch_id = photos.batch_id 
    AND p2.id != photos.id
  ) THEN 'group'
  ELSE 'individual'
END
WHERE upload_type = 'individual';

-- Update the get_user_photos_with_tags function to include upload_type
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
  upload_type text,
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
    p.upload_type,
    COALESCE(
      ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL),
      '{}'::text[]
    ) as tags
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  WHERE p.user_id = user_uuid
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at, p.batch_id, p.upload_type
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_photos_with_tags TO authenticated;