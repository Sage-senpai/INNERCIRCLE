// File: src/components/intelligence/CommunityActivityPanel/CommunityActivityPanel.tsx
// ============================================================================

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useIntelligenceStore } from '@/store/intelligence.store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import type { CommunityAnalytics } from '@/store/intelligence.store';
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
  }, [communityId, tokenAddress, chain]);

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
              value={`$${analytics.tokenMetrics.price_usd.toFixed(6)}`}
              change={analytics.tokenMetrics.price_change_24h}
            />
            <HealthMetric
              label="Market Cap"
              value={formatNumber(analytics.tokenMetrics.market_cap)}
              change={analytics.growthRate}
            />
            <HealthMetric
              label="Volume 24h"
              value={formatNumber(analytics.tokenMetrics.volume_24h)}
            />
            <HealthMetric
              label="Holders"
              value={analytics.tokenMetrics.holder_count.toLocaleString()}
            />
          </div>
        </section>
      )}

      {/* Holder Distribution */}
      {analytics.holderDistribution && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Holder Distribution</h3>
          <div className={styles.distribution}>
            <DistributionBar
              label="Whales (>1%)"
              count={analytics.holderDistribution.distribution.whales}
              total={analytics.holderDistribution.total_holders}
              color="#3b82f6"
            />
            <DistributionBar
              label="Large (0.1-1%)"
              count={analytics.holderDistribution.distribution.large}
              total={analytics.holderDistribution.total_holders}
              color="#8b5cf6"
            />
            <DistributionBar
              label="Medium (0.01-0.1%)"
              count={analytics.holderDistribution.distribution.medium}
              total={analytics.holderDistribution.total_holders}
              color="#10b981"
            />
            <DistributionBar
              label="Small (<0.01%)"
              count={analytics.holderDistribution.distribution.small}
              total={analytics.holderDistribution.total_holders}
              color="#f59e0b"
            />
          </div>
        </section>
      )}

      {/* Top Holders */}
      {analytics.holderDistribution && (
        <section className={styles.section}>
          <h3 className={styles.section__title}>Top Holders</h3>
          <div className={styles.holders}>
            {analytics.holderDistribution.top_holders.slice(0, 5).map((holder, index) => (
              <motion.div 
                key={holder.wallet_address}
                className={styles.holder}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={styles.holder__rank}>#{holder.rank}</div>
                <Avatar 
                  src={null}
                  alt={holder.wallet_address}
                  size="sm"
                />
                <div className={styles.holder__info}>
                  <div className={styles.holder__address}>
                    {holder.wallet_address.slice(0, 6)}...{holder.wallet_address.slice(-4)}
                  </div>
                  <div className={styles.holder__percentage}>
                    {holder.percentage_of_supply.toFixed(2)}% of supply
                  </div>
                </div>
                <div className={styles.holder__balance}>
                  {formatNumber(holder.balance)}
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

interface DistributionBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function DistributionBar({ label, count, total, color }: DistributionBarProps) {
  const percentage = (count / total) * 100;

  return (
    <div className={styles.distribution__item}>
      <div className={styles.distribution__header}>
        <span className={styles.distribution__label}>{label}</span>
        <span className={styles.distribution__count}>{count.toLocaleString()}</span>
      </div>
      <div className={styles.distribution__bar}>
        <div 
          className={styles.distribution__fill}
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className={styles.distribution__percentage}>
        {percentage.toFixed(1)}%
      </div>
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