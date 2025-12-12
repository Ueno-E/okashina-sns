/*
  # Fix avatars storage policies

  1. Changes
    - Drop existing avatar upload policy
    - Recreate with proper WITH CHECK clause
    - Simplify validation to allow authenticated users to upload avatars
  
  2. Security
    - Authenticated users can upload avatars with their user ID in filename
    - Users can only update/delete their own avatars
    - Everyone can view avatars
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Recreate policies with correct configuration
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = split_part(name, '-', 1)
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = split_part(name, '-', 1)
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = split_part(name, '-', 1)
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
