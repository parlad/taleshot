/*
  # Complete database rebuild
  
  1. Changes
    - Drop all existing tables and recreate them
    - Add is_public column to photos
    - Set up all necessary policies
    - Create search function
*/

-- Drop existing tables and dependencies
DROP TABLE IF EXISTS photo_categories CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  UNIQUE(name, user_id)
);

-- Create photos table with is_public column
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  date_taken text NOT NULL,
  reason text NOT NULL,
  image_url text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create photo_categories junction table
CREATE TABLE photo_categories (
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, category_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Users can view all categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for photos
CREATE POLICY "Users can view own photos"
  ON photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public photos"
  ON photos FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can insert own photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for photo_categories
CREATE POLICY "Users can view their photo categories"
  ON photo_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their photo categories"
  ON photo_categories FOR ALL
  TO authenticated
  USING (true);

-- Create search function
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