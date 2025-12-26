// File: src/components/locke/GatedContent/GatedContent.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useLockeStore } from '@/store/locke.store';
import { LockeEngine } from '@/lib/locke/engine';
import { GateRule, GateEvaluation } from '@/lib/locke/types';
import { LockIcon } from '../LockIcon/LockIcon';
import { Button } from '@/components/ui/Button/Button';
import styles from './GatedContent.module.scss';

interface GatedContentProps {
  rules: GateRule[];
  children: React.ReactNode;
  teaser?: React.ReactNode;
  onUnlock?: () => void;
}

export function GatedContent({ rules, children, teaser, onUnlock }: GatedContentProps) {
  const { user } = useAuthStore();
  const { context } = useLockeStore();
  const [evaluation, setEvaluation] = useState<GateEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);

  useEffect(() => {
    evaluateAccess();
  }, [rules, context]);

  async function evaluateAccess() {
    if (!context || !user) {
      setEvaluation({ granted: false, reason: 'Connect wallet to view' });
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);
    
    // Simulated Locke engine evaluation
    // In production, this would use the actual LockeEngine instance
    const mockEvaluation: GateEvaluation = {
      granted: false,
      reason: 'Insufficient token balance',
      missingRequirements: [
        'Hold at least 1,000 MEME tokens',
        'Achieve whale tier status'
      ],
      userBalance: 500,
      requiredBalance: 1000
    };

    setEvaluation(mockEvaluation);
    setIsEvaluating(false);

    if (mockEvaluation.granted && onUnlock) {
      onUnlock();
    }
  }

  if (isEvaluating) {
    return (
      <div className={styles.gated}>
        <div className={styles.gated__skeleton} />
      </div>
    );
  }

  if (evaluation?.granted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={styles.gated}>
      <motion.div 
        className={styles.gated__locked}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {teaser && (
          <div className={styles.gated__teaser}>
            {teaser}
          </div>
        )}
        
        <div className={styles.gated__barrier}>
          <LockIcon className={styles.gated__icon} locked />
          
          <h3 className={styles.gated__title}>Access Restricted</h3>
          
          <p className={styles.gated__reason}>{evaluation?.reason}</p>
          
          {evaluation?.missingRequirements && evaluation.missingRequirements.length > 0 && (
            <div className={styles.gated__requirements}>
              <p className={styles.gated__requirements_title}>Requirements:</p>
              <ul className={styles.gated__requirements_list}>
                {evaluation.missingRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          <Button variant="locked" onClick={evaluateAccess}>
            Refresh Access
          </Button>
        </div>
      </motion.div>
    </div>
  );
}