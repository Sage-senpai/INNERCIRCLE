// File: src/app/(auth)/onboarding/page.tsx

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

const STEPS = [
  {
    title: 'Choose Your Identity',
    description: 'This will be your unique handle on InnerCircle',
    component: UsernameStep,
  },
  {
    title: 'Understanding Gates',
    description: 'Content on InnerCircle is protected by token ownership',
    component: GatesExplainerStep,
  },
  {
    title: 'Community Access',
    description: 'Join communities based on your holdings',
    component: CommunitiesExplainerStep,
  },
  {
    title: 'Leaderboards & Influence',
    description: 'Your holdings and activity determine your rank',
    component: LeaderboardsExplainerStep,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const walletAddress = searchParams.get('wallet');
  const chain = searchParams.get('chain');

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    if (!username.trim()) {
      alert('Please choose a username');
      return;
    }

    setIsCompleting(true);

    try {
      // Create user in database
      // const { data: newUser } = await supabase
      //   .from('users')
      //   .insert({
      //     wallet_address: walletAddress,
      //     username: username.toLowerCase(),
      //     onboarding_completed: true
      //   })
      //   .select()
      //   .single();

      // Simulated user creation
      const newUser = {
        id: 'new-user-id',
        walletAddress: walletAddress!,
        username: username.toLowerCase(),
        role: 'member' as const,
        onboardingCompleted: true,
      };

      setUser(newUser);
      router.push('/feed');
    } catch (error) {
      console.error('Onboarding failed:', error);
      setIsCompleting(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className={styles.onboarding}>
      <div className={styles.onboarding__progress}>
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`${styles.onboarding__progress_dot} ${
              index <= currentStep ? styles['onboarding__progress_dot--active'] : ''
            }`}
          />
        ))}
      </div>

      <motion.div 
        className={styles.onboarding__card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.onboarding__header}>
          <h1 className={styles.onboarding__title}>
            {STEPS[currentStep].title}
          </h1>
          <p className={styles.onboarding__description}>
            {STEPS[currentStep].description}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentStepComponent
              username={username}
              setUsername={setUsername}
            />
          </motion.div>
        </AnimatePresence>

        <div className={styles.onboarding__actions}>
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Back
            </Button>
          )}

          <div className={styles.onboarding__actions_right}>
            <Button
              variant="ghost"
              onClick={handleSkip}
            >
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
      </motion.div>
    </div>
  );
}

// Onboarding step components
function UsernameStep({ username, setUsername }: any) {
  return (
    <div className={styles.step}>
      <input
        type="text"
        className={styles.step__input}
        placeholder="your_username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />
      <p className={styles.step__hint}>
        Choose wisely. This cannot be changed later.
      </p>
    </div>
  );
}

function GatesExplainerStep() {
  return (
    <div className={styles.step}>
      <div className={styles.step__visual}>
        <LockIconAnimated />
      </div>
      <ul className={styles.step__list}>
        <li>Posts can be gated by token ownership</li>
        <li>Only holders can view restricted content</li>
        <li>Access updates in real-time as your holdings change</li>
      </ul>
    </div>
  );
}

function CommunitiesExplainerStep() {
  return (
    <div className={styles.step}>
      <div className={styles.step__visual}>
        <CommunitiesIconAnimated />
      </div>
      <ul className={styles.step__list}>
        <li>Communities are built around tokens</li>
        <li>Your tier is determined by holdings</li>
        <li>Higher tiers unlock exclusive features</li>
      </ul>
    </div>
  );
}

function LeaderboardsExplainerStep() {
  return (
    <div className={styles.step}>
      <div className={styles.step__visual}>
        <LeaderboardIconAnimated />
      </div>
      <ul className={styles.step__list}>
        <li>Rankings based on holdings and activity</li>
        <li>Global and community-specific boards</li>
        <li>Influence is earned, not given</li>
      </ul>
    </div>
  );
}

// Placeholder animated icon components
function LockIconAnimated() {
  return <div style={{ fontSize: '64px', textAlign: 'center' }}>🔒</div>;
}

function CommunitiesIconAnimated() {
  return <div style={{ fontSize: '64px', textAlign: 'center' }}>👥</div>;
}

function LeaderboardIconAnimated() {
  return <div style={{ fontSize: '64px', textAlign: 'center' }}>🏆</div>;
}