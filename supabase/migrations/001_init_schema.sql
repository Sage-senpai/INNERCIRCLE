-- File: supabase/migrations/001_init_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users (identity anchor)
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

-- Wallet verification records
CREATE TABLE wallet_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL CHECK (chain IN ('solana', 'polkadot')),
  wallet_address TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, wallet_address)
);

-- Orbits (relationships)
CREATE TABLE orbits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  satellite_id UUID REFERENCES users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(satellite_id, center_id)
);

-- ============================================================================
-- COMMUNITIES
-- ============================================================================

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id),
  token_address TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('solana', 'polkadot')),
  banner_url TEXT,
  avatar_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community memberships (cached from on-chain)
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
-- CONTENT
-- ============================================================================

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

-- Locke rules attached to posts
CREATE TABLE post_gates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('token_ownership', 'minimum_balance', 'holder_tier', 'combined')),
  token_address TEXT,
  chain TEXT CHECK (chain IN ('solana', 'polkadot')),
  minimum_balance NUMERIC,
  required_tier TEXT,
  custom_logic JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Echoes (comments)
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
-- INTERACTIONS
-- ============================================================================

CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE relays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  quote_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================================================
-- TRANSMISSIONS (DMs)
-- ============================================================================

CREATE TABLE transmission_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1 UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_2 UUID REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE transmissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES transmission_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEADERBOARDS
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
-- MARKET INTELLIGENCE
-- ============================================================================

CREATE TABLE token_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_address TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('solana', 'polkadot')),
  price_usd NUMERIC,
  holder_count INTEGER,
  volume_24h NUMERIC,
  market_cap NUMERIC,
  buy_pressure NUMERIC,
  sell_pressure NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_echoes_post ON echoes(post_id);
CREATE INDEX idx_orbits_satellite ON orbits(satellite_id);
CREATE INDEX idx_orbits_center ON orbits(center_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(scope, metric_type, period, rank);
CREATE INDEX idx_token_metrics_address ON token_metrics(token_address, chain, recorded_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
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

-- Increment/decrement counters
CREATE OR REPLACE FUNCTION increment_signal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET signal_count = signal_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_post_signals AFTER INSERT ON signals
  FOR EACH ROW EXECUTE FUNCTION increment_signal_count();

CREATE OR REPLACE FUNCTION decrement_signal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET signal_count = signal_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_post_signals AFTER DELETE ON signals
  FOR EACH ROW EXECUTE FUNCTION decrement_signal_count();