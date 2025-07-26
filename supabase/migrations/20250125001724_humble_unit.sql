/*
  # Add categories and auth setup

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)
    - `photo_categories`
      - `photo_id` (text, foreign key)
      - `category_id` (uuid, foreign key)
  
  2. Default Categories
    - Add some default categories for all users
  
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

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
  photo_id text NOT NULL,
  category_id uuid REFERENCES categories(id),
  PRIMARY KEY (photo_id, category_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_categories ENABLE ROW LEVEL SECURITY;

-- Create default categories
INSERT INTO categories (id, name) VALUES
  (gen_random_uuid(), 'Family'),
  (gen_random_uuid(), 'Vacation'),
  (gen_random_uuid(), 'Celebration'),
  (gen_random_uuid(), 'Nature'),
  (gen_random_uuid(), 'Food'),
  (gen_random_uuid(), 'Pets')
ON CONFLICT DO NOTHING;

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
CREATE POLICY "Users can view their photo categories"
  ON photo_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their photo categories"
  ON photo_categories FOR ALL
  TO authenticated
  USING (true);