/*
  # Add Advanced Album Features

  1. Schema Changes
    - Add `theme` column to collections (layout theme selection)
    - Add `music_url` column to collections (optional background music)
    - Add `view_count` column to collections (track album views)
    - Add `like_count` column to collections (track likes for public albums)
    - Add `gps_latitude` and `gps_longitude` to photos (for map view)
    - Add `capture_date` to photos (for timeline view - distinct from created_at)
  
  2. Features Enabled
    - Map View: GPS metadata plotting
    - Timeline View: Chronological photo slider
    - Album Themes: Classic Grid, Cinematic Story, Polaroid Stack, Minimal Frame
    - Music Integration: Background track for albums
    - Statistics Panel: View and engagement tracking
    
  3. Notes
    - All new columns are nullable for backward compatibility
    - Theme defaults to 'grid' for existing albums
    - Statistics start at 0 for existing albums
*/

-- Add theme and music support to collections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'theme'
  ) THEN
    ALTER TABLE collections ADD COLUMN theme text DEFAULT 'grid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'music_url'
  ) THEN
    ALTER TABLE collections ADD COLUMN music_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE collections ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collections' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE collections ADD COLUMN like_count integer DEFAULT 0;
  END IF;
END $$;

-- Add GPS and capture date to photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'gps_latitude'
  ) THEN
    ALTER TABLE photos ADD COLUMN gps_latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'gps_longitude'
  ) THEN
    ALTER TABLE photos ADD COLUMN gps_longitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'capture_date'
  ) THEN
    ALTER TABLE photos ADD COLUMN capture_date timestamptz;
  END IF;
END $$;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_album_view_count(album_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE collections
  SET view_count = view_count + 1
  WHERE id = album_id;
END;
$$;

-- Create function to toggle album like
CREATE OR REPLACE FUNCTION toggle_album_like(album_id uuid, user_liked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF user_liked THEN
    UPDATE collections
    SET like_count = like_count + 1
    WHERE id = album_id;
  ELSE
    UPDATE collections
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = album_id;
  END IF;
END;
$$;