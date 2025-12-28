// File: src/components/feed/Post/Post.tsx (UPDATED WITH REAL INTERACTIONS)
// ============================================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { GatedContent } from '@/components/locke/GatedContent/GatedContent';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { SignalIcon, EchoIcon, RelayIcon } from '@/components/icons';
import { signalPost, relayPost } from '@/lib/supabase/actions';
import { EchoComposer } from '@/components/interactions/EchoComposer/EchoComposer';
import styles from './Post.module.scss';

interface PostProps {
  post: {
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
    gates?: any[];
    signalCount: number;
    echoCount: number;
    relayCount: number;
    createdAt: string;
    hasSignaled?: boolean;
    hasRelayed?: boolean;
  };
}

export function Post({ post }: PostProps) {
  const { user } = useAuthStore();
  const [isSignaled, setIsSignaled] = useState(post.hasSignaled || false);
  const [signalCount, setSignalCount] = useState(post.signalCount);
  const [showEchoComposer, setShowEchoComposer] = useState(false);
  const [isRelaying, setIsRelaying] = useState(false);

  const handleSignal = async () => {
    if (!user) return;

    const newState = !isSignaled;
    setIsSignaled(newState);
    setSignalCount(prev => newState ? prev + 1 : prev - 1);

    try {
      await signalPost(user.id, post.id);
    } catch (error) {
      setIsSignaled(!newState);
      setSignalCount(post.signalCount);
      console.error('Failed to signal:', error);
    }
  };

  const handleRelay = async () => {
    if (!user || isRelaying) return;

    setIsRelaying(true);
    try {
      await relayPost(user.id, post.id);
    } catch (error) {
      console.error('Failed to relay:', error);
    } finally {
      setIsRelaying(false);
    }
  };

  const renderPostContent = () => (
    <motion.div 
      className={styles.post__content}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.post__header}>
        <Avatar 
          src={post.author.avatarUrl} 
          alt={post.author.username}
          size="md"
        />
        <div className={styles.post__author}>
          <span className={styles.post__display_name}>
            {post.author.displayName || post.author.username}
          </span>
          <span className={styles.post__username}>@{post.author.username}</span>
        </div>
        <time className={styles.post__time}>
          {formatTimeAgo(post.createdAt)}
        </time>
      </div>

      <div className={styles.post__body}>
        <p className={styles.post__text}>{post.content}</p>
        
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <motion.div 
            className={styles.post__media}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {post.mediaUrls.map((url, idx) => (
              <img key={idx} src={url} alt="" className={styles.post__image} />
            ))}
          </motion.div>
        )}
      </div>

      <div className={styles.post__actions}>
        <motion.button 
          className={`${styles.post__action} ${isSignaled ? styles['post__action--active'] : ''}`}
          onClick={handleSignal}
          aria-label="Signal"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <SignalIcon />
          {signalCount > 0 && <span>{signalCount}</span>}
        </motion.button>

        <motion.button 
          className={styles.post__action}
          onClick={() => setShowEchoComposer(!showEchoComposer)}
          aria-label="Echo"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <EchoIcon />
          {post.echoCount > 0 && <span>{post.echoCount}</span>}
        </motion.button>

        <motion.button 
          className={styles.post__action}
          onClick={handleRelay}
          aria-label="Relay"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={isRelaying}
        >
          <RelayIcon />
          {post.relayCount > 0 && <span>{post.relayCount}</span>}
        </motion.button>
      </div>

      {showEchoComposer && user && (
        <EchoComposer
          postId={post.id}
          onClose={() => setShowEchoComposer(false)}
        />
      )}
    </motion.div>
  );

  const renderTeaser = () => (
    <div className={styles.post__teaser}>
      <div className={styles.post__header}>
        <Avatar 
          src={post.author.avatarUrl} 
          alt={post.author.username}
          size="md"
        />
        <div className={styles.post__author}>
          <span className={styles.post__display_name}>
            {post.author.displayName || post.author.username}
          </span>
          <span className={styles.post__username}>@{post.author.username}</span>
        </div>
        <time className={styles.post__time}>
          {formatTimeAgo(post.createdAt)}
        </time>
      </div>
      <p className={styles.post__teaser_text}>
        {post.content.substring(0, 80)}...
      </p>
    </div>
  );

  if (post.isGated && post.gates && post.gates.length > 0) {
    return (
      <motion.article 
        className={styles.post}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <GatedContent rules={post.gates} teaser={renderTeaser()}>
          {renderPostContent()}
        </GatedContent>
      </motion.article>
    );
  }

  return (
    <motion.article 
      className={styles.post}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ backgroundColor: 'rgba(218, 255, 237, 0.08)' }}
    >
      {renderPostContent()}
    </motion.article>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}