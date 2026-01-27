// File: src/app/(auth)/onboarding/page.tsx
// ============================================================================
// FIXED: Better error handling and user creation
// ============================================================================

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { supabase } from '@/lib/supabase/client';
import { getUserByWallet, getUserWithLinkedWallets } from '@/lib/supabase/actions';
import styles from './page.module.scss';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = searchParams.get('wallet');
  const chain = searchParams.get('chain');

  useEffect(() => {
    if (!walletAddress) {
      console.error('No wallet address provided');
      router.push('/connect');
      return;
    }
    checkExistingUser();
  }, [walletAddress]);

  async function checkExistingUser() {
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
  }

  const STEPS = [
    {
      title: 'Choose Your Handle',
      description: 'Your public identity on InnerCircle. This handle is permanently linked to your wallet.',
      hint: 'Handles are unique and immutable. Choose carefully.',
    },
    {
      title: 'How Access Works',
      description: 'Content on InnerCircle is protected by on-chain ownership.',
      bullets: [
        'Posts can be restricted by token ownership',
        'Access is verified directly on-chain',
        'Permissions update automatically as holdings change',
      ],
      footer: 'Your wallet is your key.',
    },
    {
      title: 'Communities Are Token-Native',
      description: 'Communities form around tokens, narratives, and shared incentives.',
      bullets: [
        'Communities are created around specific tokens',
        'Entry tiers are determined by holdings or criteria',
        'Higher tiers unlock deeper access and visibility',
      ],
    },
    {
      title: 'Influence Is Measurable',
      description: 'Your position reflects both capital and contribution.',
      bullets: [
        'Global and community-specific leaderboards',
        'Rankings consider holdings and activity',
        'Influence unlocks reach, visibility, and privileges',
      ],
      footer: 'Influence is earned, not claimed.',
    },
  ];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    if (currentStep === 0 && !username.trim()) {
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
        setCurrentStep(0);
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

        router.push('/feed');
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
            setCurrentStep(0);
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

      router.push('/feed');
    } catch (error) {
      console.error('Onboarding failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCompleting(false);
    }
  };

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

  const step = STEPS[currentStep];

  return (
    <div className={styles.onboarding}>
      <div className={styles.progress}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`${styles.progressDot} ${i <= currentStep ? styles.active : ''}`}
          />
        ))}
      </div>

      <motion.div className={styles.cardWrapper} layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className={styles.card}
            initial={{ opacity: 0, rotateY: 60, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -60, scale: 0.95 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
          >
            <div className={styles.cardContent}>
              <motion.div 
                className={styles.iconWrapper}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                {currentStep === 1 && <LockIcon locked className={styles.lockIcon} />}
                {currentStep === 0 && <span className={styles.stepIcon}>👤</span>}
                {currentStep === 2 && <span className={styles.stepIcon}>👥</span>}
                {currentStep === 3 && <span className={styles.stepIcon}>🏆</span>}
              </motion.div>

              <motion.h1 
                className={styles.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {step.title}
              </motion.h1>

              <motion.p 
                className={styles.description}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {step.description}
              </motion.p>

              {currentStep === 0 && (
                <motion.div 
                  className={styles.inputWrapper}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <input
                    type="text"
                    placeholder="your_handle"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.replace(/\s/g, '').toLowerCase());
                      setError(null);
                    }}
                    className={styles.usernameInput}
                    autoFocus
                  />
                  <p className={styles.hint}>{step.hint}</p>
                  {error && (
                    <motion.p 
                      className={styles.error}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {step.bullets && (
                <motion.ul 
                  className={styles.bullets}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {step.bullets.map((bullet, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      {bullet}
                    </motion.li>
                  ))}
                </motion.ul>
              )}

              {step.footer && (
                <motion.p 
                  className={styles.footerText}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {step.footer}
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
          Back
        </Button>

        <div className={styles.actionsRight}>
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            isLoading={isCompleting}
            disabled={currentStep === 0 && !username.trim()}
          >
            {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
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