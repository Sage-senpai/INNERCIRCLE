// src/components/ui/Button/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './Button.module.scss';

type MotionButtonProps = HTMLMotionProps<'button'>;

interface ButtonProps extends Omit<MotionButtonProps, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'locked' | 'unlocked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled = false,
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
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        animate={{ opacity: isLoading ? 0.7 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props} // Now safe: only Framer Motion + standard button props
      >
        {isLoading ? (
          <>
            <span className={styles.button__spinner} />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';