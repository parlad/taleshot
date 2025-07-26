/*
  # Fix profile creation trigger

  1. Changes
    - Drop and recreate trigger with proper error handling
    - Add default timestamp for updated_at
    - Ensure trigger handles race conditions
*/

-- Add default timestamp to updated_at
ALTER TABLE profiles 
ALTER COLUMN updated_at SET DEFAULT now();

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, updated_at)
  VALUES (new.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language plpgsql security definer;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert profiles for existing users if they don't have one
INSERT INTO profiles (id, updated_at)
SELECT id, now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;