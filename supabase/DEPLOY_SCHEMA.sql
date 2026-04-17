-- ============================================================================
-- INNERCIRCLE — CONSOLIDATED DEPLOYMENT SCHEMA (IDEMPOTENT)
-- ============================================================================
-- Generated: April 2026
-- Safe to re-run on existing databases — all statements guarded with
-- IF NOT EXISTS / CREATE OR REPLACE / DROP … IF EXISTS
-- Includes: All tables, functions, triggers, indexes, RLS policies
-- Replaces: FULL_SCHEMA_CLONE.sql + migrations 001-009
--
-- INSTRUCTIONS:
-- 1. Go to SQL Editor in your Supabase project dashboard
-- 2. Paste and execute this entire file (safe to run multiple times)
-- 3. Update .env with your SUPABASE_URL and SUPABASE_ANON_KEY
-- 4. Enable Realtime on: posts, community_messages, notifications
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CORE TABLES — USERS & IDENTITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  primary_wallet_address TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL DEFAULT 'solana' CHECK (chain = 'solana'),
  wallet_address TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, wallet_address)
);

-- Orbits: Follow relationships (satellite_id follows center_id)
CREATE TABLE IF NOT EXISTS orbits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  satellite_id UUID REFERENCES users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(satellite_id, center_id)
);

-- Migrate legacy column name: planet_id -> center_id (safe no-op if already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orbits' AND column_name = 'planet_id'
  ) THEN
    ALTER TABLE orbits RENAME COLUMN planet_id TO center_id;
  END IF;
END $$;

-- ============================================================================
-- 2. COMMUNITIES — TOKEN-GATED GROUPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id),
  token_address TEXT,
  chain TEXT DEFAULT 'solana',
  access_type TEXT DEFAULT 'open' CHECK (access_type IN ('open', 'token_gated', 'invite_only')),
  min_token_amount NUMERIC DEFAULT 0,
  min_hold_duration_days INTEGER DEFAULT 0,
  banner_url TEXT,
  avatar_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_balance NUMERIC DEFAULT 0,
  tier TEXT CHECK (tier IS NULL OR tier IN ('holder', 'whale', 'elite')),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  gate_type TEXT NOT NULL CHECK (gate_type IN ('token_ownership', 'hold_duration', 'nft_ownership', 'invite')),
  token_address TEXT,
  chain TEXT DEFAULT 'solana',
  min_amount NUMERIC,
  min_hold_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id),
  invite_code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  uses INTEGER DEFAULT 0,
  invitee_wallet TEXT,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. CONTENT — POSTS & GATING
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
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

CREATE TABLE IF NOT EXISTS post_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('token_ownership', 'minimum_balance', 'holder_tier', 'combined')),
  token_address TEXT,
  chain TEXT DEFAULT 'solana',
  minimum_balance NUMERIC,
  required_tier TEXT,
  custom_logic JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Echoes (comments with threading)
CREATE TABLE IF NOT EXISTS echoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_echo_id UUID REFERENCES echoes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  signal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Echo likes
CREATE TABLE IF NOT EXISTS echo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  echo_id UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(echo_id, user_id)
);

-- ============================================================================
-- 4. INTERACTIONS — ENGAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS relays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  quote_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================================================
-- 5. TRANSMISSIONS — DIRECT MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS transmission_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS transmissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES transmission_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. COMMUNITY CHAT
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES community_chat_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. LEADERBOARDS & METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'community')),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('holdings', 'trading', 'engagement')),
  score NUMERIC NOT NULL,
  rank INTEGER,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana',
  price_usd NUMERIC,
  holder_count INTEGER,
  volume_24h NUMERIC,
  market_cap NUMERIC,
  buy_pressure NUMERIC,
  sell_pressure NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
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

