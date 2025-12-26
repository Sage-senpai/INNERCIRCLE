// File: src/components/feed/Feed/Feed.tsx

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '../Post/Post';
import { PostComposer } from '../PostComposer/PostComposer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import styles from './Feed.module.scss';

interface FeedProps {
  type?: 'home' | 'community';
  communityId?: string;
}

export function Feed({ type = 'home', communityId }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadPosts();
  }, [page, communityId]);

  useEffect(() => {
    setupInfiniteScroll();
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading]);

  async function loadPosts() {
    setIsLoading(true);
    
    // Simulated API call
    // In production: const data = await supabase.from('posts').select()...
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${page}-${i}`,
      author: {
        id: `user-${i}`,
        username: `user${i}`,
        displayName: `User ${i}`,
        avatarUrl: undefined,
      },
      content: `This is post ${page}-${i}. ${i % 3 === 0 ? 'This post contains gated content that requires token ownership.' : 'Public content available to all.'}`,
      isGated: i % 3 === 0,
      gates: i % 3 === 0 ? [{ ruleType: 'minimum_balance', tokenAddress: 'ABC123', minimumBalance: 1000 }] : [],
      signalCount: Math.floor(Math.random() * 100),
      echoCount: Math.floor(Math.random() * 50),
      relayCount: Math.floor(Math.random() * 25),
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));

    setPosts(prev => [...prev, ...mockPosts]);
    setIsLoading(false);
    
    if (page >= 5) {
      setHasMore(false);
    }
  }

  function setupInfiniteScroll() {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }
  }

  const handleSignal = async (postId: string) => {
    // Implement signal logic
    console.log('Signal:', postId);
  };

  const handleEcho = async (postId: string) => {
    // Implement echo logic
    console.log('Echo:', postId);
  };

  const handleRelay = async (postId: string) => {
    // Implement relay logic
    console.log('Relay:', postId);
  };

  const handleNewPost = (content: string) => {
    const newPost = {
      id: `new-${Date.now()}`,
      author: {
        id: 'current-user',
        username: 'you',
        displayName: 'You',
      },
      content,
      isGated: false,
      gates: [],
      signalCount: 0,
      echoCount: 0,
      relayCount: 0,
      createdAt: new Date().toISOString(),
    };

    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className={styles.feed}>
      {type === 'home' && (
        <div className={styles.feed__composer}>
          <PostComposer onPost={handleNewPost} />
        </div>
      )}

      <div className={styles.feed__posts}>
        <AnimatePresence>
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <Post
                post={post}
                onSignal={handleSignal}
                onEcho={handleEcho}
                onRelay={handleRelay}
              />
            </div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className={styles.feed__loading}>
            <LoadingSpinner />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className={styles.feed__end}>
            <p>You've reached the end</p>
          </div>
        )}
      </div>
    </div>
  );
}
