// File: src/components/communities/CreatorFeeDashboard/CreatorFeeDashboard.tsx
// ============================================================================
// Creator fee revenue dashboard for Bags-launched token communities
// Shows lifetime fees earned, claim stats, and creators
// ============================================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { bagsAPI, TokenLaunchCreator, TokenClaimStats } from '@/lib/bags-api/client';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { Button } from '@/components/ui/Button/Button';
import styles from './CreatorFeeDashboard.module.scss';

interface CreatorFeeDashboardProps {
  tokenMint: string;
  communityName?: string;
}

interface FeeData {
  lifetimeFees: number;
  creators: TokenLaunchCreator[];
  claimStats: TokenClaimStats[];
}

export function CreatorFeeDashboard({
  tokenMint,
  communityName,
}: CreatorFeeDashboardProps) {
  const [data, setData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [lifetimeFees, creators, claimStats] = await Promise.all([
        bagsAPI.getTokenLifetimeFees(tokenMint),
        bagsAPI.getTokenCreators(tokenMint),
        bagsAPI.getTokenClaimStats(tokenMint),
      ]);

      setData({ lifetimeFees, creators, claimStats });
    } catch (err) {
      setError('Failed to load fee data');
      console.error('CreatorFeeDashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenMint]);

  useEffect(() => {
    fetchFeeData();
  }, [fetchFeeData]);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashboard__loading}>
          <LoadingSpinner size="md" />
          <p>Loading fee data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashboard__empty}>
          <p>{error || 'No fee data available for this token'}</p>
          <Button variant="ghost" size="sm" onClick={fetchFeeData}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const feesInSOL = data.lifetimeFees / 1e9;
  const isBagsToken = data.creators.length > 0 || data.lifetimeFees > 0;

  if (!isBagsToken) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashboard__empty}>
          <p>This token was not launched on Bags — fee data unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.dashboard}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.dashboard__header}>
        <h3 className={styles.dashboard__title}>
          Creator Revenue {communityName ? `— ${communityName}` : ''}
        </h3>
        <span className={styles.dashboard__subtitle}>
          Bags 1% creator fee earnings
        </span>
      </div>

      <div className={styles.dashboard__divider} />

      {/* Lifetime fees */}
      <div className={styles.dashboard__metric_row}>
        <div className={styles.dashboard__metric}>
          <span className={styles.dashboard__metric_label}>
            Lifetime Fees Earned
          </span>
          <span className={styles.dashboard__metric_value}>
            {feesInSOL.toFixed(4)} SOL
          </span>
        </div>
        <div className={styles.dashboard__metric}>
          <span className={styles.dashboard__metric_label}>
            Total Claims
          </span>
          <span className={styles.dashboard__metric_value}>
            {data.claimStats.length}
          </span>
        </div>
      </div>

      {/* Creators */}
      {data.creators.length > 0 && (
        <>
          <div className={styles.dashboard__divider} />
          <div className={styles.dashboard__section}>
            <h4 className={styles.dashboard__section_title}>Creators</h4>
            <div className={styles.dashboard__creators}>
              {data.creators.map((creator, idx) => (
                <div key={idx} className={styles.dashboard__creator}>
                  <Avatar
                    src={creator.pfp}
                    alt={creator.username}
                    size="sm"
                  />
                  <div className={styles.dashboard__creator_info}>
                    <span className={styles.dashboard__creator_name}>
                      {creator.username || `${creator.wallet.slice(0, 4)}...${creator.wallet.slice(-4)}`}
                    </span>
                    <span className={styles.dashboard__creator_meta}>
                      {creator.royaltyBps / 100}% royalty
                      {creator.isCreator && ' · Original creator'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Top claimers */}
      {data.claimStats.length > 0 && (
        <>
          <div className={styles.dashboard__divider} />
          <div className={styles.dashboard__section}>
            <h4 className={styles.dashboard__section_title}>Top Fee Claimers</h4>
            <div className={styles.dashboard__claimers}>
              {data.claimStats.slice(0, 5).map((stat, idx) => (
                <div key={idx} className={styles.dashboard__claimer}>
                  <span className={styles.dashboard__claimer_rank}>
                    #{idx + 1}
                  </span>
                  <span className={styles.dashboard__claimer_name}>
                    {stat.username || `${stat.wallet.slice(0, 4)}...${stat.wallet.slice(-4)}`}
                  </span>
                  <span className={styles.dashboard__claimer_amount}>
                    {(parseInt(stat.totalClaimed) / 1e9).toFixed(4)} SOL
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={styles.dashboard__footer}>
        <span className={styles.dashboard__mint}>
          Token: {tokenMint.slice(0, 6)}...{tokenMint.slice(-4)}
        </span>
      </div>
    </motion.div>
  );
}
