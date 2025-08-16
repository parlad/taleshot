/*
  # Restructure photo-tags system

  1. Changes
    - Drop categories and photo_categories tables
    - Add tags column to photos table as text array
    - Create photo_tags junction table for many-to-many relationship
    - Create functions for querying photos with tags

  2. Security
    - Enable RLS on photo_tags table
    - Add policies for authenticated users
*/

-- Drop existing tables
DROP TABLE IF EXISTS photo_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Add tags column to photos table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'tags'
  ) THEN
    ALTER TABLE photos ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create photo_tags junction table
CREATE TABLE IF NOT EXISTS photo_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, tag_name)
);

-- Enable RLS
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for photo_tags
CREATE POLICY "Users can read own photo tags"
  ON photo_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos 
      WHERE photos.id = photo_tags.photo_id 
      AND photos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own photo tags"
  ON photo_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photos 
      WHERE photos.id = photo_tags.photo_id 
      AND photos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photo tags"
  ON photo_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos 
      WHERE photos.id = photo_tags.photo_id 
      AND photos.user_id = auth.uid()
    )
  );

-- Function to get photos with their tags from junction table
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
    COALESCE(
      ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL),
      '{}'::text[]
    ) as tags
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  WHERE p.user_id = user_uuid
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get photos by specific tag
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
    COALESCE(
      ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL),
      '{}'::text[]
    ) as tags
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  WHERE p.user_id = user_uuid
    AND EXISTS (
      SELECT 1 FROM photo_tags pt2
      WHERE pt2.photo_id = p.id AND pt2.tag_name = tag_name
    )
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_photos_with_tags TO authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_tag TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_name ON photo_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING GIN (tags);