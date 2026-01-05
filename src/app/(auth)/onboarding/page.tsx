// File: src/app/(auth)/onboarding/page.tsx
// ============================================================================

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { supabase } from '@/lib/supabase/client';
import styles from './page.module.scss';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const walletAddress = searchParams.get('wallet');
  const chain = searchParams.get('chain');

  useEffect(() => {
    checkExistingUser();
  }, [walletAddress]);

  async function checkExistingUser() {
    if (!walletAddress) {
      setIsCheckingUser(false);
      return;
    }

    try {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingUser && !error) {
        // User exists, log them in directly
        setUser({
          id: existingUser.id,
          walletAddress: existingUser.wallet_address,
          username: existingUser.username,
          displayName: existingUser.display_name,
          avatarUrl: existingUser.avatar_url,
          role: existingUser.role,
          onboardingCompleted: existingUser.onboarding_completed,
        });
        router.push('/feed');
        return;
      }
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
      return;
    }

    setIsCompleting(true);

    try {
      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress!,
          username: username.toLowerCase() || 'anonymous',
          role: 'member',
          onboarding_completed: true,
        })
        .select()
        .single();

      if (error) throw error;

      setUser({
        id: newUser.id,
        walletAddress: newUser.wallet_address,
        username: newUser.username,
        role: newUser.role,
        onboardingCompleted: newUser.onboarding_completed,
      });
      
      router.push('/feed');
    } catch (error) {
      console.error('Onboarding failed:', error);
      // If username is taken, show error
      if ((error as any).code === '23505') {
        alert('Username already taken. Please choose another.');
        setCurrentStep(0);
      }
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
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                    className={styles.usernameInput}
                    autoFocus
                  />
                  <p className={styles.hint}>{step.hint}</p>
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