// File: src/components/interactions/EchoComposer/EchoComposer.tsx
// ============================================================================
// Premium Web3 SocialFi Echo Composer
// ============================================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useAuthStore } from '@/store/auth.store';
import { createEcho } from '@/lib/supabase/actions';
import styles from './EchoComposer.module.scss';

interface EchoComposerProps {
  postId: string;
  onClose: () => void;
  onEchoCreated?: () => void;
}

export function EchoComposer({ postId, onClose, onEchoCreated }: EchoComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 500;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      setCharCount(newContent.length);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createEcho({
        postId,
        authorId: user.id,
        content: content.trim(),
      });

      // Success animation feedback
      setContent('');
      setCharCount(0);
      onEchoCreated?.();

      // Small delay for visual feedback
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error('Failed to create echo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const progressPercent = (charCount / MAX_CHARS) * 100;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const isAtLimit = charCount === MAX_CHARS;

  return (
    <motion.div
      className={`${styles.composer} ${isFocused ? styles['composer--focused'] : ''}`}
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className={styles.composer__header}>
        <div className={styles.composer__user}>
          <Avatar
            src={user?.avatarUrl}
            alt={user?.username || 'User'}
            size="sm"
          />
          <div className={styles.composer__user_info}>
            <span className={styles.composer__username}>
              {user?.displayName || user?.username}
            </span>
            <span className={styles.composer__badge}>Echoing</span>
          </div>
        </div>

        <button
          className={styles.composer__close}
          onClick={onClose}
          aria-label="Close echo composer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.composer__input_container}>
        <textarea
          ref={textareaRef}
          className={styles.composer__input}
          placeholder="Share your thoughts with the community..."
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={3}
          disabled={isSubmitting}
        />

        {/* Animated glow effect */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className={styles.composer__glow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className={styles.composer__footer}>
        <div className={styles.composer__meta}>
          {/* Character count with progress ring */}
          <div className={styles.composer__char_count}>
            <svg className={styles.char_progress} width="32" height="32">
              <circle
                className={styles.char_progress__bg}
                cx="16"
                cy="16"
                r="14"
                strokeWidth="2"
                fill="none"
              />
              <motion.circle
                className={`${styles.char_progress__bar} ${
                  isNearLimit ? styles['char_progress__bar--warning'] : ''
                } ${isAtLimit ? styles['char_progress__bar--danger'] : ''}`}
                cx="16"
                cy="16"
                r="14"
                strokeWidth="2"
                fill="none"
                strokeDasharray="87.96"
                initial={{ strokeDashoffset: 87.96 }}
                animate={{
                  strokeDashoffset: 87.96 - (87.96 * progressPercent) / 100,
                }}
                transition={{ duration: 0.2 }}
              />
            </svg>
            <span
              className={`${styles.char_count__text} ${
                isNearLimit ? styles['char_count__text--warning'] : ''
              }`}
            >
              {charCount > MAX_CHARS * 0.8 ? MAX_CHARS - charCount : ''}
            </span>
          </div>

          <span className={styles.composer__hint}>
            ⌘ + Enter to echo
          </span>
        </div>

        <div className={styles.composer__actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Echoing...' : '📢 Echo'}
          </Button>
        </div>
      </div>

      {/* Success animation overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className={styles.composer__overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={styles.composer__loader}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              🌊
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
