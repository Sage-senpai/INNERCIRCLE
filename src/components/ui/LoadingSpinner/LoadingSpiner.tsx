// File: src/components/ui/LoadingSpinner/LoadingSpinner.tsx
// ============================================================================

import { motion } from 'framer-motion';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
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