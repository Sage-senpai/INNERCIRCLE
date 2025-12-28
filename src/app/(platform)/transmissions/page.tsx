// File: src/app/(platform)/transmissions/page.tsx
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import styles from './page.module.scss';

export default function TransmissionsPage() {
  return (
    <>
      <PageHeader 
        title="Transmissions" 
        subtitle="Private wallet-to-wallet messages"
      />
      
      <div className={styles.transmissions}>
        <motion.div 
          className={styles.transmissions__empty}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className={styles.transmissions__empty_icon}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            📡
          </motion.div>
          <h2 className={styles.transmissions__empty_title}>
            Transmissions Coming Soon
          </h2>
          <p className={styles.transmissions__empty_description}>
            Send secure, private messages directly to other wallet holders.
            Messages can be gated by token ownership, ensuring only verified community members can reach you.
          </p>
          
          <div className={styles.transmissions__features}>
            <motion.div 
              className={styles.transmissions__feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <LockIcon locked={false} className={styles.transmissions__feature_icon} />
              <div className={styles.transmissions__feature_content}>
                <h3 className={styles.transmissions__feature_title}>Token-Gated Access</h3>
                <p className={styles.transmissions__feature_description}>
                  Control who can message you based on token holdings
                </p>
              </div>
            </motion.div>

            <motion.div 
              className={styles.transmissions__feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className={styles.transmissions__feature_icon}>🔐</span>
              <div className={styles.transmissions__feature_content}>
                <h3 className={styles.transmissions__feature_title}>End-to-End Encrypted</h3>
                <p className={styles.transmissions__feature_description}>
                  Your conversations remain private and secure
                </p>
              </div>
            </motion.div>

            <motion.div 
              className={styles.transmissions__feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className={styles.transmissions__feature_icon}>⚡</span>
              <div className={styles.transmissions__feature_content}>
                <h3 className={styles.transmissions__feature_title}>Real-time Messaging</h3>
                <p className={styles.transmissions__feature_description}>
                  Instant delivery with read receipts and typing indicators
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}