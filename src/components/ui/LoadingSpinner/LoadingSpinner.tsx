// File: src/components/ui/LoadingSpinner/LoadingSpinner.tsx
// ============================================================================

import { motion } from 'framer-motion';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ring' | 'lock';
}

export function LoadingSpinner({ size = 'md', variant = 'ring' }: LoadingSpinnerProps) {
  if (variant === 'lock') {
    return (
      <div className={`${styles.spinner} ${styles[`spinner--${size}`]}`}>
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
          }}
        >
          <LockIcon locked={false} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${styles.spinner} ${styles[`spinner--${size}`]}`}>
      <motion.div
        className={styles.spinner__ring}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  );
}