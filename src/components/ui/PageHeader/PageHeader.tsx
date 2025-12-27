// File: src/components/ui/PageHeader/PageHeader.tsx
// ============================================================================
"use client"
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
    >
      <div className={styles.header__content}>
        <div className={styles.header__text}>
          <h1 className={styles.header__title}>{title}</h1>
          {subtitle && (
            <p className={styles.header__subtitle}>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className={styles.header__actions}>
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  );
}