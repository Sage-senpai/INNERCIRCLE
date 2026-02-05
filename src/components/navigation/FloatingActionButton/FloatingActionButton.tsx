// src/components/navigation/FloatingActionButton/FloatingActionButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreatePostModal } from '@/components/interactions/CreatePostModal/CreatePostModal';
import styles from './FloatingActionButton.module.scss';

interface FloatingActionButtonProps {
  onPost?: (post: any) => void;
  composerRef: React.RefObject<HTMLDivElement>; // Required ref from parent
}

export function FloatingActionButton({ onPost, composerRef }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Null check inside handler - ref can become null after unmount
      if (!composerRef.current) {
        setIsVisible(false);
        return;
      }
      const rect = composerRef.current.getBoundingClientRect();
      // Show FAB when top composer is scrolled out of view (80px threshold)
      setIsVisible(rect.bottom < 80);
    };

    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [composerRef]);

  return (
    <>
      <motion.button
        className={styles.fab}
        onClick={() => setIsModalOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Create new broadcast"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPost={onPost}
      />
    </>
  );
}