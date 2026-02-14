-- File: supabase/migrations/007_community_chat.sql
-- ============================================================================
-- COMMUNITY CHAT: Real-time messaging for community members
-- ============================================================================

-- Community chat threads (one per community)
CREATE TABLE IF NOT EXISTS community_chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community messages
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES community_chat_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_messages_thread
  ON community_messages(thread_id);

CREATE INDEX IF NOT EXISTS idx_community_messages_created
  ON community_messages(thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_chat_threads_community
  ON community_chat_threads(community_id);

-- ============================================================================
-- AUTO-CREATE CHAT THREAD FOR NEW COMMUNITIES
-- Uses SECURITY DEFINER to bypass RLS when creating threads via trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION create_community_chat_thread()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO community_chat_threads (community_id)
  VALUES (NEW.id)
  ON CONFLICT (community_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_community_created ON communities;

-- Create trigger to auto-create chat thread
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION create_community_chat_thread();

-- ============================================================================
-- CREATE CHAT THREADS FOR EXISTING COMMUNITIES
-- ============================================================================

INSERT INTO community_chat_threads (community_id)
SELECT id FROM communities
WHERE id NOT IN (SELECT community_id FROM community_chat_threads WHERE community_id IS NOT NULL)
ON CONFLICT (community_id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE community_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Community members can view chat threads" ON community_chat_threads;
DROP POLICY IF EXISTS "Community creators can create chat threads" ON community_chat_threads;
DROP POLICY IF EXISTS "Community members can view messages" ON community_messages;
DROP POLICY IF EXISTS "Community members can send messages" ON community_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON community_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON community_messages;

-- Chat threads: Viewable by community members and creators
CREATE POLICY "Community members can view chat threads"
  ON community_chat_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_chat_threads.community_id
      AND community_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_chat_threads.community_id
      AND communities.creator_id = auth.uid()
    )
  );

-- Chat threads: Allow community creators to insert (backup for trigger)
CREATE POLICY "Community creators can create chat threads"
  ON community_chat_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_chat_threads.community_id
      AND communities.creator_id = auth.uid()
    )
  );

-- Messages: Viewable by community members
CREATE POLICY "Community members can view messages"
  ON community_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_chat_threads
      JOIN community_members ON community_members.community_id = community_chat_threads.community_id
      WHERE community_chat_threads.id = community_messages.thread_id
      AND community_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM community_chat_threads
      JOIN communities ON communities.id = community_chat_threads.community_id
      WHERE community_chat_threads.id = community_messages.thread_id
      AND communities.creator_id = auth.uid()
    )
  );

-- Messages: Community members can send
CREATE POLICY "Community members can send messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM community_chat_threads
        JOIN community_members ON community_members.community_id = community_chat_threads.community_id
        WHERE community_chat_threads.id = community_messages.thread_id
        AND community_members.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM community_chat_threads
        JOIN communities ON communities.id = community_chat_threads.community_id
        WHERE community_chat_threads.id = community_messages.thread_id
        AND communities.creator_id = auth.uid()
      )
    )
  );

-- Messages: Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON community_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Messages: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON community_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ============================================================================
-- REAL-TIME SUBSCRIPTIONS
-- Enable publication for real-time updates
-- ============================================================================

-- Note: Run these in the Supabase dashboard under Database > Publications
-- ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