-- ============================================================================
-- 9. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wallet_verifications_wallet ON wallet_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_primary_wallet ON users(primary_wallet_address);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_echoes_post ON echoes(post_id);
CREATE INDEX IF NOT EXISTS idx_echoes_parent ON echoes(parent_echo_id) WHERE parent_echo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_echo_likes_echo ON echo_likes(echo_id);
CREATE INDEX IF NOT EXISTS idx_echo_likes_user ON echo_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_orbits_satellite ON orbits(satellite_id);
DROP INDEX IF EXISTS idx_orbits_planet;
CREATE INDEX IF NOT EXISTS idx_orbits_center ON orbits(center_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_gates_community ON community_gates(community_id);
CREATE INDEX IF NOT EXISTS idx_community_invites_code ON community_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_community_invites_community ON community_invites(community_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_thread ON community_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_chat_threads_community ON community_chat_threads(community_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(scope, metric_type, period, rank);
CREATE INDEX IF NOT EXISTS idx_token_metrics_address ON token_metrics(token_address, chain, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read, created_at DESC);

-- Unique partial index for leaderboard (handles nullable community_id)
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_unique_idx ON leaderboard_entries (
  user_id,
  COALESCE(community_id, '00000000-0000-0000-0000-000000000000'::uuid),
  scope, metric_type, period
);

-- ============================================================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_echoes_updated_at ON echoes;
CREATE TRIGGER update_echoes_updated_at
  BEFORE UPDATE ON echoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_signal_count()
RETURNS TRIGGER AS $$
BEGIN UPDATE posts SET signal_count = signal_count + 1 WHERE id = NEW.post_id; RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_signal_count()
RETURNS TRIGGER AS $$
BEGIN UPDATE posts SET signal_count = signal_count - 1 WHERE id = OLD.post_id; RETURN OLD; END;
$$ LANGUAGE plpgsql;

-- Drop legacy trigger names from older migrations (prevents double-counting)
DROP TRIGGER IF EXISTS trigger_increment_signal ON signals;
DROP TRIGGER IF EXISTS trigger_decrement_signal ON signals;
DROP TRIGGER IF EXISTS trigger_increment_echo ON echoes;
DROP TRIGGER IF EXISTS trigger_increment_relay ON relays;

DROP TRIGGER IF EXISTS increment_post_signals ON signals;
CREATE TRIGGER increment_post_signals
  AFTER INSERT ON signals FOR EACH ROW EXECUTE FUNCTION increment_signal_count();

DROP TRIGGER IF EXISTS decrement_post_signals ON signals;
CREATE TRIGGER decrement_post_signals
  AFTER DELETE ON signals FOR EACH ROW EXECUTE FUNCTION decrement_signal_count();

CREATE OR REPLACE FUNCTION create_community_chat_thread()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO community_chat_threads (community_id) VALUES (NEW.id)
  ON CONFLICT (community_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_community_created ON communities;
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities FOR EACH ROW EXECUTE FUNCTION create_community_chat_thread();

-- Auto-create chat threads for any existing communities missing them
INSERT INTO community_chat_threads (community_id)
SELECT id FROM communities
WHERE id NOT IN (
  SELECT community_id FROM community_chat_threads WHERE community_id IS NOT NULL
)
ON CONFLICT (community_id) DO NOTHING;

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID, p_type TEXT, p_title TEXT, p_message TEXT,
  p_link TEXT DEFAULT NULL, p_actor_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, actor_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_actor_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_on_signal() RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'signal', 'New Signal',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' signaled your post',
    '/feed', NEW.user_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_signal ON signals;
CREATE TRIGGER trigger_notify_signal
  AFTER INSERT ON signals FOR EACH ROW EXECUTE FUNCTION notify_on_signal();

CREATE OR REPLACE FUNCTION notify_on_echo() RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'echo', 'New Echo',
    (SELECT username FROM users WHERE id = NEW.author_id) || ' echoed your post',
    '/feed', NEW.author_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_echo ON echoes;
CREATE TRIGGER trigger_notify_echo
  AFTER INSERT ON echoes FOR EACH ROW EXECUTE FUNCTION notify_on_echo();

CREATE OR REPLACE FUNCTION notify_on_relay() RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    (SELECT author_id FROM posts WHERE id = NEW.post_id),
    'relay', 'New Relay',
    (SELECT username FROM users WHERE id = NEW.user_id) || ' relayed your post',
    '/feed', NEW.user_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_relay ON relays;
CREATE TRIGGER trigger_notify_relay
  AFTER INSERT ON relays FOR EACH ROW EXECUTE FUNCTION notify_on_relay();

CREATE OR REPLACE FUNCTION notify_on_follow() RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.center_id, 'follow', 'New Follower',
    (SELECT username FROM users WHERE id = NEW.satellite_id) || ' started following you',
    '/profile/' || (SELECT username FROM users WHERE id = NEW.satellite_id),
    NEW.satellite_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_follow ON orbits;
CREATE TRIGGER trigger_notify_follow
  AFTER INSERT ON orbits FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ============================================================================
-- 11. MULTI-WALLET RPC FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_user_by_wallet(
  p_wallet_address TEXT, p_username TEXT DEFAULT NULL
) RETURNS TABLE(user_id UUID, username TEXT, is_new_user BOOLEAN) AS $$
DECLARE v_user_id UUID; v_username TEXT; v_is_new BOOLEAN := FALSE;
BEGIN
  SELECT wv.user_id, u.username INTO v_user_id, v_username
  FROM wallet_verifications wv JOIN users u ON u.id = wv.user_id
  WHERE wv.wallet_address = p_wallet_address LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RETURN QUERY SELECT v_user_id, v_username, FALSE; RETURN;
  END IF;

  IF p_username IS NULL THEN
    v_username := 'user_' || substring(p_wallet_address from 1 for 8);
    WHILE EXISTS (SELECT 1 FROM users WHERE users.username = v_username) LOOP
      v_username := 'user_' || substring(p_wallet_address from 1 for 8) || '_' || floor(random() * 1000)::text;
    END LOOP;
  ELSE v_username := p_username; END IF;

  INSERT INTO users (wallet_address, username, primary_wallet_address, onboarding_completed)
  VALUES (p_wallet_address, v_username, p_wallet_address, FALSE) RETURNING id INTO v_user_id;

  INSERT INTO wallet_verifications (user_id, chain, wallet_address, is_primary)
  VALUES (v_user_id, 'solana', p_wallet_address, TRUE);

  v_is_new := TRUE;
  RETURN QUERY SELECT v_user_id, v_username, v_is_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION link_wallet_to_account(p_user_id UUID, p_wallet_address TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, wallet_count INTEGER) AS $$
DECLARE v_count INTEGER; v_existing UUID;
BEGIN
  SELECT user_id INTO v_existing FROM wallet_verifications WHERE wallet_address = p_wallet_address LIMIT 1;
  IF v_existing IS NOT NULL THEN
    IF v_existing = p_user_id THEN RETURN QUERY SELECT FALSE, 'Wallet already linked to this account'::TEXT, 0;
    ELSE RETURN QUERY SELECT FALSE, 'Wallet already linked to another account'::TEXT, 0; END IF; RETURN;
  END IF;
  SELECT COUNT(*) INTO v_count FROM wallet_verifications WHERE user_id = p_user_id;
  IF v_count >= 3 THEN RETURN QUERY SELECT FALSE, 'Maximum of 3 wallets per account'::TEXT, v_count; RETURN; END IF;
  INSERT INTO wallet_verifications (user_id, chain, wallet_address, is_primary) VALUES (p_user_id, 'solana', p_wallet_address, FALSE);
  RETURN QUERY SELECT TRUE, 'Wallet linked successfully'::TEXT, v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION unlink_wallet_from_account(p_user_id UUID, p_wallet_address TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE v_is_primary BOOLEAN; v_count INTEGER;
BEGIN
  SELECT is_primary INTO v_is_primary FROM wallet_verifications WHERE user_id = p_user_id AND wallet_address = p_wallet_address;
  IF v_is_primary THEN RETURN QUERY SELECT FALSE, 'Cannot unlink primary wallet'::TEXT; RETURN; END IF;
  SELECT COUNT(*) INTO v_count FROM wallet_verifications WHERE user_id = p_user_id;
  IF v_count <= 1 THEN RETURN QUERY SELECT FALSE, 'Cannot unlink last wallet'::TEXT; RETURN; END IF;
  DELETE FROM wallet_verifications WHERE user_id = p_user_id AND wallet_address = p_wallet_address;
  RETURN QUERY SELECT TRUE, 'Wallet unlinked successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. LEADERBOARD RPC (single query, no N+1)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_engagement_leaderboard(
  p_period_start TIMESTAMPTZ, p_limit INT DEFAULT 100
) RETURNS TABLE (
  user_id UUID, username TEXT, display_name TEXT, avatar_url TEXT, wallet_address TEXT,
  post_count BIGINT, signal_count BIGINT, echo_count BIGINT, relay_count BIGINT,
  engagement_score BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT
    u.id, u.username, u.display_name, u.avatar_url, u.wallet_address,
    COUNT(DISTINCT p.id), COUNT(DISTINCT s.id), COUNT(DISTINCT e.id), COUNT(DISTINCT r.id),
    (COUNT(DISTINCT p.id)*10 + COUNT(DISTINCT s.id)*5 + COUNT(DISTINCT e.id)*3 + COUNT(DISTINCT r.id)*2)
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id AND p.created_at >= p_period_start
  LEFT JOIN signals s ON s.user_id = u.id AND s.created_at >= p_period_start
  LEFT JOIN echoes e ON e.author_id = u.id AND e.created_at >= p_period_start
  LEFT JOIN relays r ON r.user_id = u.id AND r.created_at >= p_period_start
  GROUP BY u.id ORDER BY 10 DESC LIMIT p_limit;
$$;

-- ============================================================================
-- 13. ROW LEVEL SECURITY — ENABLE ON ALL TABLES
-- ============================================================================
-- auth.uid() is always NULL with wallet-based auth.
-- All mutations go through server-side route handlers.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orbits ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE relays ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmission_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. RLS POLICIES — DROP THEN RECREATE (idempotent)
-- ============================================================================

-- ----- SELECT policies -----
DROP POLICY IF EXISTS "open_select" ON users;
DROP POLICY IF EXISTS "open_select" ON wallet_verifications;
DROP POLICY IF EXISTS "open_select" ON orbits;
DROP POLICY IF EXISTS "open_select" ON communities;
DROP POLICY IF EXISTS "open_select" ON community_members;
DROP POLICY IF EXISTS "open_select" ON community_gates;
DROP POLICY IF EXISTS "open_select" ON community_invites;
DROP POLICY IF EXISTS "open_select" ON posts;
DROP POLICY IF EXISTS "open_select" ON post_gates;
DROP POLICY IF EXISTS "open_select" ON echoes;
DROP POLICY IF EXISTS "open_select" ON echo_likes;
DROP POLICY IF EXISTS "open_select" ON signals;
DROP POLICY IF EXISTS "open_select" ON relays;
DROP POLICY IF EXISTS "open_select" ON transmission_threads;
DROP POLICY IF EXISTS "open_select" ON transmissions;
DROP POLICY IF EXISTS "open_select" ON community_chat_threads;
DROP POLICY IF EXISTS "open_select" ON community_messages;
DROP POLICY IF EXISTS "open_select" ON leaderboard_entries;
DROP POLICY IF EXISTS "open_select" ON token_metrics;
DROP POLICY IF EXISTS "open_select" ON notifications;

CREATE POLICY "open_select" ON users FOR SELECT USING (true);
CREATE POLICY "open_select" ON wallet_verifications FOR SELECT USING (true);
CREATE POLICY "open_select" ON orbits FOR SELECT USING (true);
CREATE POLICY "open_select" ON communities FOR SELECT USING (true);
CREATE POLICY "open_select" ON community_members FOR SELECT USING (true);
CREATE POLICY "open_select" ON community_gates FOR SELECT USING (true);
CREATE POLICY "open_select" ON community_invites FOR SELECT USING (true);
CREATE POLICY "open_select" ON posts FOR SELECT USING (true);
CREATE POLICY "open_select" ON post_gates FOR SELECT USING (true);
CREATE POLICY "open_select" ON echoes FOR SELECT USING (true);
CREATE POLICY "open_select" ON echo_likes FOR SELECT USING (true);
CREATE POLICY "open_select" ON signals FOR SELECT USING (true);
CREATE POLICY "open_select" ON relays FOR SELECT USING (true);
CREATE POLICY "open_select" ON transmission_threads FOR SELECT USING (true);
CREATE POLICY "open_select" ON transmissions FOR SELECT USING (true);
CREATE POLICY "open_select" ON community_chat_threads FOR SELECT USING (true);
CREATE POLICY "open_select" ON community_messages FOR SELECT USING (true);
CREATE POLICY "open_select" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "open_select" ON token_metrics FOR SELECT USING (true);
CREATE POLICY "open_select" ON notifications FOR SELECT USING (true);

-- ----- INSERT policies -----
DROP POLICY IF EXISTS "open_insert" ON users;
DROP POLICY IF EXISTS "open_insert" ON wallet_verifications;
DROP POLICY IF EXISTS "open_insert" ON orbits;
DROP POLICY IF EXISTS "open_insert" ON communities;
DROP POLICY IF EXISTS "open_insert" ON community_members;
DROP POLICY IF EXISTS "open_insert" ON community_gates;
DROP POLICY IF EXISTS "open_insert" ON community_invites;
DROP POLICY IF EXISTS "open_insert" ON posts;
DROP POLICY IF EXISTS "open_insert" ON post_gates;
DROP POLICY IF EXISTS "open_insert" ON echoes;
DROP POLICY IF EXISTS "open_insert" ON echo_likes;
DROP POLICY IF EXISTS "open_insert" ON signals;
DROP POLICY IF EXISTS "open_insert" ON relays;
DROP POLICY IF EXISTS "open_insert" ON transmission_threads;
DROP POLICY IF EXISTS "open_insert" ON transmissions;
DROP POLICY IF EXISTS "open_insert" ON community_chat_threads;
DROP POLICY IF EXISTS "open_insert" ON community_messages;
DROP POLICY IF EXISTS "open_insert" ON leaderboard_entries;
DROP POLICY IF EXISTS "open_insert" ON token_metrics;
DROP POLICY IF EXISTS "open_insert" ON notifications;

CREATE POLICY "open_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON wallet_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON orbits FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON communities FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON community_gates FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON community_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON post_gates FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON echoes FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON echo_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON signals FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON relays FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON transmission_threads FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON transmissions FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON community_chat_threads FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON community_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON leaderboard_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON token_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "open_insert" ON notifications FOR INSERT WITH CHECK (true);

-- ----- UPDATE policies -----
DROP POLICY IF EXISTS "open_update" ON users;
DROP POLICY IF EXISTS "open_update" ON communities;
DROP POLICY IF EXISTS "open_update" ON community_members;
DROP POLICY IF EXISTS "open_update" ON community_invites;
DROP POLICY IF EXISTS "open_update" ON posts;
DROP POLICY IF EXISTS "open_update" ON echoes;
DROP POLICY IF EXISTS "open_update" ON community_messages;
DROP POLICY IF EXISTS "open_update" ON notifications;
DROP POLICY IF EXISTS "open_update" ON leaderboard_entries;

CREATE POLICY "open_update" ON users FOR UPDATE USING (true);
CREATE POLICY "open_update" ON communities FOR UPDATE USING (true);
CREATE POLICY "open_update" ON community_members FOR UPDATE USING (true);
CREATE POLICY "open_update" ON community_invites FOR UPDATE USING (true);
CREATE POLICY "open_update" ON posts FOR UPDATE USING (true);
CREATE POLICY "open_update" ON echoes FOR UPDATE USING (true);
CREATE POLICY "open_update" ON community_messages FOR UPDATE USING (true);
CREATE POLICY "open_update" ON notifications FOR UPDATE USING (true);
CREATE POLICY "open_update" ON leaderboard_entries FOR UPDATE USING (true);

-- ----- DELETE policies -----
DROP POLICY IF EXISTS "open_delete" ON wallet_verifications;
DROP POLICY IF EXISTS "open_delete" ON orbits;
DROP POLICY IF EXISTS "open_delete" ON community_members;
DROP POLICY IF EXISTS "open_delete" ON posts;
DROP POLICY IF EXISTS "open_delete" ON echoes;
DROP POLICY IF EXISTS "open_delete" ON echo_likes;
DROP POLICY IF EXISTS "open_delete" ON signals;
DROP POLICY IF EXISTS "open_delete" ON relays;
DROP POLICY IF EXISTS "open_delete" ON community_messages;

CREATE POLICY "open_delete" ON wallet_verifications FOR DELETE USING (true);
CREATE POLICY "open_delete" ON orbits FOR DELETE USING (true);
CREATE POLICY "open_delete" ON community_members FOR DELETE USING (true);
CREATE POLICY "open_delete" ON posts FOR DELETE USING (true);
CREATE POLICY "open_delete" ON echoes FOR DELETE USING (true);
CREATE POLICY "open_delete" ON echo_likes FOR DELETE USING (true);
CREATE POLICY "open_delete" ON signals FOR DELETE USING (true);
CREATE POLICY "open_delete" ON relays FOR DELETE USING (true);
CREATE POLICY "open_delete" ON community_messages FOR DELETE USING (true);

-- ============================================================================
-- 15. GRANTS
-- ============================================================================

GRANT ALL ON echo_likes TO authenticated;
GRANT SELECT ON echo_likes TO anon;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DONE — Post-deploy checklist:
-- ============================================================================
-- 1. Enable Realtime (run in SQL Editor):
--    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
--    ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
--    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- 2. Update .env:
--    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
--    BAGS_API_KEY=your-bags-key (server-only, never NEXT_PUBLIC_)
--    NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
-- ============================================================================
