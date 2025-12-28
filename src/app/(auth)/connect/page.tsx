'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletManager } from '@/lib/wallets/adapter';
import { useAuthStore } from '@/store/auth.store';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { PhantomIcon, SolflareIcon, PolkadotIcon } from '@/components/icons';
import styles from './page.module.scss';

export default function LandingPage() {
  const router = useRouter();
  const { setUser, setConnecting, isAuthenticated, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const walletManager = new WalletManager();

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    router.push('/feed');
    return (
      <div className={styles.loading}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <LockIcon locked={false} />
        </motion.div>
      </div>
    );
  }

  const handleConnect = async (adapter: 'phantom' | 'solflare') => {
    setError(null);
    setIsConnecting(true);
    setConnecting(true);

    try {
      const connection = await walletManager.connect(adapter);
      
      // Simulated user check
      const existingUser = null;

      if (existingUser) {
        setUser(existingUser);
        router.push('/feed');
      } else {
        router.push(`/onboarding?wallet=${connection.address}&chain=${connection.chain}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
      setConnecting(false);
    }
  };

  return (
    <div className={styles.landing}>
      {/* Hero Section with Wallet Connection */}
      <section className={styles.hero}>
        <div className={styles.hero__background}>
          <div className={styles.hero__grid} />
        </div>
        
        <motion.div 
          className={styles.hero__content}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <LockIcon className={styles.hero__icon} locked={false} />
          </motion.div>

          <h1 className={styles.hero__title}>InnerCircle</h1>
          <p className={styles.hero__tagline}>Access is earned.</p>
          
          <p className={styles.hero__description}>
            The token-gated social platform where communities, content, and influence 
            are unlocked through on-chain memecoin ownership.
          </p>

          {!showWallets ? (
            <div className={styles.hero__cta}>
              <motion.button
                className={styles.hero__button}
                onClick={() => setShowWallets(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
              <p className={styles.hero__note}>
                Supports Solana & Polkadot chains
              </p>
            </div>
          ) : (
            <motion.div 
              className={styles.wallets}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <h3 className={styles.wallets__title}>Choose Your Wallet</h3>
              
              <div className={styles.wallets__options}>
                <motion.button
                  className={`${styles.wallet} ${styles['wallet--primary']}`}
                  onClick={() => handleConnect('phantom')}
                  disabled={isConnecting}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PhantomIcon />
                  <span>Phantom</span>
                </motion.button>

                <motion.button
                  className={styles.wallet}
                  onClick={() => handleConnect('solflare')}
                  disabled={isConnecting}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SolflareIcon />
                  <span>Solflare</span>
                </motion.button>

                <motion.button
                  className={styles.wallet}
                  disabled
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <PolkadotIcon />
                  <span>Polkadot.js</span>
                  <span className={styles.wallet__badge}>Soon</span>
                </motion.button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    className={styles.wallets__error}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                className={styles.wallets__back}
                onClick={() => setShowWallets(false)}
              >
                ← Back
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className={styles.hero__scroll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span>Scroll to learn more</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.features__container}>
          <motion.h2 
            className={styles.features__title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Built for Token Holders
          </motion.h2>

          <div className={styles.features__grid}>
            {[
              {
                icon: '🔒',
                title: 'Token Gating',
                description: 'Content unlocks based on your token holdings. Real-time verification via Bags API.'
              },
              {
                icon: '👥',
                title: 'Communities',
                description: 'Join exclusive communities. Your tier and access grow with your holdings.'
              },
              {
                icon: '📊',
                title: 'Market Intelligence',
                description: 'Real-time analytics, holder trends, and community insights.'
              },
              {
                icon: '🏆',
                title: 'Leaderboards',
                description: 'Rankings based on holdings, trading, and engagement. Influence is earned.'
              },
              {
                icon: '📡',
                title: 'Transmissions',
                description: 'Private, wallet-to-wallet messaging. Gated by token ownership.'
              },
              {
                icon: '⚡',
                title: 'Real-time Updates',
                description: 'Your access updates instantly as your holdings change on-chain.'
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className={styles.feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className={styles.feature__icon}>{feature.icon}</div>
                <h3 className={styles.feature__title}>{feature.title}</h3>
                <p className={styles.feature__description}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorks__container}>
          <motion.h2 
            className={styles.howItWorks__title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>

          <div className={styles.howItWorks__steps}>
            {[
              { number: '01', title: 'Connect Wallet', description: 'Link your Solana or Polkadot wallet to get started.' },
              { number: '02', title: 'Verify Holdings', description: 'Your token holdings are verified in real-time via Bags API.' },
              { number: '03', title: 'Unlock Access', description: 'Access content, communities, and features based on what you hold.' },
              { number: '04', title: 'Earn Influence', description: 'Your rank and access grow as your holdings and engagement increase.' },
            ].map((step, i) => (
              <motion.div
                key={step.number}
                className={styles.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className={styles.step__number}>{step.number}</div>
                <div className={styles.step__content}>
                  <h3 className={styles.step__title}>{step.title}</h3>
                  <p className={styles.step__description}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <motion.div 
          className={styles.cta__container}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.cta__title}>Ready to Enter?</h2>
          <p className={styles.cta__description}>
            Access is earned. Connect your wallet to join the most exclusive 
            token-gated communities in Web3.
          </p>
          <motion.button
            className={styles.cta__button}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setShowWallets(true);
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Connect Wallet
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footer__container}>
          <div className={styles.footer__brand}>
            <LockIcon locked={false} />
            <span>InnerCircle</span>
          </div>
          <p className={styles.footer__copyright}>
            © 2025 InnerCircle. Access is earned.
          </p>
          <p className={styles.footer__disclaimer}>
            By connecting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </footer>
    </div>
  );
}
