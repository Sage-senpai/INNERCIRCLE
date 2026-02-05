-- File: supabase/migrations/006_community_gating.sql
-- ============================================================================
-- COMMUNITY GATING: Support for open, token-gated, and invite-only communities
-- This migration is defensive - it handles cases where columns may or may not exist
-- ============================================================================

-- ============================================================================
-- ADD COLUMNS TO COMMUNITIES TABLE (if they don't exist)
-- ============================================================================

-- Add token_address column (optional, for token-gated communities)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'token_address'
  ) THEN
    ALTER TABLE communities ADD COLUMN token_address TEXT;
  END IF;
END $$;

-- Add chain column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'chain'
  ) THEN
    ALTER TABLE communities ADD COLUMN chain TEXT DEFAULT 'solana';
  END IF;
END $$;

-- Add access_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE communities ADD COLUMN access_type TEXT DEFAULT 'open';
  END IF;
END $$;

-- Add check constraint for access_type (drop if exists first to avoid conflicts)
DO $$
BEGIN
  ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_access_type_check;
  ALTER TABLE communities ADD CONSTRAINT communities_access_type_check
    CHECK (access_type IN ('open', 'token_gated', 'invite_only'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add min_token_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'min_token_amount'
  ) THEN
    ALTER TABLE communities ADD COLUMN min_token_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add min_hold_duration_days column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'communities' AND column_name = 'min_hold_duration_days'
  ) THEN
    ALTER TABLE communities ADD COLUMN min_hold_duration_days INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update existing communities with token_address to be token_gated
UPDATE communities
SET access_type = 'token_gated'
WHERE token_address IS NOT NULL AND (access_type IS NULL OR access_type = 'open');

-- Set default access_type for communities without one
UPDATE communities
SET access_type = 'open'
WHERE access_type IS NULL;

-- ============================================================================
-- ADD COLUMNS TO COMMUNITY_MEMBERS TABLE (if they don't exist)
-- ============================================================================

-- Add token_balance column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_members' AND column_name = 'token_balance'
  ) THEN
    ALTER TABLE community_members ADD COLUMN token_balance NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add tier column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_members' AND column_name = 'tier'
  ) THEN
    ALTER TABLE community_members ADD COLUMN tier TEXT;
  END IF;
END $$;

-- Add role column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE community_members ADD COLUMN role TEXT DEFAULT 'member';
  END IF;
END $$;

-- Add check constraint for role
DO $$
BEGIN
  ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_role_check;
  ALTER TABLE community_members ADD CONSTRAINT community_members_role_check
    CHECK (role IN ('member', 'moderator', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add check constraint for tier
DO $$
BEGIN
  ALTER TABLE community_members DROP CONSTRAINT IF EXISTS community_members_tier_check;
  ALTER TABLE community_members ADD CONSTRAINT community_members_tier_check
    CHECK (tier IS NULL OR tier IN ('holder', 'whale', 'elite'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- COMMUNITY GATES TABLE: Multiple gating rules per community
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_community_gates_community
  ON community_gates(community_id);

-- ============================================================================
-- COMMUNITY INVITES TABLE: For invite-only communities
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_community_invites_code
  ON community_invites(invite_code);

CREATE INDEX IF NOT EXISTS idx_community_invites_community
  ON community_invites(community_id);

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE community_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Anyone can view community gates" ON community_gates;
DROP POLICY IF EXISTS "Community creators can manage gates" ON community_gates;
DROP POLICY IF EXISTS "Community members can view invites" ON community_invites;
DROP POLICY IF EXISTS "Community creators and members can create invites" ON community_invites;
DROP POLICY IF EXISTS "Anyone can use an invite" ON community_invites;

-- Community gates: Anyone can view gates, only community admins can modify
CREATE POLICY "Anyone can view community gates"
  ON community_gates FOR SELECT
  USING (true);

CREATE POLICY "Community creators can manage gates"
  ON community_gates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_gates.community_id
      AND communities.creator_id = auth.uid()
    )
  );

-- Community invites: Invites viewable by community members
CREATE POLICY "Community members can view invites"
  ON community_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_invites.community_id
      AND communities.creator_id = auth.uid()
    )
  );

CREATE POLICY "Community creators and members can create invites"
  ON community_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_invites.community_id
      AND communities.creator_id = auth.uid()
    )
  );

-- Allow updating invite usage
CREATE POLICY "Anyone can use an invite"
  ON community_invites FOR UPDATE
  USING (true)
  WITH CHECK (true);
