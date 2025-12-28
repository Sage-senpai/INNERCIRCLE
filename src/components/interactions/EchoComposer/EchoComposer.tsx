// File: src/components/interactions/EchoComposer/EchoComposer.tsx
// ============================================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/store/auth.store';
import { createEcho } from '@/lib/supabase/actions';
import styles from './EchoComposer.module.scss';

interface EchoComposerProps {
  postId: string;
  onClose: () => void;
}

export function EchoComposer({ postId, onClose }: EchoComposerProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createEcho({
        postId,
        authorId: user.id,
        content: content.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to create echo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className={styles.composer}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <textarea
        className={styles.composer__input}
        placeholder="Add your echo..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        autoFocus
      />
      <div className={styles.composer__actions}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim()}
          isLoading={isSubmitting}
        >
          Echo
        </Button>
      </div>
    </motion.div>
  );
}
