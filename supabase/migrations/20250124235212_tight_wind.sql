/*
  # Create photos storage bucket

  1. Storage
    - Create a new storage bucket named 'photos' for storing user uploaded images
  2. Security
    - Enable public access to the bucket
    - Add policy for authenticated users to upload files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);

-- Allow public access to files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');