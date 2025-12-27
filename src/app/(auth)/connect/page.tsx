// File: src/app/(auth)/connect/page.tsx
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { WalletManager } from '@/lib/wallets/adapter';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { PhantomIcon, SolflareIcon, PolkadotIcon } from '@/components/icons';
import styles from './page.module.scss';

export default function ConnectPage() {
  const router = useRouter();
  const { setUser, setConnecting } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const walletManager = new WalletManager();

  const handleConnect = async (adapter: 'phantom' | 'solflare') => {
    setError(null);
    setConnecting(true);

    try {
      const connection = await walletManager.connect(adapter);
      
      // Check if user exists
      // const { data: existingUser } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('wallet_address', connection.address)
      //   .single();

      // Simulated user check
      const existingUser = null;

      if (existingUser) {
        setUser(existingUser);
        router.push('/feed');
      } else {
        // New user - go to onboarding
        router.push(`/onboarding?wallet=${connection.address}&chain=${connection.chain}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      setConnecting(false);
    }
  };

  return (
    <div className={styles.connect}>
      <motion.div 
        className={styles.connect__card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.connect__header}>
          <LockIcon className={styles.connect__icon} />
          <h1 className={styles.connect__title}>InnerCircle</h1>
          <p className={styles.connect__tagline}>Access is earned.</p>
        </div>

        <div className={styles.connect__wallets}>
          <h2 className={styles.connect__subtitle}>Connect Your Wallet</h2>
          
          <div className={styles.connect__options}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleConnect('phantom')}
              className={styles.connect__button}
            >
              <PhantomIcon />
              Phantom
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleConnect('solflare')}
              className={styles.connect__button}
            >
              <SolflareIcon />
              Solflare
            </Button>

            <Button
              variant="secondary"
              size="lg"
              disabled
              className={styles.connect__button}
            >
              <PolkadotIcon />
              Polkadot.js
              <span className={styles.connect__badge}>Soon</span>
            </Button>
          </div>

          {error && (
            <motion.div 
              className={styles.connect__error}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
        </div>

        <div className={styles.connect__footer}>
          <p className={styles.connect__disclaimer}>
            By connecting, you agree to InnerCircle&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}