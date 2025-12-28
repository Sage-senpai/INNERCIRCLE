// File: src/components/ui/PageHeader/PageHeader.tsx
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.header 
      className={styles.header}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header__content}>
        <div className={styles.header__text}>
          <h1 className={styles.header__title}>{title}</h1>
          {subtitle && (
            <motion.p 
              className={styles.header__subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {actions && (
          <motion.div 
            className={styles.header__actions}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}