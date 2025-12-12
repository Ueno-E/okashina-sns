/*
  # Add verified badge column to profiles

  1. Changes
    - Add `is_verified` column to `profiles` table
      - Boolean field to mark verified/official accounts
      - Defaults to false
      - Separate from admin privileges
    
  2. Purpose
    - Allow marking official accounts with verification badge
    - Verified accounts get badge but not admin permissions
    - Admin accounts get both badge and delete permissions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;
