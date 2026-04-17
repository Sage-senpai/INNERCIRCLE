// File: src/components/locke/GatedContent/GatedContent.tsx
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useLockeStore } from '@/store/locke.store';
import { GateRule, GateEvaluation } from '@/lib/locke/types';
import { lockeEngine } from '@/lib/locke/engine';
import { LockIcon } from '../LockIcon/LockIcon';
import { GateBadge } from '../GateBadge/GateBadge';
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
  const { context, refreshContext } = useLockeStore();
  const [evaluation, setEvaluation] = useState<GateEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const evaluateAccess = useCallback(async () => {
    if (!context || !user) {
      setEvaluation({ granted: false, reason: 'Connect wallet to view' });
      setIsEvaluating(false);
      return;
    }

    setIsEvaluating(true);

    try {
      const result = await lockeEngine.evaluateRules(rules, context);
      setEvaluation(result);

      if (result.granted && onUnlock) {
        onUnlock();
      }
    } catch (error) {
      console.error('Gate evaluation failed:', error);
      setEvaluation({
        granted: false,
        reason: 'Failed to verify access. Try refreshing.',
      });
    } finally {
      setIsEvaluating(false);
    }
  }, [rules, context, user, onUnlock]);

  useEffect(() => {
    evaluateAccess();
  }, [evaluateAccess]);

  const handleRefresh = async () => {
    setIsUnlocking(true);
    if (user?.walletAddress) {
      await refreshContext(user.walletAddress, 'solana');
    }
    await evaluateAccess();
    setIsUnlocking(false);
  };

  if (isEvaluating) {
    return (
      <div className={styles.gated}>
        <motion.div 
          className={styles.gated__skeleton}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </div>
    );
  }

  if (evaluation?.granted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
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
        transition={{ duration: 0.3 }}
      >
        {teaser && (
          <motion.div 
            className={styles.gated__teaser}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0.4 }}
          >
            {teaser}
          </motion.div>
        )}
        
        <motion.div 
          className={styles.gated__barrier}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, -5, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <LockIcon className={styles.gated__icon} locked />
          </motion.div>
          
          <h3 className={styles.gated__title}>Access Restricted</h3>
          
          <p className={styles.gated__reason}>{evaluation?.reason}</p>
          
          {evaluation?.missingRequirements && evaluation.missingRequirements.length > 0 && (
            <motion.div 
              className={styles.gated__requirements}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3 }}
            >
              <p className={styles.gated__requirements_title}>Requirements:</p>
              <ul className={styles.gated__requirements_list}>
                {evaluation.missingRequirements.map((req, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                  >
                    {req}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
          
          {/* Token gate badges with "Get Token" CTA */}
          {rules.filter(r => r.tokenAddress).length > 0 && (
            <motion.div
              className={styles.gated__badges}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              {rules.filter(r => r.tokenAddress).map((rule) => (
                <GateBadge
                  key={rule.id}
                  tokenAddress={rule.tokenAddress!}
                  requiredBalance={rule.minimumBalance}
                  userBalance={evaluation?.userBalance}
                  chain={rule.chain}
                />
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="locked"
              onClick={handleRefresh}
              isLoading={isUnlocking}
            >
              Refresh Access
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
