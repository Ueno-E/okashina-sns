/*
  # リアクションを3つに更新

  ## 変更内容
  
  リアクションを「いいね」「おいしそう」「いってみたい」の3つに制限します。

  ## 注意事項
  
  - 既存のリアクションデータは削除
  - 新しい3つのリアクションを追加
*/

-- 既存のリアクションデータをクリア
DELETE FROM post_reactions;
DELETE FROM reactions;

-- 新しいリアクションを追加
INSERT INTO reactions (name, emoji, sort_order) VALUES
  ('いいね', '👍', 1),
  ('おいしそう', '😋', 2),
  ('いってみたい', '🚗', 3);
