/*
  # お菓子なSNS - データベーススキーマ

  ## 新規テーブル

  ### 1. profiles
  ユーザープロフィール情報
  - `id` (uuid, primary key) - auth.usersと紐づくID
  - `username` (text, unique) - ユーザー名
  - `display_name` (text) - 表示名
  - `avatar_url` (text) - プロフィール画像URL
  - `bio` (text) - 自己紹介
  - `created_at` (timestamptz) - 作成日時

  ### 2. posts
  お菓子の投稿
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - 投稿者
  - `image_url` (text, required) - 投稿画像URL
  - `title` (text, required) - タイトル
  - `description` (text) - 説明
  - `region` (text) - 地域（例: 北海道、東京都、京都府）
  - `ai_genre` (text) - AI自動判定ジャンル（チョコレート、クッキー、和菓子など）
  - `created_at` (timestamptz)

  ### 3. tags
  タグマスタ
  - `id` (uuid, primary key)
  - `name` (text, unique) - タグ名
  - `created_at` (timestamptz)

  ### 4. post_tags
  投稿とタグの関連（多対多）
  - `post_id` (uuid, foreign key)
  - `tag_id` (uuid, foreign key)
  - `created_at` (timestamptz)
  - Primary key: (post_id, tag_id)

  ### 5. reactions
  リアクション種類マスタ
  - `id` (uuid, primary key)
  - `name` (text, unique) - リアクション名（いいね、おいしそう、食べたいなど）
  - `emoji` (text) - 表示する絵文字
  - `sort_order` (int) - 表示順

  ### 6. post_reactions
  投稿へのリアクション履歴
  - `post_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `reaction_id` (uuid, foreign key)
  - `created_at` (timestamptz)
  - Primary key: (post_id, user_id, reaction_id)

  ## セキュリティ

  すべてのテーブルでRLSを有効化し、適切なポリシーを設定:
  - profiles: 全員が閲覧可、自分のみ編集可
  - posts: 全員が閲覧可、自分のみ作成・編集・削除可
  - tags: 全員が閲覧可、認証済みユーザーが作成可
  - post_tags: postsのポリシーに従う
  - reactions: 全員が閲覧可（マスタデータ）
  - post_reactions: 全員が閲覧可、自分のリアクションのみ作成・削除可
*/

-- profiles テーブル
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- posts テーブル
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  region text,
  ai_genre text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- tags テーブル
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- post_tags テーブル
CREATE TABLE IF NOT EXISTS post_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post tags are viewable by everyone"
  ON post_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add tags to their own posts"
  ON post_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from their own posts"
  ON post_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

-- reactions テーブル
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  emoji text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  TO authenticated
  USING (true);

-- 初期リアクションデータを挿入
INSERT INTO reactions (name, emoji, sort_order) VALUES
  ('いいね', '👍', 1),
  ('おいしそう', '😋', 2),
  ('食べたい', '🤤', 3),
  ('かわいい', '🥰', 4),
  ('すごい', '✨', 5)
ON CONFLICT (name) DO NOTHING;

-- post_reactions テーブル
CREATE TABLE IF NOT EXISTS post_reactions (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_id uuid NOT NULL REFERENCES reactions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id, reaction_id)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post reactions are viewable by everyone"
  ON post_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON post_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON post_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts(region);
CREATE INDEX IF NOT EXISTS idx_posts_ai_genre ON posts(ai_genre);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
