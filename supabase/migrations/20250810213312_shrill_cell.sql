/*
  # Debug and fix category system
  
  1. Check existing data
  2. Ensure proper relationships
  3. Add debugging function
*/

-- Check current categories
SELECT 'Current categories:' as info;
SELECT id, name, user_id FROM categories ORDER BY name;

-- Check photo-category relationships
SELECT 'Photo-category relationships:' as info;
SELECT 
  p.title as photo_title,
  c.name as category_name,
  pc.photo_id,
  pc.category_id
FROM photos p
JOIN photo_categories pc ON p.id = pc.photo_id
JOIN categories c ON pc.category_id = c.id
ORDER BY p.title, c.name;

-- Create a function to get photos with their categories for debugging
CREATE OR REPLACE FUNCTION get_photos_with_categories(user_uuid uuid)
RETURNS TABLE (
  photo_id uuid,
  photo_title text,
  category_names text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as photo_id,
    p.title as photo_title,
    ARRAY_AGG(c.name) FILTER (WHERE c.name IS NOT NULL) as category_names
  FROM photos p
  LEFT JOIN photo_categories pc ON p.id = pc.photo_id
  LEFT JOIN categories c ON pc.category_id = c.id
  WHERE p.user_id = user_uuid
  GROUP BY p.id, p.title
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_photos_with_categories TO authenticated;

-- Ensure all default categories exist
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