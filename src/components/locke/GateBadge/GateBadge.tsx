// File: src/components/locke/GateBadge/GateBadge.tsx
// ============================================================================
// Token gate badge — shows required token + balance and "Get Token" swap CTA
// ============================================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LockIcon } from '../LockIcon/LockIcon';
import { Button } from '@/components/ui/Button/Button';
import styles from './GateBadge.module.scss';

interface GateBadgeProps {
  tokenAddress: string;
  tokenSymbol?: string;
  requiredBalance?: number;
  userBalance?: number;
  chain?: string;
}

const BAGS_SWAP_BASE = 'https://bags.fm/swap';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function GateBadge({
  tokenAddress,
  tokenSymbol,
  requiredBalance = 0,
  userBalance,
  chain = 'solana',
}: GateBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const shortMint = `${tokenAddress.slice(0, 4)}...${tokenAddress.slice(-4)}`;
  const displaySymbol = tokenSymbol || shortMint;

  const swapUrl = `${BAGS_SWAP_BASE}?inputMint=${SOL_MINT}&outputMint=${tokenAddress}`;

  const hasBalance = userBalance !== undefined && userBalance > 0;
  const progressPct =
    requiredBalance > 0 && userBalance !== undefined
      ? Math.min((userBalance / requiredBalance) * 100, 100)
      : 0;

  return (
    <motion.div
      className={styles.badge}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.badge__header} onClick={() => setShowDetails(!showDetails)}>
        <LockIcon locked size="sm" className={styles.badge__lock} />
        <span className={styles.badge__symbol}>{displaySymbol}</span>
        {requiredBalance > 0 && (
          <span className={styles.badge__amount}>
            {formatBalance(requiredBalance)} required
          </span>
        )}
      </div>

      {showDetails && (
        <motion.div
          className={styles.badge__details}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {hasBalance && requiredBalance > 0 && (
            <div className={styles.badge__progress}>
              <div className={styles.badge__progress_bar}>
                <motion.div
                  className={styles.badge__progress_fill}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className={styles.badge__progress_text}>
                {formatBalance(userBalance!)} / {formatBalance(requiredBalance)}
              </span>
            </div>
          )}

          <div className={styles.badge__mint}>
            <span className={styles.badge__mint_label}>Mint:</span>
            <code className={styles.badge__mint_address}>{shortMint}</code>
          </div>

          <a
            href={swapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.badge__cta}
          >
            <Button variant="primary" size="sm">
              Get {displaySymbol}
            </Button>
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}

function formatBalance(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(n < 1 ? 4 : 0);
}
