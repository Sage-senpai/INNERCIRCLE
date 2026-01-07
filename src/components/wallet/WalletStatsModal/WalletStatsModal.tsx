// File: src/components/wallet/WalletStatsModal/WalletStatsModal.tsx
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { bagsAPI } from '@/lib/bags-api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import styles from './WalletStatsModal.module.scss';

interface WalletStatsModalProps {
  walletAddress: string;
  onClose: () => void;
}

export function WalletStatsModal({ walletAddress, onClose }: WalletStatsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadStats();
    }
  }, [walletAddress, mounted]);

  async function loadStats() {
    setIsLoading(true);
    try {
      const holdings = await bagsAPI.getHoldings(walletAddress, 'solana');
      const activity = await bagsAPI.getTradingActivity(walletAddress, 'solana', '24h');
      
      setStats({
        totalValue: holdings.total_value_usd,
        tokenCount: holdings.holdings.length,
        topHolding: holdings.holdings[0] || null,
        volume24h: activity?.total_volume_usd || 0,
        trades24h: activity?.trades.length || 0,
      });
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      <>
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modal__header}>
            <h2 className={styles.modal__title}>Wallet Stats</h2>
            <button className={styles.modal__close} onClick={onClose} type="button">×</button>
          </div>

          <div className={styles.modal__address}>
            <span className={styles.modal__address_label}>Address</span>
            <span className={styles.modal__address_value}>
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </span>
          </div>

          {isLoading ? (
            <div className={styles.modal__loading}>
              <LoadingSpinner size="lg" variant="lock" />
              <p>Loading wallet data...</p>
            </div>
          ) : stats ? (
            <div className={styles.modal__stats}>
              <div className={styles.stat}>
                <div className={styles.stat__icon}>💰</div>
                <div className={styles.stat__content}>
                  <span className={styles.stat__label}>Total Value</span>
                  <span className={styles.stat__value}>
                    ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.stat__icon}>🪙</div>
                <div className={styles.stat__content}>
                  <span className={styles.stat__label}>Tokens Held</span>
                  <span className={styles.stat__value}>{stats.tokenCount}</span>
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.stat__icon}>📈</div>
                <div className={styles.stat__content}>
                  <span className={styles.stat__label}>24h Volume</span>
                  <span className={styles.stat__value}>
                    ${stats.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className={styles.stat}>
                <div className={styles.stat__icon}>🔄</div>
                <div className={styles.stat__content}>
                  <span className={styles.stat__label}>24h Trades</span>
                  <span className={styles.stat__value}>{stats.trades24h}</span>
                </div>
              </div>

              {stats.topHolding && (
                <div className={`${styles.stat} ${styles['stat--highlight']}`}>
                  <div className={styles.stat__icon}>⭐</div>
                  <div className={styles.stat__content}>
                    <span className={styles.stat__label}>Top Holding</span>
                    <span className={styles.stat__value}>{stats.topHolding.token_symbol}</span>
                    <span className={styles.stat__meta}>
                      ${stats.topHolding.balance_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.modal__error}>
              <p>Failed to load wallet stats</p>
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}