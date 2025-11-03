/*
  # Enhance Albums/Collections with Rich Metadata
  
  ## Description
  Adds comprehensive metadata fields to collections table for full album functionality
  
  ## New Columns Added
  - `cover_photo_id` (uuid): Manual or AI-selected cover photo
  - `auto_cover` (boolean): Whether to automatically select best cover photo
  - `date_range_start` (date): Album start date
  - `date_range_end` (date): Album end date
  - `location` (text): Location/place name for the album
  - `collaborators` (text[]): Array of email addresses of collaborators
  - `photo_count` (integer): Cached count of photos in album
  - `view_count` (integer): Number of times album has been viewed
  - `last_viewed_at` (timestamptz): Last time album was accessed
  
  ## Purpose
  Enables rich album features:
  - Dynamic cover photo selection
  - Date range tracking
  - Location tagging
  - Collaboration support
  - Analytics tracking
*/

DO $$
BEGIN
  -- Add cover_photo_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'cover_photo_id'
  ) THEN
    ALTER TABLE collections ADD COLUMN cover_photo_id uuid;
  END IF;

  -- Add auto_cover column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'auto_cover'
  ) THEN
    ALTER TABLE collections ADD COLUMN auto_cover boolean DEFAULT true;
  END IF;

  -- Add date_range_start column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'date_range_start'
  ) THEN
    ALTER TABLE collections ADD COLUMN date_range_start date;
  END IF;

  -- Add date_range_end column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'date_range_end'
  ) THEN
    ALTER TABLE collections ADD COLUMN date_range_end date;
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'location'
  ) THEN
    ALTER TABLE collections ADD COLUMN location text;
  END IF;

  -- Add collaborators column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'collaborators'
  ) THEN
    ALTER TABLE collections ADD COLUMN collaborators text[] DEFAULT '{}';
  END IF;

  -- Add photo_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'photo_count'
  ) THEN
    ALTER TABLE collections ADD COLUMN photo_count integer DEFAULT 0;
  END IF;

  -- Add view_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE collections ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  -- Add last_viewed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'last_viewed_at'
  ) THEN
    ALTER TABLE collections ADD COLUMN last_viewed_at timestamptz;
  END IF;
END $$;

-- Add foreign key constraint for cover_photo_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'collections_cover_photo_id_fkey'
  ) THEN
    ALTER TABLE collections
    ADD CONSTRAINT collections_cover_photo_id_fkey
    FOREIGN KEY (cover_photo_id)
    REFERENCES photos(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_cover_photo ON collections(cover_photo_id);
CREATE INDEX IF NOT EXISTS idx_collections_location ON collections(location);
CREATE INDEX IF NOT EXISTS idx_collections_date_range ON collections(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_collection_photos_order ON collection_photos(collection_id, order_index);

-- Create function to update photo_count automatically
CREATE OR REPLACE FUNCTION update_collection_photo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections
    SET photo_count = photo_count + 1
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET photo_count = GREATEST(0, photo_count - 1)
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating photo count
DROP TRIGGER IF EXISTS trigger_update_collection_photo_count ON collection_photos;
CREATE TRIGGER trigger_update_collection_photo_count
AFTER INSERT OR DELETE ON collection_photos
FOR EACH ROW
EXECUTE FUNCTION update_collection_photo_count();

-- Update existing collections with current photo counts
UPDATE collections
SET photo_count = (
  SELECT COUNT(*)
  FROM collection_photos
  WHERE collection_photos.collection_id = collections.id
)
WHERE photo_count = 0;
