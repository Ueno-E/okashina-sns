/*
  # Create avatars storage bucket

  1. Storage Bucket
    - Create `avatars` bucket for user profile pictures
    - Enable public access for avatar images
  
  2. Security Policies
    - Authenticated users can upload their own avatars
    - Authenticated users can update their own avatars
    - Authenticated users can delete their own avatars
    - All users can view avatar images
  
  3. Notes
    - Avatar file names follow pattern: {user_id}-{timestamp}.jpg
    - This ensures users can only manage their own avatar files
*/

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DO $$
BEGIN
  -- Authenticated users can upload avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = ''::text AND
      auth.uid()::text = split_part(name, '-', 1)
    );
  END IF;

  -- Authenticated users can update their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      auth.uid()::text = split_part(name, '-', 1)
    );
  END IF;

  -- Authenticated users can delete their own avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete their own avatar'
  ) THEN
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      auth.uid()::text = split_part(name, '-', 1)
    );
  END IF;

  -- All users can view avatars
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Anyone can view avatars'
  ) THEN
    CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;
