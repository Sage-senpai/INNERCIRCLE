-- ============================================================================
-- INNERCIRCLE - COMPLETE DATABASE SCHEMA WITH MULTI-WALLET SUPPORT
-- ============================================================================
-- This is a standalone, production-ready schema for a fresh Supabase instance
-- Includes all tables, RLS policies, triggers, functions, and multi-wallet system
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  primary_wallet_address TEXT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet verifications (multi-wallet support)
CREATE TABLE wallet_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain = 'solana'),
  wallet_address TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community members
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  signal_count INTEGER DEFAULT 0,
  echo_count INTEGER DEFAULT 0,
  relay_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post gates (token gating)
CREATE TABLE post_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  min_amount NUMERIC NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain = 'solana'),
  gate_type TEXT NOT NULL CHECK (gate_type IN ('view', 'interact', 'full')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Echoes (comments/replies)
CREATE TABLE echoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals (likes)
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Relays (retweets/shares)
CREATE TABLE relays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Orbits (follows)
CREATE TABLE orbits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  center_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  satellite_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(center_id, satellite_id),
  CHECK (center_id != satellite_id)
);

-- Transmission threads (DM conversations)
CREATE TABLE transmission_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2),
  CHECK (participant_1 < participant_2)
);

-- Transmissions (DM messages)
CREATE TABLE transmissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES transmission_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('signal', 'echo', 'relay', 'follow', 'mention', 'community_join')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_primary_wallet ON users(primary_wallet_address);
CREATE INDEX idx_wallet_verifications_user ON wallet_verifications(user_id);
CREATE INDEX idx_wallet_verifications_wallet ON wallet_verifications(wallet_address);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_echoes_post ON echoes(post_id);
CREATE INDEX idx_signals_post ON signals(post_id);
CREATE INDEX idx_signals_user ON signals(user_id);
CREATE INDEX idx_relays_post ON relays(post_id);
CREATE INDEX idx_orbits_center ON orbits(center_id);
CREATE INDEX idx_orbits_satellite ON orbits(satellite_id);
CREATE INDEX idx_transmissions_thread ON transmissions(thread_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE relays ENABLE ROW LEVEL SECURITY;
ALTER TABLE orbits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmission_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Wallet verifications policies
CREATE POLICY "Users can view own wallets"
  ON wallet_verifications FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can add wallets to own account"
  ON wallet_verifications FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Communities policies
CREATE POLICY "Communities are viewable"
  ON communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update communities"
  ON communities FOR UPDATE USING (auth.uid()::text = creator_id::text);

-- Community members policies
CREATE POLICY "Community members are viewable"
  ON community_members FOR SELECT USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE USING (auth.uid()::text = user_id::text);

-- Posts policies
CREATE POLICY "Posts are viewable"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE USING (auth.uid()::text = author_id::text);

-- Post gates policies
CREATE POLICY "Post gates are viewable"
  ON post_gates FOR SELECT USING (true);

CREATE POLICY "Authors can create gates"
  ON post_gates FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_gates.post_id
      AND posts.author_id::text = auth.uid()::text
    )
  );

-- Echoes policies
CREATE POLICY "Echoes are viewable"
  ON echoes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create echoes"
  ON echoes FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

-- Signals policies
CREATE POLICY "Signals are viewable"
  ON signals FOR SELECT USING (true);

CREATE POLICY "Users can signal posts"
  ON signals FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove own signals"
  ON signals FOR DELETE USING (auth.uid()::text = user_id::text);

-- Relays policies
CREATE POLICY "Relays are viewable"
  ON relays FOR SELECT USING (true);

CREATE POLICY "Users can relay posts"
  ON relays FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Orbits policies
CREATE POLICY "Orbits are viewable"
  ON orbits FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON orbits FOR INSERT WITH CHECK (auth.uid()::text = satellite_id::text);

CREATE POLICY "Users can unfollow"
  ON orbits FOR DELETE USING (auth.uid()::text = satellite_id::text);

-- Transmissions policies
CREATE POLICY "Users can view own transmissions"
  ON transmissions FOR SELECT USING (
    sender_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM transmission_threads tt
      WHERE tt.id = transmissions.thread_id
      AND (tt.participant_1::text = auth.uid()::text OR tt.participant_2::text = auth.uid()::text)
    )
  );

CREATE POLICY "Users can send transmissions"
  ON transmissions FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment signal count
CREATE OR REPLACE FUNCTION increment_signal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET signal_count = signal_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_signal AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION increment_signal_count();

-- Decrement signal count
CREATE OR REPLACE FUNCTION decrement_signal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET signal_count = signal_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_signal AFTER DELETE ON signals
  FOR EACH ROW EXECUTE FUNCTION decrement_signal_count();

-- Increment echo count
CREATE OR REPLACE FUNCTION increment_echo_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET echo_count = echo_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_echo AFTER INSERT ON echoes
  FOR EACH ROW EXECUTE FUNCTION increment_echo_count();

-- Increment relay count
CREATE OR REPLACE FUNCTION increment_relay_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET relay_count = relay_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_relay AFTER INSERT ON relays
  FOR EACH ROW EXECUTE FUNCTION increment_relay_count();

-- Notification triggers
CREATE OR REPLACE FUNCTION notify_on_signal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id)
  SELECT
    posts.author_id,
    'signal',
    'New Signal',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' signaled your post',
    '/post/' || NEW.post_id,
    NEW.user_id
  FROM posts
  WHERE posts.id = NEW.post_id
  AND posts.author_id != NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_signal AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION notify_on_signal();

