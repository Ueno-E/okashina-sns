/*
  # postsテーブルとprofilesテーブルの外部キーを追加

  ## 変更内容
  
  postsテーブルのuser_idカラムにprofilesテーブルへの外部キー制約を追加します。
  これにより、Supabaseがpostsとprofilesの間のリレーションシップを認識し、
  JOINクエリが正しく動作するようになります。

  ## 注意事項
  
  - 既存のauth.usersへの外部キーは維持
  - profilesテーブルへの外部キーを追加（カスケード削除付き）
*/

-- postsテーブルのuser_idにprofilesテーブルへの外部キーを追加
DO $$ 
BEGIN
  -- 既存の外部キー制約を削除
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
  END IF;

  -- auth.usersとprofilesの両方を参照する外部キーを追加
  -- まずauth.usersへの外部キー
  ALTER TABLE posts 
    ADD CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

  -- profilesへの外部キーを追加（これによりSupabaseがリレーションシップを認識）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_profiles_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts 
      ADD CONSTRAINT posts_user_id_profiles_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$;
