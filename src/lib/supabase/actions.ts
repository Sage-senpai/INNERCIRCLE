// File: src/lib/supabase/actions.ts
// ============================================================================
// Complete Supabase Actions with Bags API Integration
// ============================================================================

import { supabase } from './client';
import { bagsAPI } from '../bags-api/client';
import { Chain } from '../locke/types';

// ============================================================================
// MULTI-WALLET ACCOUNT ACTIONS
// ============================================================================

export async function getOrCreateUserByWallet(walletAddress: string, username?: string) {
  const { data, error } = await supabase.rpc('get_or_create_user_by_wallet', {
    p_wallet_address: walletAddress,
    p_username: username || null,
  });

  if (error) throw error;
  return data[0]; // Returns { user_id, username, is_new_user }
}

export async function getUserWithLinkedWallets(userId: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  const { data: wallets, error: walletsError } = await supabase
    .from('wallet_verifications')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });

  if (walletsError) throw walletsError;

  return {
    ...user,
    linkedWallets: wallets.map((w) => ({
      walletAddress: w.wallet_address,
      chain: w.chain,
      isPrimary: w.is_primary,
      verifiedAt: w.verified_at,
    })),
  };
}

export async function linkWalletToAccount(userId: string, walletAddress: string) {
  const { data, error } = await supabase.rpc('link_wallet_to_account', {
    p_user_id: userId,
    p_wallet_address: walletAddress,
  });

  if (error) throw error;
  return data[0]; // Returns { success, message, wallet_count }
}

export async function unlinkWalletFromAccount(userId: string, walletAddress: string) {
  const { data, error } = await supabase.rpc('unlink_wallet_from_account', {
    p_user_id: userId,
    p_wallet_address: walletAddress,
  });

  if (error) throw error;
  return data[0]; // Returns { success, message }
}

