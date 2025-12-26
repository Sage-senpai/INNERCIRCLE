// File: src/components/feed/Post/Post.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { GatedContent } from '@/components/locke/GatedContent/GatedContent';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { SignalIcon, EchoIcon, RelayIcon } from '@/components/icons';
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
  onSignal?: (postId: string) => void;
  onEcho?: (postId: string) => void;
  onRelay?: (postId: string) => void;
}

export function Post({ post, onSignal, onEcho, onRelay }: PostProps) {
  const { user } = useAuthStore();
  const [isSignaled, setIsSignaled] = useState(post.hasSignaled || false);
  const [signalCount, setSignalCount] = useState(post.signalCount);

  const handleSignal = async () => {
    if (!user || !onSignal) return;

    // Optimistic UI update
    setIsSignaled(!isSignaled);
    setSignalCount(prev => isSignaled ? prev - 1 : prev + 1);

    try {
      await onSignal(post.id);
    } catch (error) {
      // Revert on error
      setIsSignaled(isSignaled);
      setSignalCount(post.signalCount);
    }
  };

  const renderPostContent = () => (
    <div className={styles.post__content}>
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
          <div className={styles.post__media}>
            {post.mediaUrls.map((url, idx) => (
              <img key={idx} src={url} alt="" className={styles.post__image} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.post__actions}>
        <button 
          className={`${styles.post__action} ${isSignaled ? styles['post__action--active'] : ''}`}
          onClick={handleSignal}
          aria-label="Signal"
        >
          <SignalIcon />
          <span>{signalCount > 0 && signalCount}</span>
        </button>

        <button 
          className={styles.post__action}
          onClick={() => onEcho?.(post.id)}
          aria-label="Echo"
        >
          <EchoIcon />
          <span>{post.echoCount > 0 && post.echoCount}</span>
        </button>

        <button 
          className={styles.post__action}
          onClick={() => onRelay?.(post.id)}
          aria-label="Relay"
        >
          <RelayIcon />
          <span>{post.relayCount > 0 && post.relayCount}</span>
        </button>
      </div>
    </div>
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
      </div>
      <p className={styles.post__teaser_text}>
        {post.content.substring(0, 60)}...
      </p>
    </div>
  );

  if (post.isGated && post.gates && post.gates.length > 0) {
    return (
      <motion.article 
        className={styles.post}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
      transition={{ duration: 0.3 }}
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
