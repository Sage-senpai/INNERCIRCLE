// File: src/components/ui/LoadingSpinner/LoadingSpinner.tsx
// ============================================================================

import { motion } from 'framer-motion';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ring' | 'lock';
}

export function LoadingSpinner({ size = 'md', variant = 'ring' }: LoadingSpinnerProps) {
  if (variant === 'lock') {
    return (
      <div className={`${styles.spinner} ${styles[`spinner--${size}`]} ${styles['spinner--lock']}`}>
        {/* Pulsing icon */}
        <motion.div
          className={styles.spinner__icon}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 019.9-1" />
          </svg>
        </motion.div>

        {/* Animated trace going around */}
        <svg className={styles.spinner__trace} viewBox="0 0 50 50">
          <motion.circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </svg>
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