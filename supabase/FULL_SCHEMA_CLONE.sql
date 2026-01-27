-- ============================================================================
-- INNERCIRCLE - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete schema for cloning your InnerCircle database
-- to a new Supabase instance. Execute this script in the Supabase SQL Editor.
--
-- INSTRUCTIONS:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor in your new project dashboard
-- 3. Create a new query and paste this entire file
-- 4. Execute the query
-- 5. Update your .env file with the new NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES - USERS & IDENTITY
-- ============================================================================

-- Users table (wallet-based identity)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-chain wallet verification records
CREATE TABLE wallet_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain = 'solana'),
  wallet_address TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, wallet_address)
);

-- Orbits: Follow relationships (satellite_id follows center_id)
CREATE TABLE orbits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  satellite_id UUID REFERENCES users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(satellite_id, center_id)
);

-- ============================================================================
-- COMMUNITIES - TOKEN-GATED GROUPS
-- ============================================================================

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id),
  token_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain = 'solana'),
  banner_url TEXT,
  avatar_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community membership with tiered access (cached from on-chain data)
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_balance NUMERIC NOT NULL,
  tier TEXT CHECK (tier IN ('holder', 'whale', 'elite')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- ============================================================================
-- CONTENT - POSTS & GATING
-- ============================================================================

-- Posts (broadcasts with optional gating)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  is_gated BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'gated', 'community')),
  signal_count INTEGER DEFAULT 0,
  echo_count INTEGER DEFAULT 0,
  relay_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post gates (Locke access control rules)
CREATE TABLE post_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('token_ownership', 'minimum_balance', 'holder_tier', 'combined')),
  token_address TEXT,
  chain TEXT DEFAULT 'solana' CHECK (chain = 'solana'),
  minimum_balance NUMERIC,
  required_tier TEXT,
  custom_logic JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Echoes (comments/replies)
CREATE TABLE echoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  signal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTERACTIONS - ENGAGEMENT
-- ============================================================================

-- Signals (likes/reactions)
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Relays (shares/retweets with optional quote)
CREATE TABLE relays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  quote_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================================================
-- TRANSMISSIONS - DIRECT MESSAGING
-- ============================================================================

-- DM threads between two users
CREATE TABLE transmission_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- Individual messages within threads
CREATE TABLE transmissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES transmission_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEADERBOARDS - COMPETITIVE RANKINGS
-- ============================================================================

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'community')),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('holdings', 'trading', 'engagement')),
  score NUMERIC NOT NULL,
  rank INTEGER,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_id, scope, metric_type, period)
);

-- ============================================================================
-- MARKET INTELLIGENCE - TOKEN METRICS
-- ============================================================================

CREATE TABLE token_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain = 'solana'),
  price_usd NUMERIC,
  holder_count INTEGER,
  volume_24h NUMERIC,
  market_cap NUMERIC,
  buy_pressure NUMERIC,
  sell_pressure NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES - PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Post queries
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Echoes/comments
CREATE INDEX idx_echoes_post ON echoes(post_id);

-- Follow relationships
CREATE INDEX idx_orbits_satellite ON orbits(satellite_id);
CREATE INDEX idx_orbits_center ON orbits(center_id);

-- Community membership
CREATE INDEX idx_community_members_user ON community_members(user_id);

-- Leaderboards
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(scope, metric_type, period, rank);

-- Token metrics
CREATE INDEX idx_token_metrics_address ON token_metrics(token_address, chain, recorded_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_echoes_updated_at BEFORE UPDATE ON echoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: Increment signal count on posts
CREATE OR REPLACE FUNCTION increment_signal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET signal_count = signal_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_post_signals AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION increment_signal_count();

-- Function: Decrement signal count on posts
CREATE OR REPLACE FUNCTION decrement_signal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET signal_count = signal_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_post_signals AFTER DELETE ON signals
  FOR EACH ROW EXECUTE FUNCTION decrement_signal_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - USERS
-- ============================================================================

CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- ============================================================================
-- RLS POLICIES - POSTS
-- ============================================================================

CREATE POLICY "Public posts are viewable"
  ON posts FOR SELECT USING (
    visibility = 'public' OR
    author_id::text = auth.uid()::text OR
    -- Community posts require membership
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

-- ============================================================================
-- RLS POLICIES - ECHOES
-- ============================================================================

CREATE POLICY "Echoes viewable with post"
  ON echoes FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = echoes.post_id)
  );

