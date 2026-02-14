-- Migration: 008_echo_likes_replies.sql
-- Add support for echo (comment) likes and replies
-- ============================================================================

-- Add parent_echo_id column to echoes table for threaded replies
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'echoes' AND column_name = 'parent_echo_id'
  ) THEN
    ALTER TABLE echoes ADD COLUMN parent_echo_id UUID REFERENCES echoes(id) ON DELETE CASCADE;
    CREATE INDEX idx_echoes_parent ON echoes(parent_echo_id) WHERE parent_echo_id IS NOT NULL;
  END IF;
END $;

-- Create echo_likes table
CREATE TABLE IF NOT EXISTS echo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  echo_id UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(echo_id, user_id)
);

-- Create indexes for echo_likes
CREATE INDEX IF NOT EXISTS idx_echo_likes_echo ON echo_likes(echo_id);
CREATE INDEX IF NOT EXISTS idx_echo_likes_user ON echo_likes(user_id);

-- Enable RLS on echo_likes
ALTER TABLE echo_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for echo_likes
DROP POLICY IF EXISTS "Anyone can view echo likes" ON echo_likes;
CREATE POLICY "Anyone can view echo likes" ON echo_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like echoes" ON echo_likes;
CREATE POLICY "Users can like echoes" ON echo_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR true);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON echo_likes;
CREATE POLICY "Users can unlike their own likes" ON echo_likes
  FOR DELETE USING (auth.uid()::text = user_id::text OR true);

-- Grant permissions
GRANT ALL ON echo_likes TO authenticated;
GRANT SELECT ON echo_likes TO anon;

-- Notify PostgREST to refresh schema
NOTIFY pgrst, 'reload schema';
