// File: src/components/interactions/CreateCommunityModal/CreateCommunityModal.tsx
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/store/auth.store';
import { createCommunity, CommunityAccessType } from '@/lib/supabase/actions';
import styles from './CreateCommunityModal.module.scss';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCommunityModal({ isOpen, onClose, onSuccess }: CreateCommunityModalProps) {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    accessType: 'open' as CommunityAccessType,
    tokenAddress: '',
    minTokenAmount: '',
    minHoldDurationDays: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate token-gated requirements
    if (formData.accessType === 'token_gated' && !formData.tokenAddress.trim()) {
      setError('Token address is required for token-gated communities');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createCommunity({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        creatorId: user.id,
        accessType: formData.accessType,
        tokenAddress: formData.accessType === 'token_gated' ? formData.tokenAddress : undefined,
        minTokenAmount: formData.minTokenAmount ? parseFloat(formData.minTokenAmount) : undefined,
        minHoldDurationDays: formData.minHoldDurationDays ? parseInt(formData.minHoldDurationDays, 10) : undefined,
      });

      onSuccess?.();
      onClose();
      setFormData({
        name: '',
        slug: '',
        description: '',
        accessType: 'open',
        tokenAddress: '',
        minTokenAmount: '',
        minHoldDurationDays: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (!mounted) return null;

  const modalContent = (
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modal__header}>
              <h2 className={styles.modal__title}>Create Community</h2>
              <button className={styles.modal__close} onClick={onClose} type="button">×</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modal__form}>
              <div className={styles.modal__field}>
                <label className={styles.modal__label}>Community Name</label>
                <input
                  type="text"
                  className={styles.modal__input}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  placeholder="BONK Holders"
                  required
                />
              </div>

              <div className={styles.modal__field}>
                <label className={styles.modal__label}>URL Slug</label>
                <input
                  type="text"
                  className={styles.modal__input}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="bonk-holders"
                  required
                />
              </div>

              <div className={styles.modal__field}>
                <label className={styles.modal__label}>Description</label>
                <textarea
                  className={styles.modal__textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Official community for BONK token holders..."
                  rows={3}
                />
              </div>

              <div className={styles.modal__field}>
                <label className={styles.modal__label}>Access Type</label>
                <select
                  className={styles.modal__select}
                  value={formData.accessType}
                  onChange={(e) => setFormData({ ...formData, accessType: e.target.value as CommunityAccessType })}
                >
                  <option value="open">Open - Anyone can join</option>
                  <option value="token_gated">Token Gated - Must hold tokens</option>
                  <option value="invite_only">Invite Only - By invitation</option>
                </select>
              </div>

              {formData.accessType === 'token_gated' && (
                <>
                  <div className={styles.modal__field}>
                    <label className={styles.modal__label}>Token Address</label>
                    <input
                      type="text"
                      className={styles.modal__input}
                      value={formData.tokenAddress}
                      onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                      placeholder="Solana token mint address"
                      required
                    />
                    <span className={styles.modal__hint}>The SPL token users must hold to join</span>
                  </div>

                  <div className={styles.modal__field}>
                    <label className={styles.modal__label}>Minimum Token Amount (Optional)</label>
                    <input
                      type="number"
                      className={styles.modal__input}
                      value={formData.minTokenAmount}
                      onChange={(e) => setFormData({ ...formData, minTokenAmount: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="any"
                    />
                    <span className={styles.modal__hint}>Minimum tokens required (0 = any amount)</span>
                  </div>

                  <div className={styles.modal__field}>
                    <label className={styles.modal__label}>Minimum Hold Duration (Optional)</label>
                    <input
                      type="number"
                      className={styles.modal__input}
                      value={formData.minHoldDurationDays}
                      onChange={(e) => setFormData({ ...formData, minHoldDurationDays: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                    <span className={styles.modal__hint}>Days user must have held tokens (0 = no minimum)</span>
                  </div>
                </>
              )}

              {formData.accessType === 'invite_only' && (
                <div className={styles.modal__field}>
                  <span className={styles.modal__hint}>
                    After creating this community, you can generate invite links from the community settings.
                  </span>
                </div>
              )}

              {error && (
                <div className={styles.modal__error}>
                  {error}
                </div>
              )}

              <div className={styles.modal__actions}>
                <Button variant="ghost" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Create Community
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}