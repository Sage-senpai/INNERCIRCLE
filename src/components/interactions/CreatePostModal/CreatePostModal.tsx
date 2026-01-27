// File: src/components/interactions/CreatePostModal/CreatePostModal.tsx
// ============================================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { createPostWithGating } from '@/lib/supabase/actions';
import styles from './CreatePostModal.module.scss';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost?: (newPost: any) => void;
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isGated, setIsGated] = useState(false);
  const [showGatingOptions, setShowGatingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gating parameters
  const [ruleType, setRuleType] = useState<'token_ownership' | 'minimum_balance' | 'holder_tier'>('token_ownership');
  const [tokenAddress, setTokenAddress] = useState('');
  const chain = 'solana' as const; // Solana only
  const [minimumBalance, setMinimumBalance] = useState('');
  const [requiredTier, setRequiredTier] = useState<'holder' | 'whale' | 'elite'>('holder');

  const charCount = content.length;
  const isOverLimit = charCount > 500;

  const handleSubmit = async () => {
    if (!content.trim() || !user || isOverLimit) return;

    setIsSubmitting(true);
    try {
      const gates = isGated && tokenAddress ? [{
        ruleType,
        tokenAddress,
        chain,
        minimumBalance: minimumBalance ? parseFloat(minimumBalance) : undefined,
        requiredTier: ruleType === 'holder_tier' ? requiredTier : undefined,
      }] : undefined;

      const createdPost = await createPostWithGating({
        authorId: user.id,
        content: content.trim(),
        isGated,
        visibility: 'public',
        gates,
      });

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
        gates: gates || [],
        signalCount: 0,
        echoCount: 0,
        relayCount: 0,
        createdAt: new Date().toISOString(),
      };

      onPost?.(optimisticPost);
      handleReset();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setIsGated(false);
    setShowGatingOptions(false);
    setTokenAddress('');
    setMinimumBalance('');
    setRuleType('token_ownership');
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
                    onChange={(e) => {
                      setIsGated(e.target.checked);
                      setShowGatingOptions(e.target.checked);
                    }}
                  />
                  <span>Gate this post</span>
                </label>
                
                <span className={`${styles.modal__count} ${isOverLimit ? styles['modal__count--error'] : ''}`}>
                  {charCount}/500
                </span>
              </div>
            </div>

            <AnimatePresence>
              {showGatingOptions && (
                <motion.div
                  className={styles.gating}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h3 className={styles.gating__title}>Access Requirements</h3>
                  
                  <div className={styles.gating__field}>
                    <label className={styles.gating__label}>Rule Type</label>
                    <select
                      className={styles.gating__select}
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as any)}
                    >
                      <option value="token_ownership">Token Ownership</option>
                      <option value="minimum_balance">Minimum Balance</option>
                      <option value="holder_tier">Holder Tier</option>
                    </select>
                  </div>

                  <div className={styles.gating__field}>
                    <label className={styles.gating__label}>Blockchain</label>
                    <div className={styles.gating__static}>Solana</div>
                  </div>

                  <div className={styles.gating__field}>
                    <label className={styles.gating__label}>Token Address *</label>
                    <input
                      type="text"
                      className={styles.gating__input}
                      placeholder="Enter token address..."
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                    />
                  </div>

                  {ruleType === 'minimum_balance' && (
                    <div className={styles.gating__field}>
                      <label className={styles.gating__label}>Minimum Balance</label>
                      <input
                        type="number"
                        className={styles.gating__input}
                        placeholder="e.g., 1000"
                        value={minimumBalance}
                        onChange={(e) => setMinimumBalance(e.target.value)}
                      />
                    </div>
                  )}

                  {ruleType === 'holder_tier' && (
                    <div className={styles.gating__field}>
                      <label className={styles.gating__label}>Required Tier</label>
                      <select
                        className={styles.gating__select}
                        value={requiredTier}
                        onChange={(e) => setRequiredTier(e.target.value as any)}
                      >
                        <option value="holder">Holder</option>
                        <option value="whale">Whale</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
                  )}

                  <div className={styles.gating__info}>
                    <span className={styles.gating__info_icon}>ℹ️</span>
                    <p className={styles.gating__info_text}>
                      Only users who meet these requirements will be able to view this post.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.modal__actions}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!content.trim() || isOverLimit || (isGated && !tokenAddress)}
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