-- Migration: 009_leaderboard_rpc.sql
-- Add RPC function for efficient leaderboard aggregation (replaces N+1 queries)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_engagement_leaderboard(
  p_period_start TIMESTAMPTZ,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  wallet_address TEXT,
  post_count BIGINT,
  signal_count BIGINT,
  echo_count BIGINT,
  relay_count BIGINT,
  engagement_score BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    u.id AS user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.wallet_address,
    COUNT(DISTINCT p.id) AS post_count,
    COUNT(DISTINCT s.id) AS signal_count,
    COUNT(DISTINCT e.id) AS echo_count,
    COUNT(DISTINCT r.id) AS relay_count,
    (COUNT(DISTINCT p.id) * 10 +
     COUNT(DISTINCT s.id) * 5 +
     COUNT(DISTINCT e.id) * 3 +
     COUNT(DISTINCT r.id) * 2) AS engagement_score
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id AND p.created_at >= p_period_start
  LEFT JOIN signals s ON s.user_id = u.id AND s.created_at >= p_period_start
  LEFT JOIN echoes e ON e.author_id = u.id AND e.created_at >= p_period_start
  LEFT JOIN relays r ON r.user_id = u.id AND r.created_at >= p_period_start
  GROUP BY u.id, u.username, u.display_name, u.avatar_url, u.wallet_address
  ORDER BY engagement_score DESC
  LIMIT p_limit;
$$;
