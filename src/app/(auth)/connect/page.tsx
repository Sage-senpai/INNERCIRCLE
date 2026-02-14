// File: src/app/(auth)/connect/page.tsx
// ============================================================================
// Connect Page - Professional Design with Theme Support
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletManager, type WalletAdapter } from '@/lib/wallets/adapter';
import { useAuthStore } from '@/store/auth.store';
import { getOrCreateUserByWallet, getUserWithLinkedWallets } from '@/lib/supabase/actions';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { PhantomIcon, SolflareIcon, MetaMaskIcon } from '@/components/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle';
import styles from './page.module.scss';

export default function LandingPage() {
  const router = useRouter();
  const { setUser, setConnecting, isAuthenticated, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletAdapter | null>(null);
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

  const handleConnect = async (adapter: WalletAdapter) => {
    setError(null);
    setIsConnecting(true);
    setConnecting(true);
    setConnectingWallet(adapter);

    try {
      // Check if wallet is installed
      if (!walletManager.isWalletInstalled(adapter)) {
        const walletName = adapter === 'phantom' 
          ? 'Phantom' 
          : adapter === 'solflare' 
            ? 'Solflare' 
            : 'MetaMask';
        const installUrl = adapter === 'phantom' 
          ? 'https://phantom.app' 
          : adapter === 'solflare'
            ? 'https://solflare.com'
            : 'https://metamask.io';
        throw new Error(
          `${walletName} wallet is not installed. Please install it from ${installUrl}`
        );
      }

      console.log(`Connecting to ${adapter}...`);

      // Connect wallet
      const connection = await walletManager.connect(adapter);
      console.log('Wallet connected:', connection.address);

      // Use multi-wallet system to get or create user
      const result = await getOrCreateUserByWallet(connection.address);
      console.log('User lookup result:', result);

      if (result.is_new_user) {
        // New user - send to onboarding with auto-generated username
        console.log('New user created, redirecting to onboarding');
        router.push(`/onboarding?wallet=${connection.address}&username=${result.username}&chain=${connection.chain}`);
      } else {
        // Existing user - load full profile with linked wallets
        console.log('Existing user found, loading profile');
        const userData = await getUserWithLinkedWallets(result.user_id);

        setUser({
          id: userData.id,
          walletAddress: connection.address, // Current connected wallet
          primaryWalletAddress: userData.primary_wallet_address,
          username: userData.username,
          displayName: userData.display_name,
          avatarUrl: userData.avatar_url,
          bio: userData.bio,
          role: userData.role,
          onboardingCompleted: userData.onboarding_completed,
          linkedWallets: userData.linkedWallets,
        });

        // Redirect based on onboarding status
        if (userData.onboarding_completed) {
          router.push('/feed');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Connection error:', err);
      
      // Disconnect on error
      try {
        await walletManager.disconnect(adapter);
      } catch (disconnectErr) {
        console.error('Disconnect error:', disconnectErr);
      }
    } finally {
      setIsConnecting(false);
      setConnecting(false);
      setConnectingWallet(null);
    }
  };

  return (
    <div className={styles.landing}>
      {/* Top Bar */}
      <motion.header
        className={styles.topBar}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className={styles.topBar__container}>
          <div className={styles.topBar__logo}>
            <LockIcon locked={false} size="sm" />
            <span className={styles.topBar__brand}>InnerCircle</span>
          </div>

          <div className={styles.topBar__actions}>
            <ThemeToggle />
            <motion.button
              className={styles.topBar__connect}
              onClick={() => setShowWallets(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isConnecting}
            >
              Connect Wallet
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Wallet Connection */}
      <section className={styles.hero}>
        <div className={styles.hero__background}>
          <div className={styles.hero__grid} />
          <div className={styles.hero__background_blob_1} />
          <div className={styles.hero__background_blob_2} />
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

      <AnimatePresence>
        {showWallets && (
          <motion.div
            className={styles.walletsOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isConnecting) {
                setShowWallets(false);
                setError(null);
              }
            }}
          >
            <motion.div
              className={styles.walletsModal}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 160, damping: 20 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.walletsHeader}>
                <div>
                  <h3 className={styles.wallets__title}>Connect Wallet</h3>
                  <p className={styles.wallets__subtitle}>Choose a wallet to continue</p>
                </div>
                <button
                  className={styles.walletsClose}
                  onClick={() => {
                    setShowWallets(false);
                    setError(null);
                  }}
                  disabled={isConnecting}
                >
                  Close
                </button>
              </div>

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
                  {connectingWallet === 'phantom' && (
                    <span className={styles.wallet__badge}>Connecting...</span>
                  )}
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
                  {connectingWallet === 'solflare' && (
                    <span className={styles.wallet__badge}>Connecting...</span>
                  )}
                </motion.button>

                <motion.button
                  className={`${styles.wallet} ${styles['wallet--ethereum']}`}
                  onClick={() => handleConnect('metamask')}
                  disabled={isConnecting}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MetaMaskIcon />
                  <span>MetaMask</span>
                  {connectingWallet === 'metamask' && (
                    <span className={styles.wallet__badge}>Connecting...</span>
                  )}
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

              {isConnecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.wallets__connecting}
                >
                  <p>Connecting to wallet...</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              { number: '01', title: 'Connect Wallet', description: 'Link your Solana wallet to get started.' },
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

