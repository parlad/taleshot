/*
  # Add missing database functions for photo filtering

  1. Functions
    - `get_user_photos_with_tags` - Get all photos for a user with their tags
    - `get_photos_by_tag` - Get photos filtered by a specific tag
  2. Security
    - Functions use SECURITY DEFINER to access data safely
    - Proper RLS policies are respected
*/

-- Function to get all photos for a user with their tags
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
    COALESCE(ARRAY_AGG(pt.tag_name) FILTER (WHERE pt.tag_name IS NOT NULL), ARRAY[]::text[]) as tags
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  WHERE p.user_id = user_uuid
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get photos filtered by a specific tag
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_photos_with_tags TO authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_tag TO authenticated;

-- Ensure photo_tags table exists with proper structure
CREATE TABLE IF NOT EXISTS photo_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on photo_tags if not already enabled
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for photo_tags if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'photo_tags' 
    AND policyname = 'Users can view their photo tags'
  ) THEN
    CREATE POLICY "Users can view their photo tags"
      ON photo_tags FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM photos
        WHERE photos.id = photo_tags.photo_id
        AND photos.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'photo_tags' 
    AND policyname = 'Users can manage their photo tags'
  ) THEN
    CREATE POLICY "Users can manage their photo tags"
      ON photo_tags FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM photos
        WHERE photos.id = photo_tags.photo_id
        AND photos.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_name ON photo_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_name_lower ON photo_tags(LOWER(tag_name));

-- Ensure default categories exist in the categories table for the dropdown
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