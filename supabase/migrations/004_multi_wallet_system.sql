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
