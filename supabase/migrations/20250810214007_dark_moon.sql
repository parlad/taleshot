/*
  # Fix category filtering system completely
  
  1. New Tables
    - Create a simplified photo_tags table for better performance
  2. Functions
    - Add function to get photos by category
  3. Data Migration
    - Migrate existing data to new structure
  4. Indexes
    - Add proper indexes for fast filtering
*/

-- Create a simplified photo_tags table for better performance
CREATE TABLE IF NOT EXISTS photo_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for photo_tags
CREATE POLICY "Users can view their photo tags"
  ON photo_tags FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photos
    WHERE photos.id = photo_tags.photo_id
    AND photos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their photo tags"
  ON photo_tags FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photos
    WHERE photos.id = photo_tags.photo_id
    AND photos.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_name ON photo_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_photos_user_id_public ON photos(user_id, is_public);

-- Function to get photos with their tags
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
    COALESCE(ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL), ARRAY[]::text[]) as tags
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
    COALESCE(ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL), ARRAY[]::text[]) as tags
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  WHERE p.user_id = user_uuid
    AND EXISTS (
      SELECT 1 FROM photo_tags pt2 
      WHERE pt2.photo_id = p.id 
      AND LOWER(pt2.tag_name) = LOWER(tag_name)
    )
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_photos_with_tags TO authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_tag TO authenticated;

-- Migrate existing data from photo_categories to photo_tags
INSERT INTO photo_tags (photo_id, tag_name)
SELECT DISTINCT pc.photo_id, c.name
FROM photo_categories pc
JOIN categories c ON pc.category_id = c.id
ON CONFLICT DO NOTHING;

-- Ensure we have some default categories available
INSERT INTO categories (name, user_id) VALUES
  ('Family', NULL),
  ('Vacation', NULL),
  ('Celebration', NULL),
  ('Nature', NULL),
  ('Food', NULL),
  ('Pets', NULL),
  ('Travel', NULL),
  ('Japan', NULL),
  ('Village', NULL)
ON CONFLICT (name, user_id) DO NOTHING;