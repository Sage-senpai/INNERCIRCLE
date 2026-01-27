// File: src/components/wallet/WalletStatsModal/WalletStatsModal.tsx
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { bagsAPI } from '@/lib/bags-api/client';
import { useAuthStore } from '@/store/auth.store';
import { linkWalletToAccount, unlinkWalletFromAccount, getUserWithLinkedWallets } from '@/lib/supabase/actions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { Button } from '@/components/ui/Button/Button';
import styles from './WalletStatsModal.module.scss';

interface WalletStats {
  totalValue: number;
  tokenCount: number;
  topHolding: {
    token_symbol: string;
    balance_usd: number;
  } | null;
  volume24h: number;
  trades24h: number;
}

interface WalletStatsModalProps {
  walletAddress: string;
  onClose: () => void;
}

export function WalletStatsModal({ walletAddress, onClose }: WalletStatsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const { user, setUser } = useAuthStore();

  const linkedWallets = user?.linkedWallets || [];
  const availableSlots = 3 - linkedWallets.length;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const loadStats = useCallback(async () => {
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
  }, [walletAddress]);

  useEffect(() => {
    if (mounted) {
      loadStats();
    }
  }, [mounted, loadStats]);

  const handleLinkWallet = async () => {
    if (!user?.id || !newWalletAddress.trim()) return;

    // Basic Solana address validation (32-44 characters, base58)
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaAddressRegex.test(newWalletAddress.trim())) {
      setLinkError('Invalid Solana wallet address');
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const result = await linkWalletToAccount(user.id, newWalletAddress.trim());

      if (result.success) {
        // Refresh user data with linked wallets
        const updatedUser = await getUserWithLinkedWallets(user.id);
        setUser(updatedUser);
        setNewWalletAddress('');
        setShowLinkInput(false);
      } else {
        setLinkError(result.message);
      }
    } catch (error) {
      console.error('Failed to link wallet:', error);
      setLinkError('Failed to link wallet. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkWallet = async (walletToUnlink: string) => {
    if (!user?.id) return;

    setIsUnlinking(walletToUnlink);

    try {
      const result = await unlinkWalletFromAccount(user.id, walletToUnlink);

      if (result.success) {
        // Refresh user data
        const updatedUser = await getUserWithLinkedWallets(user.id);
        setUser(updatedUser);
      } else {
        setLinkError(result.message);
      }
    } catch (error) {
      console.error('Failed to unlink wallet:', error);
      setLinkError('Failed to unlink wallet. Please try again.');
    } finally {
      setIsUnlinking(null);
    }
  };

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
            <span className={styles.modal__address_label}>Primary Address</span>
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
              <Button size="sm" variant="ghost" onClick={loadStats}>
                Retry
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className={styles.modal__divider} />

          {/* Linked Wallets Section */}
          <div className={styles.modal__wallets}>
            <div className={styles.modal__wallets_header}>
              <h3 className={styles.modal__wallets_title}>Linked Wallets ({linkedWallets.length}/3)</h3>
              <span className={styles.modal__wallets_info}>
                Link up to 3 wallets to your account
              </span>
            </div>

            {linkError && (
              <div className={styles.modal__error_message}>
                {linkError}
              </div>
            )}

            <div className={styles.modal__wallets_list}>
              {linkedWallets.map((wallet) => (
                <div key={wallet.walletAddress} className={styles.wallet_item}>
                  <div className={styles.wallet_item__icon}>
                    {wallet.isPrimary ? '⭐' : '🔗'}
                  </div>
                  <div className={styles.wallet_item__content}>
                    <span className={styles.wallet_item__address}>
                      {wallet.walletAddress.slice(0, 8)}...{wallet.walletAddress.slice(-8)}
                    </span>
                    <div className={styles.wallet_item__meta}>
                      {wallet.isPrimary && (
                        <span className={styles.wallet_item__badge}>Primary</span>
                      )}
                      <span className={styles.wallet_item__chain}>{wallet.chain}</span>
                    </div>
                  </div>
                  {!wallet.isPrimary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnlinkWallet(wallet.walletAddress)}
                      disabled={isUnlinking === wallet.walletAddress}
                    >
                      {isUnlinking === wallet.walletAddress ? 'Unlinking...' : 'Unlink'}
                    </Button>
                  )}
                </div>
              ))}

              {/* Link New Wallet Input */}
              {showLinkInput && availableSlots > 0 && (
                <div className={styles.wallet_item}>
                  <div className={styles.wallet_item__icon}>✨</div>
                  <div className={styles.wallet_link_form}>
                    <input
                      type="text"
                      placeholder="Enter Solana wallet address..."
                      value={newWalletAddress}
                      onChange={(e) => setNewWalletAddress(e.target.value)}
                      className={styles.wallet_link_input}
                      disabled={isLinking}
                    />
                    <div className={styles.wallet_link_actions}>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleLinkWallet}
                        disabled={isLinking || !newWalletAddress.trim()}
                      >
                        {isLinking ? 'Linking...' : 'Link'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowLinkInput(false);
                          setNewWalletAddress('');
                          setLinkError(null);
                        }}
                        disabled={isLinking}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty slots / Add wallet button */}
              {!showLinkInput && availableSlots > 0 && (
                <div
                  className={`${styles.wallet_item} ${styles['wallet_item--empty']}`}
                  onClick={() => setShowLinkInput(true)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setShowLinkInput(true)}
                >
                  <div className={styles.wallet_item__icon}>➕</div>
                  <div className={styles.wallet_item__content}>
                    <span className={styles.wallet_item__label}>
                      {availableSlots} slot{availableSlots > 1 ? 's' : ''} available
                    </span>
                    <Button size="sm" variant="ghost">
                      Link Wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
