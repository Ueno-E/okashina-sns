/*
  # 管理者機能の追加

  ## 変更内容
  
  1. profilesテーブルに管理者フラグを追加
    - `is_admin` (boolean) - 管理者権限フラグ（デフォルト: false）
  
  2. postsテーブルの削除ポリシーを更新
    - 既存: ユーザーは自分の投稿のみ削除可能
    - 新規: 管理者は全ての投稿を削除可能
  
  ## セキュリティ
  
  - is_adminフラグは通常のユーザーが変更できないように保護
  - 管理者のみが全ての投稿を削除可能
*/

-- profilesテーブルにis_adminカラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- profilesテーブルのUPDATEポリシーを削除して再作成
-- 管理者フラグは変更できないようにする
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- postsテーブルの削除ポリシーを削除して再作成
-- 管理者も削除できるようにする
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- インデックス作成（管理者チェックのパフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
