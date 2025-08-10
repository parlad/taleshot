/*
  # Fix category filtering system
  
  1. Changes
    - Ensure proper indexes exist for efficient filtering
    - Add debugging function to check category associations
    - Verify data integrity
*/

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id_created_at ON photos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_categories_photo_id ON photo_categories(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_categories_category_id ON photo_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Create a debugging function to check photo categories
CREATE OR REPLACE FUNCTION debug_photo_categories(user_uuid uuid)
RETURNS TABLE (
  photo_id uuid,
  photo_title text,
  category_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as photo_id,
    p.title as photo_title,
    c.name as category_name
  FROM photos p
  LEFT JOIN photo_categories pc ON p.id = pc.photo_id
  LEFT JOIN categories c ON pc.category_id = c.id
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC, c.name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_photo_categories TO authenticated;

-- Ensure all photo_categories have valid references
DELETE FROM photo_categories 
WHERE photo_id NOT IN (SELECT id FROM photos)
   OR category_id NOT IN (SELECT id FROM categories);