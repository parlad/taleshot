/*
  # Fix UUID migration
  
  1. Changes
    - Drop and recreate photo_categories table with UUID references
    - Update policies for the new table
*/

-- Drop existing photo_categories table and its policies
DROP TABLE IF EXISTS photo_categories CASCADE;

-- Create new photo_categories table with UUID references
CREATE TABLE photo_categories (
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (photo_id, category_id)
);

-- Enable RLS
ALTER TABLE photo_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their photo categories"
  ON photo_categories FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photos
    WHERE photos.id = photo_categories.photo_id
    AND photos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their photo categories"
  ON photo_categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM photos
    WHERE photos.id = photo_categories.photo_id
    AND photos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their photo categories"
  ON photo_categories FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM photos
    WHERE photos.id = photo_categories.photo_id
    AND photos.user_id = auth.uid()
  ));