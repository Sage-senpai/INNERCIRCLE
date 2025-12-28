// File: src/lib/supabase/actions.ts
// ============================================================================

import { supabase } from './client';

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
  mediaUrls?: string[];
  isGated?: boolean;
  visibility?: 'public' | 'gated' | 'community';
  communityId?: string;
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: post.authorId,
      content: post.content,
      media_urls: post.mediaUrls || [],
      is_gated: post.isGated || false,
      visibility: post.visibility || 'public',
      community_id: post.communityId,
    })
    .select(`
      *,
      author:users(id, username, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
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
    // Check if already signaled
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

// ============================================================================
// COMMUNITY ACTIONS
// ============================================================================

export async function createCommunity(community: {
  name: string;
  slug: string;
  description?: string;
  tokenAddress: string;
  chain: 'solana' | 'polkadot';
  creatorId: string;
  bannerUrl?: string;
  avatarUrl?: string;
}) {
  const { data, error } = await supabase
    .from('communities')
    .insert({
      name: community.name,
      slug: community.slug,
      description: community.description,
      token_address: community.tokenAddress,
      chain: community.chain,
      creator_id: community.creatorId,
      banner_url: community.bannerUrl,
      avatar_url: community.avatarUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinCommunity(userId: string, communityId: string, tokenBalance: number) {
  // Check if user holds enough tokens via Bags API first
  // Then add to community_members
  
  const { data, error } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
      token_balance: tokenBalance,
      tier: calculateTier(tokenBalance),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

function calculateTier(balance: number): 'holder' | 'whale' | 'elite' {
  if (balance >= 1000000) return 'elite';
  if (balance >= 100000) return 'whale';
  return 'holder';
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
