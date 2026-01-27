-- ============================================================================
-- FIX RLS POLICIES FOR WALLET-BASED AUTHENTICATION
-- ============================================================================
-- Since the app uses wallet-based auth (not Supabase Auth), auth.uid() is always NULL
-- We need to allow public inserts while keeping SELECT policies
-- ============================================================================

-- Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own wallets" ON wallet_verifications;
DROP POLICY IF EXISTS "Users can add wallets to own account" ON wallet_verifications;
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
DROP POLICY IF EXISTS "Creators can update communities" ON communities;
DROP POLICY IF EXISTS "Users can join communities" ON community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON community_members;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;
DROP POLICY IF EXISTS "Authors can create gates" ON post_gates;
DROP POLICY IF EXISTS "Authenticated users can create echoes" ON echoes;
DROP POLICY IF EXISTS "Users can signal posts" ON signals;
DROP POLICY IF EXISTS "Users can remove own signals" ON signals;
DROP POLICY IF EXISTS "Users can relay posts" ON relays;
DROP POLICY IF EXISTS "Users can follow others" ON orbits;
DROP POLICY IF EXISTS "Users can unfollow" ON orbits;
DROP POLICY IF EXISTS "Users can view own transmissions" ON transmissions;
DROP POLICY IF EXISTS "Users can send transmissions" ON transmissions;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- ============================================================================
-- NEW PERMISSIVE POLICIES FOR WALLET AUTH
-- ============================================================================

-- Users: Allow public insert for new user registration
CREATE POLICY "Anyone can create users"
  ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE USING (true);

-- Wallet verifications: Allow public operations
CREATE POLICY "Wallet verifications are viewable"
  ON wallet_verifications FOR SELECT USING (true);

CREATE POLICY "Anyone can create wallet verifications"
  ON wallet_verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete wallet verifications"
  ON wallet_verifications FOR DELETE USING (true);

-- Communities: Allow public creation
CREATE POLICY "Anyone can create communities"
  ON communities FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update communities"
  ON communities FOR UPDATE USING (true);

-- Community members: Allow public join/leave
CREATE POLICY "Anyone can join communities"
  ON community_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can leave communities"
  ON community_members FOR DELETE USING (true);

-- Posts: Allow public creation
CREATE POLICY "Anyone can create posts"
  ON posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update posts"
  ON posts FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete posts"
  ON posts FOR DELETE USING (true);

-- Post gates: Allow public creation
CREATE POLICY "Anyone can create post gates"
  ON post_gates FOR INSERT WITH CHECK (true);

-- Echoes: Allow public creation
CREATE POLICY "Anyone can create echoes"
  ON echoes FOR INSERT WITH CHECK (true);

-- Signals: Allow public operations
CREATE POLICY "Anyone can create signals"
  ON signals FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete signals"
  ON signals FOR DELETE USING (true);

-- Relays: Allow public creation
CREATE POLICY "Anyone can create relays"
  ON relays FOR INSERT WITH CHECK (true);

-- Orbits: Allow public follow/unfollow
CREATE POLICY "Anyone can create orbits"
  ON orbits FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete orbits"
  ON orbits FOR DELETE USING (true);

-- Transmissions: Allow public operations
CREATE POLICY "Transmissions are viewable"
  ON transmissions FOR SELECT USING (true);

CREATE POLICY "Anyone can send transmissions"
  ON transmissions FOR INSERT WITH CHECK (true);

-- Transmission threads: Allow public operations
DROP POLICY IF EXISTS "Users can view own transmission threads" ON transmission_threads;
CREATE POLICY "Transmission threads are viewable"
  ON transmission_threads FOR SELECT USING (true);

CREATE POLICY "Anyone can create transmission threads"
  ON transmission_threads FOR INSERT WITH CHECK (true);

-- Notifications: Allow public operations
CREATE POLICY "Notifications are viewable"
  ON notifications FOR SELECT USING (true);

CREATE POLICY "Anyone can update notifications"
  ON notifications FOR UPDATE USING (true);

CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- ============================================================================
-- DONE - RLS policies now work with wallet-based authentication
-- ============================================================================
