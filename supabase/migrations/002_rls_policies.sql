-- File: supabase/migrations/002_rls_policies.sql

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;

-- Users: public read, own write
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Posts: public posts viewable, gated posts require check
CREATE POLICY "Public posts are viewable"
  ON posts FOR SELECT USING (
    visibility = 'public' OR 
    author_id::text = auth.uid()::text OR
    -- Gated check handled in application layer via Locke
    EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = posts.community_id
      AND cm.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid()::text = author_id::text);

-- Echoes: viewable if parent post is viewable
CREATE POLICY "Echoes viewable with post"
  ON echoes FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = echoes.post_id)
  );

CREATE POLICY "Users can create echoes"
  ON echoes FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

-- Signals
CREATE POLICY "Signals are viewable"
  ON signals FOR SELECT USING (true);

CREATE POLICY "Users can signal posts"
  ON signals FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove own signals"
  ON signals FOR DELETE USING (auth.uid()::text = user_id::text);

-- Communities: viewable by all
CREATE POLICY "Communities are viewable"
  ON communities FOR SELECT USING (true);

CREATE POLICY "Admins can manage communities"
  ON communities FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- Transmissions: only between participants
CREATE POLICY "Users can view own transmissions"
  ON transmissions FOR SELECT USING (
    sender_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM transmission_threads tt
      WHERE tt.id = transmissions.thread_id
      AND (tt.participant_1::text = auth.uid()::text OR tt.participant_2::text = auth.uid()::text)
    )
  );