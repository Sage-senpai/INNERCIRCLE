// File: src/components/feed/PostComposer/PostComposer.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import styles from './PostComposer.module.scss';

interface PostComposerProps {
  onPost: (content: string) => void;
  placeholder?: string;
}

export function PostComposer({ onPost, placeholder = "What's on your mind?" }: PostComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isPosting) return;

    setIsPosting(true);
    await onPost(content);
    setContent('');
    setIsPosting(false);
  };

  if (!user) {
    return (
      <div className={styles.composer}>
        <p className={styles.composer__prompt}>
          Connect your wallet to start posting
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.composer}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.composer__header}>
        <Avatar 
          src={user.avatarUrl} 
          alt={user.username}
          size="md"
        />
      </div>

      <textarea
        className={styles.composer__input}
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />

      <div className={styles.composer__footer}>
        <div className={styles.composer__actions}>
          {/* Future: Image upload, gate settings, etc. */}
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!content.trim()}
          isLoading={isPosting}
        >
          Broadcast
        </Button>
      </div>
    </motion.div>
  );
}
