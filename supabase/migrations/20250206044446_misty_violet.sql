/*
  # Add update policy for photos table

  1. Changes
    - Add RLS policy to allow users to update their own photos
*/

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);