// src/components/ui/EmptyState/EmptyState.tsx
'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import styles from './EmptyState.module.scss';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  variant?: 'default' | 'minimal';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const containerClass = [
    styles.emptyState,
    variant === 'minimal' && styles['emptyState--minimal'],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className={styles.emptyState__icon}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {icon}
      </motion.div>

      <div className={styles.emptyState__content}>
        <motion.h3
          className={styles.emptyState__title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {title}
        </motion.h3>

        <motion.p
          className={styles.emptyState__description}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {description}
        </motion.p>
      </div>

      {action && (
        <motion.div
          className={styles.emptyState__action}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
