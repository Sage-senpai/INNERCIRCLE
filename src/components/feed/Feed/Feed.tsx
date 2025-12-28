// src/components/feed/Feed/Feed.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '../Post/Post';
import { PostComposer } from '../PostComposer/PostComposer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { FloatingActionButton } from '@/components/navigation/FloatingActionButton/FloatingActionButton';
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
  const lastPostRef = useRef<HTMLDivElement>(null);

  // Fixed: Explicitly typed as non-nullable RefObject<HTMLDivElement>
  const composerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    loadPosts();
  }, [page, communityId]);

  useEffect(() => {
    setupInfiniteScroll();
    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading]);

  async function loadPosts() {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${page}-${i}`,
      author: {
        id: `user-${i}`,
        username: `user${i}`,
        displayName: `User ${i}`,
        avatarUrl: undefined,
      },
      content: `This is post ${page}-${i}. ${i % 3 === 0 ? 'This post contains gated content that requires token ownership to access. Connect your wallet and verify holdings to unlock.' : 'Public content available to all members of the InnerCircle community.'}`,
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

  const handleNewPost = (newPostData: any) => {
    const newPost = {
      id: `new-${Date.now()}`,
      author: {
        id: 'current-user',
        username: 'you',
        displayName: 'You',
        avatarUrl: undefined,
      },
      content: typeof newPostData === 'string' ? newPostData : newPostData.content || newPostData,
      isGated: newPostData.isGated || false,
      gates: newPostData.isGated ? [{ ruleType: 'minimum_balance', tokenAddress: 'ABC123', minimumBalance: 1000 }] : [],
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
            <p>You've reached the end</p>
          </motion.div>
        )}
      </div>

      {type === 'home' && <FloatingActionButton composerRef={composerRef} onPost={handleNewPost} />}
    </div>
  );
}