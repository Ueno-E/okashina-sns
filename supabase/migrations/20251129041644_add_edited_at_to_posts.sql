/*
  # Add edited_at column to posts table

  1. Changes
    - Add `edited_at` column to `posts` table to track when a post was last edited
    - This column is nullable (NULL means the post has never been edited)
  
  2. Notes
    - When a post is edited, this timestamp will be updated
    - The UI will display "(編集済)" when this field is not null
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN edited_at timestamptz;
  END IF;
END $$;
