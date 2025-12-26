// File: src/components/ui/Button/Button.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'locked' | 'unlocked';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    disabled,
    className = '',
    ...props 
  }, ref) => {
    const classNames = [
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      isLoading && styles['button--loading'],
      className
    ].filter(Boolean).join(' ');

    return (
      <motion.button
        ref={ref}
        className={classNames}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {isLoading ? (
          <span className={styles.button__spinner} />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';