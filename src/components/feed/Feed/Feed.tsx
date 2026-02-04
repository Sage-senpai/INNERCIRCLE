// src/components/feed/Feed/Feed.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '../Post/Post';
import { PostComposer } from '../PostComposer/PostComposer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { FloatingActionButton } from '@/components/navigation/FloatingActionButton/FloatingActionButton';
import { supabase } from '@/lib/supabase/client';
import { fetchPosts, createPost, createPostWithGating } from '@/lib/supabase/actions';
import { useAuthStore } from '@/store/auth.store';
import styles from './Feed.module.scss';

interface PostAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PostGate {
  id: string;
  post_id: string;
  rule_type: string;
  token_address: string | null;
  chain: string | null;
  minimum_balance: number | null;
  required_tier: string | null;
  custom_logic: Record<string, unknown> | null;
  created_at: string;
}

interface PostData {
  id: string;
  author_id: string;
  community_id: string | null;
  content: string;
  media_urls?: string[] | null; // Optional - may not exist in DB schema
  is_gated?: boolean | null; // Optional - may not exist in DB schema
  visibility?: string | null; // Optional - may not exist in DB schema
  signal_count: number;
  echo_count: number;
  relay_count: number;
  created_at: string;
  updated_at?: string;
  author: PostAuthor;
  gates?: PostGate[];
}

interface TransformedPost {
  id: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  content: string;
  mediaUrls?: string[];
  isGated: boolean;
  gates?: PostGate[];
  signalCount: number;
  echoCount: number;
  relayCount: number;
  createdAt: string;
  hasSignaled?: boolean;
  hasRelayed?: boolean;
}

interface FeedProps {
  type?: 'home' | 'community' | 'profile';
  communityId?: string;
  authorId?: string;
}

interface NewPostData {
  content?: string;
  isGated?: boolean;
  gates?: Array<{
    ruleType?: string;
    tokenAddress?: string;
    minimumBalance?: number;
    requiredTier?: string;
  }>;
}

function transformPost(post: PostData): TransformedPost {
  // Handle potentially undefined/null fields gracefully
  let mediaUrls: string[] | undefined = undefined;
  if (post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0) {
    mediaUrls = post.media_urls;
  }

  return {
    id: post.id,
    author: {
      id: post.author?.id || '',
      username: post.author?.username || 'unknown',
      displayName: post.author?.display_name || undefined,
      avatarUrl: post.author?.avatar_url || undefined,
    },
    content: post.content || '',
    mediaUrls,
    isGated: post.is_gated === true,
    gates: post.gates || [],
    signalCount: post.signal_count ?? 0,
    echoCount: post.echo_count ?? 0,
    relayCount: post.relay_count ?? 0,
    createdAt: post.created_at,
  };
}

export function Feed({ type = 'home', communityId, authorId }: FeedProps) {
  const [posts, setPosts] = useState<TransformedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  const composerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Reset posts when communityId or authorId changes
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
  }, [communityId, authorId]);

  const loadPosts = useCallback(async () => {
    if (!hasMore) return;

    setIsLoading(true);

    try {
      const limit = 10;
      const offset = page * limit;

      const data = await fetchPosts({
        communityId,
        authorId,
        limit,
        offset,
      });

      if (data.length < limit) {
        setHasMore(false);
      }

      const transformed = data.map((post: PostData) => transformPost(post));
      setPosts((prev) => (page === 0 ? transformed : [...prev, ...transformed]));
    } catch (error) {
      console.error('Failed to load posts:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, communityId, authorId, hasMore]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const setupInfiniteScroll = useCallback(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    setupInfiniteScroll();
    return () => observerRef.current?.disconnect();
  }, [setupInfiniteScroll]);

  // Real-time subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('posts_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: communityId ? `community_id=eq.${communityId}` : undefined,
        },
        async (payload) => {
          // Fetch the new post with author data
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              author:users(id, username, display_name, avatar_url),
              gates:post_gates(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const transformed = transformPost(data as PostData);
            setPosts((prev) => [transformed, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          // Update post in real-time (for signal counts, etc.)
          setPosts((prev) =>
            prev.map((post) =>
              post.id === payload.new.id
                ? {
                    ...post,
                    signalCount: (payload.new as { signal_count: number }).signal_count,
                    echoCount: (payload.new as { echo_count: number }).echo_count,
                    relayCount: (payload.new as { relay_count: number }).relay_count,
                  }
                : post
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const handleNewPost = async (newPostData: string | NewPostData) => {
    if (!user) {
      console.error('User must be logged in to create posts');
      return;
    }

    try {
      const content =
        typeof newPostData === 'string'
          ? newPostData
          : newPostData.content || String(newPostData);
      const isGated =
        typeof newPostData === 'object' && newPostData.isGated
          ? newPostData.isGated
          : false;
      const gates =
        typeof newPostData === 'object' && newPostData.gates
          ? newPostData.gates
          : [];

      let createdPost;

      if (isGated && gates.length > 0) {
        // Create post with gating rules
        createdPost = await createPostWithGating({
          authorId: user.id,
          content,
          isGated,
          visibility: isGated ? 'gated' : 'public',
          communityId,
          gates: gates.map((gate) => ({
            ruleType: gate.ruleType || 'token_ownership',
            tokenAddress: gate.tokenAddress,
            chain: 'solana',
            minimumBalance: gate.minimumBalance,
            requiredTier: gate.requiredTier,
          })),
        });
      } else {
        // Create regular post
        createdPost = await createPost({
          authorId: user.id,
          content,
          communityId,
        });
      }

      // Transform and add post (will also be added via real-time subscription)
      const transformed = transformPost(createdPost as PostData);
      setPosts((prev) => {
        // Check if post already exists (from real-time)
        if (prev.some((p) => p.id === transformed.id)) {
          return prev;
        }
        return [transformed, ...prev];
      });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <div className={styles.feed}>
      {type === 'home' && (
        <motion.div
          ref={composerRef}
          className={styles.feed__composer}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <PostComposer onPost={handleNewPost} />
        </motion.div>
      )}

      <div className={styles.feed__posts}>
        <AnimatePresence mode="popLayout">
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <Post post={post} />
            </div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            className={styles.feed__loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        )}

        {!hasMore && posts.length > 0 && (
          <motion.div
            className={styles.feed__end}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>You&apos;ve reached the end</p>
          </motion.div>
        )}
      </div>

      {type === 'home' && (
        <FloatingActionButton composerRef={composerRef} onPost={handleNewPost} />
      )}
    </div>
  );
}
