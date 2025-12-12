/*
  # Update reactions to 2 types

  1. Changes
    - Delete existing reactions data
    - Update reactions table to have only 2 reaction types:
      - おいしそう (Looks delicious)
      - いってみたい (Want to try)
    - Remove いいね (Like) reaction type
  
  2. Notes
    - This will delete all existing post_reactions data to ensure consistency
    - Users will need to re-react to posts with the new reaction types
*/

-- Delete all existing post reactions
DELETE FROM post_reactions;

-- Delete all existing reactions
DELETE FROM reactions;

-- Insert the new 2 reaction types
INSERT INTO reactions (name, emoji, sort_order) VALUES
  ('おいしそう', '😋', 1),
  ('いってみたい', '🎯', 2);
