/*
  # Add UUID default to photos table

  1. Changes
    - Add DEFAULT gen_random_uuid() to the id column of photos table
    - This ensures every new photo gets a UUID automatically
*/

DO $$ 
BEGIN
  -- Add default UUID generator to id column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'photos' 
      AND column_name = 'id' 
      AND column_default = 'gen_random_uuid()'
  ) THEN
    ALTER TABLE photos 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;