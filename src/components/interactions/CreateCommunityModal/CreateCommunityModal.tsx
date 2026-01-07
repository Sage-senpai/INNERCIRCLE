// File: src/components/interactions/CreateCommunityModal/CreateCommunityModal.tsx
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/store/auth.store';
import { createCommunity } from '@/lib/supabase/actions';
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
    tokenAddress: '',
    chain: 'solana' as 'solana' | 'polkadot',
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

    setIsSubmitting(true);
    setError(null);

    try {
      await createCommunity({
        ...formData,
        creatorId: user.id,
      });

      onSuccess?.();
      onClose();
      setFormData({
        name: '',
        slug: '',
        description: '',
        tokenAddress: '',
        chain: 'solana',
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
                <label className={styles.modal__label}>Token Address</label>
                <input
                  type="text"
                  className={styles.modal__input}
                  value={formData.tokenAddress}
                  onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                  placeholder="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
                  required
                />
              </div>

              <div className={styles.modal__field}>
                <label className={styles.modal__label}>Chain</label>
                <select
                  className={styles.modal__select}
                  value={formData.chain}
                  onChange={(e) => setFormData({ ...formData, chain: e.target.value as any })}
                >
                  <option value="solana">Solana</option>
                  <option value="polkadot">Polkadot</option>
                </select>
              </div>

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