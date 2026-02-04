// src/components/feed/PostComposer/PostComposer.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { createPost } from '@/lib/supabase/actions';
import styles from './PostComposer.module.scss';

interface PostComposerProps {
  onPost?: (post: any) => void;
  placeholder?: string;
  communityId?: string;
}

export function PostComposer({ onPost, placeholder = "What's on your mind?", communityId }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isGated, setIsGated] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > 500;
  const isNearLimit = charCount > 450;

  const handleSubmit = async () => {
    if (!content.trim() || isPosting || !user || isOverLimit) return;

    setIsPosting(true);
    try {
      const newPost = await createPost({
        authorId: user.id,
        content: content.trim(),
        communityId,
      });

      onPost?.(newPost);
      setContent('');
      setIsFocused(false);
      setIsGated(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) {
    return (
      <motion.div className={styles.composer}>
        <p className={styles.composer__prompt}>
          Connect your wallet to start broadcasting
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`${styles.composer} ${isFocused ? styles['composer--focused'] : ''}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.composer__header}>
        <Avatar src={user.avatarUrl} alt={user.username} size="md" />
        <span className={styles.composer__username}>@{user.username}</span>
      </div>

      <textarea
        className={styles.composer__input}
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 500))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !content && setIsFocused(false)}
        rows={isFocused || content ? 5 : 2}
      />

      <AnimatePresence>
        {(isFocused || content) && (
          <motion.div 
            className={styles.composer__footer}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.composer__options}>
              <label className={styles.composer__option}>
                <input type="checkbox" checked={isGated} onChange={(e) => setIsGated(e.target.checked)} />
                <span>Gate this post</span>
              </label>
              
              <span className={`${styles.composer__char_count} ${isNearLimit ? styles['composer__char_count--warning'] : ''} ${isOverLimit ? styles['composer__char_count--error'] : ''}`}>
                {charCount} / 500
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!content.trim() || isOverLimit}
              isLoading={isPosting}
            >
              Broadcast
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}