// File: src/components/intelligence/CommunityActivityPanel/CommunityActivityPanel.tsx
// ============================================================================

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useIntelligenceStore } from '@/store/intelligence.store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import type { Chain } from '@/lib/locke/types';
import styles from './CommunityActivityPanel.module.scss';

interface CommunityActivityPanelProps {
  communityId: string;
  communityName: string;
  tokenAddress: string;
  chain: Chain;
}

export function CommunityActivityPanel({
  communityId,
  communityName,
  tokenAddress,
  chain
}: CommunityActivityPanelProps) {
  const {
    communityAnalytics,
    analyticsLoading,
    fetchCommunityAnalytics
  } = useIntelligenceStore();

  useEffect(() => {
    fetchCommunityAnalytics(communityId, tokenAddress, chain);
  }, [communityId, tokenAddress, chain, fetchCommunityAnalytics]);

  const analytics = communityAnalytics.get(communityId);

  if (analyticsLoading) {
    return (
      <div className={styles.panel__loading}>
        <LoadingSpinner size="lg" variant="lock" />
        <p>Loading community analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.panel__empty}>
        <span className={styles.panel__empty_icon}>📊</span>
        <p>No analytics available</p>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={styles.panel__header}>
        <h2 className={styles.panel__title}>{communityName} Activity</h2>
        <div className={`${styles.panel__trend} ${styles[`panel__trend--${analytics.activityTrend}`]}`}>
          {analytics.activityTrend === 'up' ? <TrendUpIcon /> :
           analytics.activityTrend === 'down' ? <TrendDownIcon /> : '→'}
          {analytics.activityTrend === 'up' ? 'Trending Up' :
           analytics.activityTrend === 'down' ? 'Trending Down' : 'Stable'}
        </div>
      </div>

      {/* Token Health Section */}
      {analytics.tokenMetrics && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Token Health</h3>
          <div className={styles.health}>
            <HealthMetric
              label="Price"
              value={`$${analytics.tokenMetrics.priceUsd.toFixed(6)}`}
              change={analytics.tokenMetrics.priceChange24h}
            />
            <HealthMetric
              label="Market Cap"
              value={formatNumber(analytics.tokenMetrics.marketCap)}
              change={analytics.growthRate}
            />
            <HealthMetric
              label="Volume 24h"
              value={formatNumber(analytics.tokenMetrics.volume24h)}
            />
            <HealthMetric
              label="Liquidity"
              value={formatNumber(analytics.tokenMetrics.liquidity)}
            />
          </div>
        </section>
      )}

      {/* Top Trading Pairs */}
      {analytics.topPairs && analytics.topPairs.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Top Trading Pairs</h3>
          <div className={styles.holders}>
            {analytics.topPairs.slice(0, 5).map((pair, index) => (
              <motion.div
                key={pair.pairAddress}
                className={styles.holder}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={styles.holder__rank}>#{index + 1}</div>
                <div className={styles.holder__info}>
                  <div className={styles.holder__address}>
                    {pair.baseToken.symbol}/{pair.quoteToken.symbol}
                  </div>
                  <div className={styles.holder__percentage}>
                    {pair.dexId} · ${(pair.liquidity?.usd || 0).toLocaleString()} liquidity
                  </div>
                </div>
                <div className={styles.holder__balance}>
                  ${(pair.volume?.h24 || 0).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Activity Stats */}
      <section className={styles.section}>
        <h3 className={styles.section__title}>Community Activity (24h)</h3>
        <div className={styles.activity}>
          <ActivityStat icon="👥" label="New Members" value={analytics.newMembers} />
          <ActivityStat icon="🔥" label="Active Members" value={analytics.activeMembers} />
          <ActivityStat icon="📝" label="Total Posts" value={analytics.totalPosts} />
          <ActivityStat icon="⚡" label="Engagement" value={analytics.totalEngagement} />
        </div>
      </section>
    </motion.div>
  );
}

interface HealthMetricProps {
  label: string;
  value: string;
  change?: number;
}

function HealthMetric({ label, value, change }: HealthMetricProps) {
  return (
    <div className={styles.health__metric}>
      <div className={styles.health__label}>{label}</div>
      <div className={styles.health__value}>{value}</div>
      {change !== undefined && (
        <div className={`${styles.health__change} ${change >= 0 ? styles['health__change--up'] : styles['health__change--down']}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

interface ActivityStatProps {
  icon: string;
  label: string;
  value: number;
}

function ActivityStat({ icon, label, value }: ActivityStatProps) {
  return (
    <div className={styles.activity__stat}>
      <div className={styles.activity__icon}>{icon}</div>
      <div className={styles.activity__content}>
        <div className={styles.activity__value}>{value.toLocaleString()}</div>
        <div className={styles.activity__label}>{label}</div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}