CREATE POLICY "Users can create echoes"
  ON echoes FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete own echoes"
  ON echoes FOR DELETE USING (auth.uid()::text = author_id::text);

-- ============================================================================
-- RLS POLICIES - SIGNALS
-- ============================================================================

CREATE POLICY "Signals are viewable"
  ON signals FOR SELECT USING (true);

CREATE POLICY "Users can signal posts"
  ON signals FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove own signals"
  ON signals FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- RLS POLICIES - COMMUNITIES
-- ============================================================================

CREATE POLICY "Communities are viewable"
  ON communities FOR SELECT USING (true);

CREATE POLICY "Users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Admins can manage communities"
  ON communities FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
  );

-- ============================================================================
-- RLS POLICIES - COMMUNITY MEMBERS
-- ============================================================================

CREATE POLICY "Community members are viewable"
  ON community_members FOR SELECT USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- RLS POLICIES - TRANSMISSIONS
-- ============================================================================

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

-- ============================================================================
-- ADDITIONAL POLICIES - ORBITS (Follow system)
-- ============================================================================

ALTER TABLE orbits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orbits are viewable"
  ON orbits FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON orbits FOR INSERT WITH CHECK (auth.uid()::text = satellite_id::text);

CREATE POLICY "Users can unfollow"
  ON orbits FOR DELETE USING (auth.uid()::text = satellite_id::text);

-- ============================================================================
-- ADDITIONAL POLICIES - POST GATES
-- ============================================================================

ALTER TABLE post_gates ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- ADDITIONAL POLICIES - RELAYS
-- ============================================================================

ALTER TABLE relays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Relays are viewable"
  ON relays FOR SELECT USING (true);

CREATE POLICY "Users can relay posts"
  ON relays FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove own relays"
  ON relays FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- ADDITIONAL POLICIES - LEADERBOARDS & METRICS (Read-only for users)
-- ============================================================================

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboards are viewable"
  ON leaderboard_entries FOR SELECT USING (true);

CREATE POLICY "Token metrics are viewable"
  ON token_metrics FOR SELECT USING (true);

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('signal', 'echo', 'relay', 'follow', 'mention', 'community_join')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_actor_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Notify on new signal
CREATE OR REPLACE FUNCTION notify_on_signal()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'signal',
    'New Signal',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' signaled your post',
    '/feed',
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_signal AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION notify_on_signal();

-- Trigger: Notify on new echo
CREATE OR REPLACE FUNCTION notify_on_echo()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'echo',
    'New Echo',
    (SELECT username FROM users WHERE id = NEW.author_id) || ' echoed your post',
    '/feed',
    NEW.author_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_echo AFTER INSERT ON echoes
  FOR EACH ROW EXECUTE FUNCTION notify_on_echo();

-- Trigger: Notify on new relay
CREATE OR REPLACE FUNCTION notify_on_relay()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'relay',
    'New Relay',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' relayed your post',
    '/feed',
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_relay AFTER INSERT ON relays
  FOR EACH ROW EXECUTE FUNCTION notify_on_relay();

-- Trigger: Notify on new follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
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
-- MULTI-WALLET ACCOUNT SYSTEM
-- ============================================================================
-- Allow users to link up to 3 wallets to a single account
-- Users can log in with any linked wallet and access the same account

-- Update users table to track primary wallet
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_wallet_address TEXT;

-- Update primary wallet to match wallet_address initially
UPDATE users SET primary_wallet_address = wallet_address WHERE primary_wallet_address IS NULL;

-- Create function to get or create user by wallet
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
  v_existing_verification RECORD;
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

-- Function to link additional wallet to existing account
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

-- Function to unlink wallet from account
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

-- Add index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_wallet_verifications_wallet ON wallet_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_primary_wallet ON users(primary_wallet_address);

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
-- 4. Test authentication and basic operations
--
-- ============================================================================