CREATE OR REPLACE FUNCTION notify_on_echo()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id)
  SELECT
    posts.author_id,
    'echo',
    'New Echo',
    (SELECT username FROM users WHERE id = NEW.author_id) || ' echoed on your post',
    '/post/' || NEW.post_id,
    NEW.author_id
  FROM posts
  WHERE posts.id = NEW.post_id
  AND posts.author_id != NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_echo AFTER INSERT ON echoes
  FOR EACH ROW EXECUTE FUNCTION notify_on_echo();

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id)
  VALUES (
    NEW.center_id,
    'follow',
    'New Follower',
    (SELECT username FROM users WHERE id = NEW.satellite_id) || ' started following you',
    '/profile/' || (SELECT username FROM users WHERE id = NEW.satellite_id),
    NEW.satellite_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_follow AFTER INSERT ON orbits
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ============================================================================
-- MULTI-WALLET ACCOUNT SYSTEM FUNCTIONS
-- ============================================================================

-- Get or create user by wallet (with fixed ambiguous column reference)
CREATE OR REPLACE FUNCTION get_or_create_user_by_wallet(
  p_wallet_address TEXT,
  p_username TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  is_new_user BOOLEAN
) AS $$
DECLARE
  v_user_id UUID;
  v_username TEXT;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Check if wallet is already verified for any user
  SELECT wv.user_id, u.username INTO v_user_id, v_username
  FROM wallet_verifications wv
  JOIN users u ON u.id = wv.user_id
  WHERE wv.wallet_address = p_wallet_address
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Wallet already linked to an account
    RETURN QUERY SELECT v_user_id AS user_id, v_username AS username, FALSE AS is_new_user;
    RETURN;
  END IF;

  -- Wallet not linked, create new user or generate username
  IF p_username IS NULL THEN
    -- Generate username from wallet (first 8 chars)
    v_username := 'user_' || substring(p_wallet_address from 1 for 8);

    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM users WHERE users.username = v_username) LOOP
      v_username := 'user_' || substring(p_wallet_address from 1 for 8) || '_' || floor(random() * 1000)::text;
    END LOOP;
  ELSE
    v_username := p_username;
  END IF;

  -- Create new user
  INSERT INTO users (wallet_address, username, primary_wallet_address, onboarding_completed)
  VALUES (p_wallet_address, v_username, p_wallet_address, FALSE)
  RETURNING id INTO v_user_id;

  -- Create primary wallet verification
  INSERT INTO wallet_verifications (user_id, chain, wallet_address, is_primary)
  VALUES (v_user_id, 'solana', p_wallet_address, TRUE);

  v_is_new := TRUE;

  RETURN QUERY SELECT v_user_id AS user_id, v_username AS username, v_is_new AS is_new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link additional wallet to account
CREATE OR REPLACE FUNCTION link_wallet_to_account(
  p_user_id UUID,
  p_wallet_address TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  wallet_count INTEGER
) AS $$
DECLARE
  v_current_count INTEGER;
  v_existing_user_id UUID;
BEGIN
  -- Check if wallet is already linked to another account
  SELECT user_id INTO v_existing_user_id
  FROM wallet_verifications
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    IF v_existing_user_id = p_user_id THEN
      RETURN QUERY SELECT FALSE, 'Wallet already linked to this account'::TEXT, 0::INTEGER;
    ELSE
      RETURN QUERY SELECT FALSE, 'Wallet already linked to another account'::TEXT, 0::INTEGER;
    END IF;
    RETURN;
  END IF;

  -- Check current wallet count
  SELECT COUNT(*) INTO v_current_count
  FROM wallet_verifications
  WHERE user_id = p_user_id;

  IF v_current_count >= 3 THEN
    RETURN QUERY SELECT FALSE, 'Maximum of 3 wallets per account'::TEXT, v_current_count;
    RETURN;
  END IF;

  -- Link wallet
  INSERT INTO wallet_verifications (user_id, chain, wallet_address, is_primary)
  VALUES (p_user_id, 'solana', p_wallet_address, FALSE);

  v_current_count := v_current_count + 1;

  RETURN QUERY SELECT TRUE, 'Wallet linked successfully'::TEXT, v_current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unlink wallet from account
CREATE OR REPLACE FUNCTION unlink_wallet_from_account(
  p_user_id UUID,
  p_wallet_address TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_is_primary BOOLEAN;
  v_wallet_count INTEGER;
BEGIN
  -- Check if this is the primary wallet
  SELECT is_primary INTO v_is_primary
  FROM wallet_verifications
  WHERE user_id = p_user_id AND wallet_address = p_wallet_address;

  IF v_is_primary THEN
    RETURN QUERY SELECT FALSE, 'Cannot unlink primary wallet'::TEXT;
    RETURN;
  END IF;

  -- Check wallet count
  SELECT COUNT(*) INTO v_wallet_count
  FROM wallet_verifications
  WHERE user_id = p_user_id;

  IF v_wallet_count <= 1 THEN
    RETURN QUERY SELECT FALSE, 'Cannot unlink last wallet'::TEXT;
    RETURN;
  END IF;

  -- Unlink wallet
  DELETE FROM wallet_verifications
  WHERE user_id = p_user_id AND wallet_address = p_wallet_address;

  RETURN QUERY SELECT TRUE, 'Wallet unlinked successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
--
-- Next steps after running this script:
--
-- 1. Verify all tables were created:
--    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- 2. Check RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- 3. Update your .env file:
--    NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
--
-- 4. Test authentication with multi-wallet support
--
-- ============================================================================
