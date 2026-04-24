-- Add media_type column to posts table
-- Run this in your Supabase SQL Editor

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN posts.media_type IS 'Type of media attached: image, video, or null for text-only posts';
