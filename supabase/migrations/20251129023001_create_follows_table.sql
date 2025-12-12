/*
  # フォロー機能のテーブル作成

  ## 新規テーブル

  ### follows
  ユーザー間のフォロー関係
  - `follower_id` (uuid, foreign key) - フォローする人
  - `following_id` (uuid, foreign key) - フォローされる人
  - `created_at` (timestamptz) - フォロー日時
  - Primary key: (follower_id, following_id)

  ## セキュリティ

  - RLSを有効化
  - 全員がフォロー関係を閲覧可
  - 自分のフォローのみ作成・削除可
*/

CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
