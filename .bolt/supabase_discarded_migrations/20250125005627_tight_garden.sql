/*
  # Create photos and categories tables

  1. New Tables
    - `photos`
      - `id` (text, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `date_taken` (text)
      - `reason` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)

    - `photo_categories` (junction table)
      - `photo_id` (text, references photos)
      - `category_id` (uuid, references categories)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create photos table
CREATE TABLE photos (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  date_taken text NOT NULL,
  reason text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  UNIQUE(name, user_id)
);

-- Create photo_categories junction table
CREATE TABLE photo_categories (
  photo_id text REFERENCES photos(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (photo_id, category_id)
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_categories ENABLE ROW LEVEL SECURITY;

-- Policies for photos
CREATE POLICY "Users can view own photos"
  ON photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for categories
CREATE POLICY "Users can view all categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for photo_categories
CREATE POLICY "Users can view own photo categories"
  ON photo_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_categories.photo_id
      AND photos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own photo categories"
  ON photo_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_categories.photo_id
      AND photos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photo categories"
  ON photo_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_categories.photo_id
      AND photos.user_id = auth.uid()
    )
  );

-- Create default categories
INSERT INTO categories (id, name) VALUES
  (gen_random_uuid(), 'Family'),
  (gen_random_uuid(), 'Vacation'),
  (gen_random_uuid(), 'Celebration'),
  (gen_random_uuid(), 'Nature'),
  (gen_random_uuid(), 'Food'),
  (gen_random_uuid(), 'Pets')
ON CONFLICT DO NOTHING;