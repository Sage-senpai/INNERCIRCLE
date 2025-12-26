// File: src/components/ui/Avatar/Avatar.tsx

import { motion } from 'framer-motion';
import styles from './Avatar.module.scss';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const initial = alt.charAt(0).toUpperCase();

  return (
    <div className={`${styles.avatar} ${styles[`avatar--${size}`]}`}>
      {src ? (
        <img src={src} alt={alt} className={styles.avatar__image} />
      ) : (
        <div className={styles.avatar__placeholder}>
          {initial}
        </div>
      )}
    </div>
  );
}