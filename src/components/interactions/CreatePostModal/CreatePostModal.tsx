// src/components/interactions/CreatePostModal/CreatePostModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { createPost } from '@/lib/supabase/actions';
import styles from './CreatePostModal.module.scss';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (newPost: any) => void; // New: callback to update feed optimistically
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isGated, setIsGated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > 500;

  const handleSubmit = async () => {
    if (!content.trim() || !user || isOverLimit) return;

    setIsSubmitting(true);
    try {
      const createdPost = await createPost({
        authorId: user.id,
        content: content.trim(),
        isGated,
        visibility: 'public',
      });

      // Optimistically create a local post object
      const optimisticPost = {
        id: createdPost.id || `temp-${Date.now()}`,
        author: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl,
        },
        content: content.trim(),
        isGated,
        gates: isGated ? [{ ruleType: 'minimum_balance', tokenAddress: 'ABC123', minimumBalance: 1000 }] : [],
        signalCount: 0,
        echoCount: 0,
        relayCount: 0,
        createdAt: new Date().toISOString(),
      };

      onPost?.(optimisticPost);

      setContent('');
      setIsGated(false);
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.modal__header}>
              <h2 className={styles.modal__title}>New Broadcast</h2>
              <button className={styles.modal__close} onClick={onClose}>×</button>
            </div>

            <div className={styles.modal__composer}>
              {user && (
                <div className={styles.modal__user}>
                  <Avatar src={user.avatarUrl} alt={user.username} size="md" />
                  <span className={styles.modal__username}>@{user.username}</span>
                </div>
              )}

              <textarea
                className={styles.modal__textarea}
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                rows={6}
                autoFocus
              />

              <div className={styles.modal__options}>
                <label className={styles.modal__option}>
                  <input
                    type="checkbox"
                    checked={isGated}
                    onChange={(e) => setIsGated(e.target.checked)}
                  />
                  <span>Gate this post</span>
                </label>
                
                <span className={`${styles.modal__count} ${isOverLimit ? styles['modal__count--error'] : ''}`}>
                  {charCount}/500
                </span>
              </div>
            </div>

            <div className={styles.modal__actions}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit}
                isLoading={isSubmitting}
              >
                Broadcast
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}