interface UserRecord {
  id: string;
  wallet_address: string;
  primary_wallet_address: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getUserByWallet(
  walletAddress: string
): Promise<UserRecord | null> {
  const { data, error } = await supabase
    .from('wallet_verifications')
    .select(`
      user_id,
      users (*)
    `)
    .eq('wallet_address', walletAddress)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Supabase returns joined relations as arrays
  const user = Array.isArray(data?.users) ? data.users[0] : data?.users;

  return user ? (user as UserRecord) : null;
}


// ============================================================================
// USER PROFILE ACTIONS
// ============================================================================

export async function checkUsernameAvailable(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  let query = supabase
    .from('users')
    .select('id')
    .eq('username', username);

  // Exclude current user when checking (for when user keeps their own username)
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  const { data, error } = await query.single();

  if (error && error.code === 'PGRST116') {
    // No rows found - username is available
    return true;
  }

  if (error) {
    console.error('Username check error:', error);
    throw new Error('Failed to check username availability');
  }

  // If data exists, username is taken
  return !data;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    bio?: string;
    display_name?: string;
    avatar_url?: string;
  }
): Promise<UserRecord> {
  // Validate username if provided
  if (updates.username) {
    // Check format: only letters, numbers, and underscores allowed
    const usernameRegex = /^[A-Za-z0-9_]+$/;
    if (!usernameRegex.test(updates.username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // Check length
    if (updates.username.length < 3 || updates.username.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    // Check uniqueness
    const isAvailable = await checkUsernameAvailable(updates.username, userId);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }
  }

  // Validate bio length if provided
  if (updates.bio && updates.bio.length > 500) {
    throw new Error('Bio must be 500 characters or less');
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }

  return data as UserRecord;
}

// ============================================================================
// USER ACTIONS
// ============================================================================

export async function followUser(userId: string, targetUserId: string) {
  const { data, error } = await supabase
    .from('orbits')
    .insert({
      satellite_id: userId,
      center_id: targetUserId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unfollowUser(userId: string, targetUserId: string) {
  const { error } = await supabase
    .from('orbits')
    .delete()
    .eq('satellite_id', userId)
    .eq('center_id', targetUserId);

  if (error) throw error;
}

export async function checkFollowStatus(userId: string, targetUserId: string) {
  const { data } = await supabase
    .from('orbits')
    .select('id')
    .eq('satellite_id', userId)
    .eq('center_id', targetUserId)
    .single();

  return !!data;
}

// ============================================================================
// POST ACTIONS
// ============================================================================

export async function createPost(post: {
  authorId: string;
  content: string;
  communityId?: string;
}) {
  // Schema only has: author_id, community_id, content, signal_count, echo_count, relay_count
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: post.authorId,
      content: post.content,
      community_id: post.communityId || null,
    })
    .select(`
      *,
      author:users(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Post creation error:', error);
    throw new Error(error.message || 'Failed to create post');
  }
  return data;
}

export async function createPostWithGating(post: {
  authorId: string;
  content: string;
  mediaUrls?: string[];
  isGated?: boolean;
  visibility?: 'public' | 'gated' | 'community';
  communityId?: string;
  gates?: Array<{
    ruleType: string;
    tokenAddress?: string;
    chain?: Chain;
    minimumBalance?: number;
    requiredTier?: string;
  }>;
}) {
  // Create post (schema only has: author_id, community_id, content, signal_count, echo_count, relay_count)
  const { data: newPost, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: post.authorId,
      content: post.content,
      community_id: post.communityId || null,
    })
    .select(`
      *,
      author:users(id, username, display_name, avatar_url)
    `)
    .single();

  if (postError) {
    console.error('Post creation error:', postError);
    throw new Error(postError.message || 'Failed to create post');
  }

  // Create gates if provided
  if (post.gates && post.gates.length > 0 && newPost) {
    const gatesData = post.gates
      .filter(gate => gate.tokenAddress) // Only create gates with valid token addresses
      .map(gate => ({
        post_id: newPost.id,
        token_address: gate.tokenAddress!,
        min_amount: gate.minimumBalance || 0,
        chain: gate.chain || 'solana',
        gate_type: 'view', // Default gate type
      }));

    if (gatesData.length > 0) {
      const { error: gatesError } = await supabase
        .from('post_gates')
        .insert(gatesData);

      if (gatesError) {
        console.error('Failed to create gates:', gatesError);
        // Don't throw - post was created successfully
      }
    }
  }

  return newPost;
}

export async function signalPost(userId: string, postId: string) {
  const { data, error } = await supabase
    .from('signals')
    .insert({
      user_id: userId,
      post_id: postId
    })
    .select()
    .single();

  if (error) {
    // Check if already signaled (unique constraint violation)
    if (error.code === '23505') {
      // Remove signal
      await supabase
        .from('signals')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
      return { removed: true };
    }
    throw error;
  }
  return data;
}

export async function createEcho(echo: {
  postId: string;
  authorId: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from('echoes')
    .insert({
      post_id: echo.postId,
      author_id: echo.authorId,
      content: echo.content,
    })
    .select(`
      *,
      author:users(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function relayPost(userId: string, postId: string, quoteContent?: string) {
  const { data, error } = await supabase
    .from('relays')
    .insert({
      user_id: userId,
      post_id: postId,
      quote_content: quoteContent,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPosts(options: {
  communityId?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users(id, username, display_name, avatar_url),
      gates:post_gates(*),
      _count:signals(count)
    `)
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 10) - 1);

  if (options.communityId) {
    query = query.eq('community_id', options.communityId);
  }

  if (options.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function fetchPostsWithGateStatus(options: {
  communityId?: string;
  authorId?: string;
  userId?: string;
  userWalletAddress?: string;
  chain?: Chain;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users(id, username, display_name, avatar_url),
      gates:post_gates(*)
    `)
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 10) - 1);

  if (options.communityId) {
    query = query.eq('community_id', options.communityId);
  }

  if (options.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  // If user wallet provided, check access for gated posts
  if (options.userWalletAddress && options.chain) {
    try {
      const holdings = await bagsAPI.getHoldings(
        options.userWalletAddress,
        options.chain
      );

      return posts.map(post => ({
        ...post,
        hasAccess: post.is_gated ? checkPostAccess(post.gates, holdings.holdings) : true
      }));
    } catch (error) {
      console.error('Failed to check gate status:', error);
      return posts.map(post => ({
        ...post,
        hasAccess: !post.is_gated // Default to no access for gated posts if check fails
      }));
    }
  }

  return posts;
}

function checkPostAccess(gates: any[], holdings: any[]): boolean {
  if (!gates || gates.length === 0) return true;

  return gates.some(gate => {
    const holding = holdings.find(
      h => h.token_address.toLowerCase() === gate.token_address?.toLowerCase()
    );

    if (!holding) return false;

    if (gate.minimum_balance && holding.balance < gate.minimum_balance) {
      return false;
    }

    return true;
  });
}

// ============================================================================
// COMMUNITY ACTIONS
// ============================================================================

export async function createCommunity(community: {
  name: string;
  slug: string;
  description?: string;
  tokenAddress?: string;
  creatorId: string;
  bannerUrl?: string;
  avatarUrl?: string;
}) {
  // Communities table columns: name, slug, description, creator_id, token_address, banner_url, avatar_url, member_count
  // Note: 'chain' column does NOT exist in deployed database
  const { data, error } = await supabase
    .from('communities')
    .insert({
      name: community.name,
      slug: community.slug,
      description: community.description || null,
      creator_id: community.creatorId,
      token_address: community.tokenAddress || null,
      banner_url: community.bannerUrl || null,
      avatar_url: community.avatarUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Community creation error:', error);
    throw new Error(error.message || 'Failed to create community');
  }

  // After creating community, add creator as founding member
  if (data) {
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: data.id,
        user_id: community.creatorId,
        token_balance: 0, // Creator doesn't need tokens to be founder
        tier: 'elite', // Founder gets elite status
      });

    if (memberError) {
      console.error('Failed to add creator as member:', memberError);
      // Don't throw - community was created successfully
    }

    // Increment member count
    await supabase
      .from('communities')
      .update({ member_count: 1 })
      .eq('id', data.id);
  }

  return data;
}

export async function joinCommunity(userId: string, communityId: string) {
  // Community_members table schema: community_id, user_id, token_balance, tier, joined_at, last_verified
  const { data, error } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
      token_balance: 0, // Will be updated when verified
      tier: 'holder', // Default tier
    })
    .select()
    .single();

  if (error) {
    console.error('Join community error:', error);
    throw new Error(error.message || 'Failed to join community');
  }
  return data;
}

export async function joinCommunityWithVerification(
  userId: string,
  communityId: string,
  walletAddress: string
) {
  // Get community details
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (communityError) throw communityError;

  // Verify token ownership via Bags API
  const holdings = await bagsAPI.getHoldings(
    walletAddress,
    community.chain as Chain
  );

  const tokenHolding = holdings.holdings.find(
    h => h.token_address.toLowerCase() === community.token_address.toLowerCase()
  );

  if (!tokenHolding) {
    throw new Error('You do not hold the required token');
  }

  // Calculate tier
  const tier = bagsAPI.calculateTier(
    tokenHolding.balance,
    tokenHolding.holder_rank,
    tokenHolding.percentage_of_supply
  );

  // Add to community members
  const { data, error } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
      token_balance: tokenHolding.balance,
      tier,
    })
    .select()
    .single();

  if (error) throw error;

  // Increment member count
  await supabase
    .from('communities')
    .update({ 
      member_count: community.member_count + 1 
    })
    .eq('id', communityId);

  return data;
}

export async function fetchCommunities(filter?: 'all' | 'joined') {
  let query = supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// ============================================================================
// LEADERBOARD ACTIONS
// ============================================================================

export async function updateLeaderboardFromBags(
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
) {
  // Get all active users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, wallet_address');

  if (usersError) throw usersError;

  const entries = await Promise.all(
    users.map(async (user) => {
      try {
        // Fetch holdings
        const holdings = await bagsAPI.getHoldings(user.wallet_address, 'solana');
        
        // Fetch trading activity
        const activity = await bagsAPI.getTradingActivity(
          user.wallet_address,
          'solana',
          period === 'daily' ? '24h' : period === 'weekly' ? '7d' : '30d'
        );

        const holdingsScore = holdings.total_value_usd;
        const tradingScore = activity?.total_volume_usd || 0;

        return {
          user_id: user.id,
          community_id: null,
          scope: 'global',
          metric_type: 'holdings',
          score: holdingsScore,
          period,
          calculated_at: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Failed to update leaderboard for ${user.wallet_address}:`, error);
        return null;
      }
    })
  );

  // Filter out nulls and sort
  const validEntries = entries
    .filter(e => e !== null)
    .sort((a, b) => b!.score - a!.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  // Upsert to database
  const { error } = await supabase
    .from('leaderboard_entries')
    .upsert(validEntries, {
      onConflict: 'user_id,community_id,scope,metric_type,period'
    });

  if (error) throw error;
  return validEntries;
}

export async function fetchLeaderboard(options: {
  scope?: 'global' | 'community';
  communityId?: string;
  metricType?: 'holdings' | 'trading' | 'engagement';
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  limit?: number;
}) {
  let query = supabase
    .from('leaderboard_entries')
    .select(`
      *,
      user:users(id, username, display_name, avatar_url)
    `)
    .order('rank', { ascending: true })
    .limit(options.limit || 50);

  if (options.scope) {
    query = query.eq('scope', options.scope);
  }

  if (options.communityId) {
    query = query.eq('community_id', options.communityId);
  }

  if (options.metricType) {
    query = query.eq('metric_type', options.metricType);
  }

  if (options.period) {
    query = query.eq('period', options.period);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================================
// SEARCH ACTIONS
// ============================================================================

export async function searchWithContext(
  query: string,
  type: 'users' | 'communities' | 'posts',
  userWalletAddress?: string
) {
  if (type === 'users') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data;
  }

  if (type === 'communities') {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;

    // Check membership status if wallet provided
    if (userWalletAddress) {
      const enriched = await Promise.all(
        data.map(async (community) => {
          try {
            const holdings = await bagsAPI.getHoldings(
              userWalletAddress,
              community.chain as Chain
            );

            const hasToken = holdings.holdings.some(
              h => h.token_address.toLowerCase() === community.token_address.toLowerCase()
            );

            return { ...community, hasToken };
          } catch (error) {
            return { ...community, hasToken: false };
          }
        })
      );

      return enriched;
    }

    return data;
  }

  if (type === 'posts') {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(id, username, display_name, avatar_url)
      `)
      .textSearch('content', query)
      .limit(20);

    if (error) throw error;
    return data;
  }

  return [];
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToPost(postId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`post:${postId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'posts',
        filter: `id=eq.${postId}`
      }, 
      callback
    )
    .subscribe();
}

export function subscribeToFeed(callback: (payload: any) => void) {
  return supabase
    .channel('feed')
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
      },
      callback
    )
    .subscribe();
}

export function subscribeToEchoes(postId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`echoes:${postId}`)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'echoes',
        filter: `post_id=eq.${postId}`
      },
      callback
    )
    .subscribe();
}