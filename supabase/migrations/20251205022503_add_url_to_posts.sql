/*
  # Add URL field to posts table

  1. Changes
    - Add `url` column to `posts` table (optional text field)
    - This column will store URLs related to the snack/candy being posted
    - URLs must start with http:// or https://
  
  2. Notes
    - The column is nullable (optional)
    - URL validation will be enforced at the application level
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'url'
  ) THEN
    ALTER TABLE posts ADD COLUMN url text;
  END IF;
END $$;