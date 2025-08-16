/*
  # Fix photo-tags relationship structure

  1. Tables
    - Ensure `tags` table exists for tag definitions
    - Ensure `photo_tags` junction table exists for many-to-many relationship
    - Remove `tags` column from `photos` table if it exists

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Create helper functions for querying photos with tags
*/

-- Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create photo_tags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS photo_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, tag_id)
);

-- Remove tags column from photos table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'tags'
  ) THEN
    ALTER TABLE photos DROP COLUMN tags;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for tags
CREATE POLICY "Users can read own tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Function to get photos with their tags
CREATE OR REPLACE FUNCTION get_photos_with_tags(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  date_taken text,
  reason text,
  image_url text,
  is_public boolean,
  created_at timestamptz,
  tag_names text[]
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
      ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL),
      '{}'::text[]
    ) as tag_names
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  WHERE p.user_id = user_uuid
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get photos by tag
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
  tag_names text[]
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
      ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL),
      '{}'::text[]
    ) as tag_names
  FROM photos p
  LEFT JOIN photo_tags pt ON p.id = pt.photo_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  WHERE p.user_id = user_uuid
    AND EXISTS (
      SELECT 1 FROM photo_tags pt2
      JOIN tags t2 ON pt2.tag_id = t2.id
      WHERE pt2.photo_id = p.id AND t2.name = tag_name
    )
  GROUP BY p.id, p.user_id, p.title, p.date_taken, p.reason, p.image_url, p.is_public, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_photos_with_tags TO authenticated;
GRANT EXECUTE ON FUNCTION get_photos_by_tag TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);