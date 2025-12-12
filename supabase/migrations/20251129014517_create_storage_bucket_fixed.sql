/*
  # ストレージバケット設定

  1. ストレージバケット作成
    - `post-images` バケットを作成
    - 公開アクセス可能に設定

  2. セキュリティポリシー
    - 認証済みユーザーは画像をアップロード可能
    - すべてのユーザーが画像を閲覧可能
*/

-- post-images バケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- ポリシーを安全に作成
DO $$
BEGIN
  -- 認証済みユーザーがアップロード可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload images'
  ) THEN
    CREATE POLICY "Authenticated users can upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'post-images');
  END IF;

  -- 認証済みユーザーが自分の画像を削除可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete their own images'
  ) THEN
    CREATE POLICY "Users can delete their own images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- すべてのユーザーが画像を閲覧可能
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public can view images'
  ) THEN
    CREATE POLICY "Public can view images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'post-images');
  END IF;
END $$;
