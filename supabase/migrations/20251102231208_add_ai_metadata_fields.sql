/*
  # Add AI Metadata Fields to Photos Table

  ## Description
  Adds fields to store AI-generated metadata for enhanced search capabilities

  ## New Columns
  - `ai_description` (text): AI-generated description of the photo content
  - `ai_tags` (text[]): AI-extracted tags from image analysis
  - `color_palette` (text[]): Dominant colors in the image (hex codes)
  - `color_tone` (text): Primary color tone category (e.g., 'blue', 'warm', 'cool', 'neutral')
  - `ai_analyzed` (boolean): Flag to track if photo has been analyzed
  - `ai_analyzed_at` (timestamptz): Timestamp of AI analysis

  ## Purpose
  These fields enable:
  - Natural language search ("mountains in Japan")
  - Color-based filtering
  - Advanced image discovery
  - Semantic search capabilities
*/

DO $$
BEGIN
  -- Add ai_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'ai_description'
  ) THEN
    ALTER TABLE photos ADD COLUMN ai_description text;
  END IF;

  -- Add ai_tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'ai_tags'
  ) THEN
    ALTER TABLE photos ADD COLUMN ai_tags text[] DEFAULT '{}';
  END IF;

  -- Add color_palette column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'color_palette'
  ) THEN
    ALTER TABLE photos ADD COLUMN color_palette text[] DEFAULT '{}';
  END IF;

  -- Add color_tone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'color_tone'
  ) THEN
    ALTER TABLE photos ADD COLUMN color_tone text;
  END IF;

  -- Add ai_analyzed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'ai_analyzed'
  ) THEN
    ALTER TABLE photos ADD COLUMN ai_analyzed boolean DEFAULT false;
  END IF;

  -- Add ai_analyzed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'ai_analyzed_at'
  ) THEN
    ALTER TABLE photos ADD COLUMN ai_analyzed_at timestamptz;
  END IF;
END $$;

-- Create index for faster color tone searches
CREATE INDEX IF NOT EXISTS idx_photos_color_tone ON photos(color_tone);

-- Create index for AI tag searches
CREATE INDEX IF NOT EXISTS idx_photos_ai_tags ON photos USING GIN(ai_tags);

-- Create index for AI description full-text search
CREATE INDEX IF NOT EXISTS idx_photos_ai_description_search ON photos USING GIN(to_tsvector('english', COALESCE(ai_description, '')));
