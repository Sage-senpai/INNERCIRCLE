// File: src/app/(auth)/onboarding/page.tsx
// ============================================================================
// Single-step onboarding: username input + inline feature tour
// ============================================================================

'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { supabase } from '@/lib/supabase/client';
import { getUserByWallet, getUserWithLinkedWallets } from '@/lib/supabase/actions';
import styles from './page.module.scss';

const FEATURE_PILLS = [
  {
    icon: '\u{1F512}',
    label: 'Token-Gated Access',
    description: 'Content protected by on-chain ownership',
  },
  {
    icon: '\u{1F465}',
    label: 'Token Communities',
    description: 'Groups formed around shared holdings',
  },
  {
    icon: '\u{1F4C8}',
    label: 'Influence Rankings',
    description: 'Leaderboards driven by capital & contribution',
  },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const walletAddress = searchParams.get('wallet');
  const chain = searchParams.get('chain');

  const checkExistingUser = useCallback(async () => {
    if (!walletAddress) {
      setIsCheckingUser(false);
      return;
    }

    try {
      console.log('Checking for existing user via wallet_verifications:', walletAddress);

      // Use the multi-wallet system to check for existing user
      const existingUser = await getUserByWallet(walletAddress);

      if (existingUser) {
        console.log('User exists via linked wallet, logging in:', existingUser.username);

        // Get full user data with linked wallets
        const userData = await getUserWithLinkedWallets(existingUser.id);

        setUser({
          id: userData.id,
          walletAddress: walletAddress,
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
          // User exists but hasn't completed onboarding - stay on page
          setIsCheckingUser(false);
        }
        return;
      }

      console.log('No existing user found, proceeding with onboarding');
    } catch (error) {
      console.error('Error checking for existing user:', error);
    } finally {
      setIsCheckingUser(false);
    }
  }, [walletAddress, router, setUser]);

  useEffect(() => {
    if (!walletAddress) {
      console.error('No wallet address provided');
      router.push('/connect');
      return;
    }
    checkExistingUser();
  }, [walletAddress, router, checkExistingUser]);

  const completeOnboarding = useCallback(async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!walletAddress) {
      setError('No wallet address found');
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      const finalUsername = username.toLowerCase().trim() || `user_${Date.now()}`;

      console.log('Completing onboarding for:', {
        wallet_address: walletAddress,
        username: finalUsername,
        chain: chain || 'solana'
      });

      // First check if username is available
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', finalUsername)
        .maybeSingle();

      if (existingUsername) {
        setError('Username already taken. Please choose another.');
        setIsCompleting(false);
        return;
      }

      // Check if this wallet already has a user (via wallet_verifications)
      const existingUser = await getUserByWallet(walletAddress);

      if (existingUser) {
        // User already exists - just update username and complete onboarding
        console.log('User already exists, updating profile');

        const { error: updateError } = await supabase
          .from('users')
          .update({
            username: finalUsername,
            onboarding_completed: true,
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('Update error:', updateError);
          setError(`Failed to update account: ${updateError.message}`);
          return;
        }

        // Get updated user data
        const userData = await getUserWithLinkedWallets(existingUser.id);

        setUser({
          id: userData.id,
          walletAddress: walletAddress,
          primaryWalletAddress: userData.primary_wallet_address,
          username: userData.username,
          displayName: userData.display_name,
          avatarUrl: userData.avatar_url,
          bio: userData.bio,
          role: userData.role,
          onboardingCompleted: true,
          linkedWallets: userData.linkedWallets,
        });

        // Show welcome animation then redirect
        setShowWelcome(true);
        setTimeout(() => router.push('/feed'), 1600);
        return;
      }

      // Create new user with wallet verification
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          primary_wallet_address: walletAddress,
          username: finalUsername,
          role: 'member',
          onboarding_completed: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);

        if (insertError.code === '23505') {
          if (insertError.message.includes('username')) {
            setError('Username already taken. Please choose another.');
          } else if (insertError.message.includes('wallet_address')) {
            setError('Wallet already registered. Redirecting...');
            setTimeout(() => router.push('/feed'), 2000);
          } else {
            setError('This username or wallet is already registered.');
          }
        } else if (insertError.code === '42501') {
          setError('Permission denied. Please check your database policies.');
        } else {
          setError(`Failed to create account: ${insertError.message}`);
        }
        return;
      }

      // Create wallet verification entry
      const { error: walletError } = await supabase
        .from('wallet_verifications')
        .insert({
          user_id: newUser.id,
          wallet_address: walletAddress,
          chain: chain || 'solana',
          is_primary: true,
        });

      if (walletError) {
        console.error('Wallet verification error:', walletError);
        // Continue anyway - user was created
      }

      console.log('User created successfully:', newUser);

      setUser({
        id: newUser.id,
        walletAddress: newUser.wallet_address,
        primaryWalletAddress: newUser.primary_wallet_address,
        username: newUser.username,
        role: newUser.role,
        onboardingCompleted: true,
        linkedWallets: [{
          walletAddress: walletAddress,
          chain: chain || 'solana',
          isPrimary: true,
          verifiedAt: new Date().toISOString(),
        }],
      });

      // Show welcome animation then redirect
      setShowWelcome(true);
      setTimeout(() => router.push('/feed'), 1600);
    } catch (error) {
      console.error('Onboarding failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCompleting(false);
    }
  }, [username, walletAddress, chain, router, setUser]);

  // Loading state while checking existing user
  if (isCheckingUser) {
    return (
      <div className={styles.onboarding}>
        <motion.div
          className={styles.checking}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <LockIcon locked={false} className={styles.checking__icon} />
          </motion.div>
          <p className={styles.checking__text}>Checking account...</p>
        </motion.div>
      </div>
    );
  }

  // Welcome animation after successful onboarding
  if (showWelcome) {
    return (
      <div className={styles.onboarding}>
        <motion.div
          className={styles.welcome}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 14 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          >
            <LockIcon locked={false} className={styles.welcome__icon} />
          </motion.div>
          <motion.h1
            className={styles.welcome__title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Welcome, {username}
          </motion.h1>
          <motion.p
            className={styles.welcome__subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Entering InnerCircle...
          </motion.p>
          <motion.div
            className={styles.welcome__bar}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.6, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.onboarding}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className={styles.cardContent}>
          {/* Header */}
          <motion.div
            className={styles.brandMark}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <LockIcon locked={false} className={styles.brandMark__icon} />
          </motion.div>

          <motion.h1
            className={styles.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Choose Your Handle
          </motion.h1>

          <motion.p
            className={styles.description}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Your permanent on-chain identity on InnerCircle.
          </motion.p>

          {/* Username input */}
          <motion.div
            className={styles.inputWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.inputField}>
              <span className={styles.inputField__prefix}>@</span>
              <input
                type="text"
                placeholder="your_handle"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/\s/g, '').toLowerCase());
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && username.trim()) {
                    completeOnboarding();
                  }
                }}
                className={styles.usernameInput}
                autoFocus
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  className={styles.error}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enter button */}
          <motion.div
            className={styles.submitWrapper}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={completeOnboarding}
              isLoading={isCompleting}
              disabled={!username.trim()}
              className={styles.submitButton}
            >
              Enter InnerCircle
            </Button>
          </motion.div>

          {/* Feature tour pills */}
          <motion.div
            className={styles.tourSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className={styles.tourSection__label}>Here&apos;s what you&apos;ll find</p>
            <div className={styles.pillGrid}>
              {FEATURE_PILLS.map((pill, i) => (
                <motion.div
                  key={pill.label}
                  className={styles.pill}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.12 }}
                >
                  <span className={styles.pill__icon}>{pill.icon}</span>
                  <div className={styles.pill__text}>
                    <span className={styles.pill__label}>{pill.label}</span>
                    <span className={styles.pill__description}>{pill.description}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className={styles.loading}>
        <p>Loading onboarding...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
