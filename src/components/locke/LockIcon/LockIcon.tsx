// File: src/components/locke/LockIcon/LockIcon.tsx
// ============================================================================

import { motion } from 'framer-motion';
import styles from './LockIcon.module.scss';

interface LockIconProps {
  locked?: boolean;
  className?: string;
  animated?: boolean;
}

export function LockIcon({ locked = true, className = '', animated = true }: LockIconProps) {
  return (
    <motion.svg
      className={`${styles.lock} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      animate={animated && locked ? { 
        rotate: [0, -3, 3, -3, 0],
      } : {}}
      transition={{ 
        duration: 0.5,
        repeat: animated ? Infinity : 0,
        repeatDelay: 2
      }}
    >
      {locked ? (
        <>
          <motion.rect 
            x="3" 
            y="11" 
            width="18" 
            height="11" 
            rx="2" 
            ry="2" 
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path 
            d="M7 11V7a5 5 0 0110 0v4" 
            strokeWidth={2} 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </>
      ) : (
        <>
          <motion.rect 
            x="3" 
            y="11" 
            width="18" 
            height="11" 
            rx="2" 
            ry="2" 
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path 
            d="M7 11V7a5 5 0 019.9-1" 
            strokeWidth={2} 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </>
      )}
    </motion.svg>
  );
}