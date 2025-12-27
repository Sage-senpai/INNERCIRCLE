// File: src/components/locke/LockIcon/LockIcon.tsx

import { motion } from 'framer-motion';
import styles from './LockIcon.module.scss';

interface LockIconProps {
  locked?: boolean;
  className?: string;
}

export function LockIcon({ locked = true, className = '' }: LockIconProps) {
  return (
    <motion.svg
      className={`${styles.lock} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      animate={locked ? { rotate: [0, -5, 5, -5, 0] } : { rotate: 0 }}
      transition={{ duration: 0.5 }}
    >
      {locked ? (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
          <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth={2} strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
          <path d="M7 11V7a5 5 0 019.9-1" strokeWidth={2} strokeLinecap="round" />
        </>
      )}
    </motion.svg>
  );
}
