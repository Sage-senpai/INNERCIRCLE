// File: src/components/ui/Avatar/Avatar.tsx
// ============================================================================

import { motion } from 'framer-motion';
import styles from './Avatar.module.scss';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

export function Avatar({ src, alt, size = 'md', online }: AvatarProps) {
  const initial = alt.charAt(0).toUpperCase();

  return (
    <motion.div 
      className={`${styles.avatar} ${styles[`avatar--${size}`]}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {src ? (
        <img src={src} alt={alt} className={styles.avatar__image} />
      ) : (
        <div className={styles.avatar__placeholder}>
          {initial}
        </div>
      )}
      {online && (
        <motion.div 
          className={styles.avatar__status}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      )}
    </motion.div>
  );
}
