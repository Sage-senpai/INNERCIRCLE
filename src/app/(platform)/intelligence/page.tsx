// File: src/app/(platform)/intelligence/page.tsx
// ============================================================================
// Market Intelligence with Real Bags API Data
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useIntelligenceStore, SUPPORTED_TOKENS, TokenActivityScore } from '@/store/intelligence.store';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import type { BagsTokenMetrics } from '@/lib/bags-api/client';
import styles from './page.module.scss';

type Tab = 'token-metrics' | 'community-activity' | 'activity-leaderboard';

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('token-metrics');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    selectedTokenMetrics,
    tokenMetricsLoading,
    activityLeaderboard,
    leaderboardLoading,
    fetchTokenMetrics,
    fetchActivityLeaderboard,
  } = useIntelligenceStore();

  const handleTokenSelect = useCallback(async (address: string, chain: 'solana') => {
    setSelectedToken(address);
    setLastUpdated(new Date());

    if (activeTab === 'token-metrics') {
      await fetchTokenMetrics(address, chain);
    } else if (activeTab === 'activity-leaderboard') {
      await fetchActivityLeaderboard(address, chain);
    }
  }, [activeTab, fetchTokenMetrics, fetchActivityLeaderboard]);

  // Refresh data when tab changes
  useEffect(() => {
    if (selectedToken) {
      if (activeTab === 'token-metrics') {
        fetchTokenMetrics(selectedToken, 'solana');
      } else if (activeTab === 'activity-leaderboard') {
        fetchActivityLeaderboard(selectedToken, 'solana');
      }
    }
  }, [activeTab, selectedToken, fetchTokenMetrics, fetchActivityLeaderboard]);

  return (
    <>
      <PageHeader
        title="Market Intelligence"
        subtitle="Real-time token analytics and community insights powered by Bags API"
      />

      <div className={styles.intelligence}>
        {/* Section: Navigation Tabs */}
        <section className={styles.section}>
          <div className={styles.section__header}>
            <h2 className={styles.section__title}>Analytics Dashboard</h2>
            {lastUpdated && (
              <span className={styles.section__meta}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className={styles.tabs}>
            <Button
              variant={activeTab === 'token-metrics' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('token-metrics')}
            >
              Token Metrics
            </Button>
            <Button
              variant={activeTab === 'community-activity' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('community-activity')}
            >
              Community Activity
            </Button>
            <Button
              variant={activeTab === 'activity-leaderboard' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('activity-leaderboard')}
            >
              Activity Leaderboard
            </Button>
          </div>
        </section>

        {/* Section: Token Selector */}
        <section className={styles.section}>
          <div className={styles.section__header}>
            <h2 className={styles.section__title}>Select Token</h2>
            <span className={styles.section__meta}>{SUPPORTED_TOKENS.length} tokens available</span>
          </div>
          <div className={styles.selector}>
            <div className={styles.selector__tokens}>
              {SUPPORTED_TOKENS.map((token) => (
                <motion.button
                  key={token.address}
                  className={`${styles.selector__token} ${selectedToken === token.address ? styles['selector__token--active'] : ''}`}
                  onClick={() => handleTokenSelect(token.address, token.chain)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.selector__token_symbol}>{token.symbol}</span>
                  <span className={styles.selector__token_name}>{token.name}</span>
                  <span className={styles.selector__token_chain}>{token.chain}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Content Area */}
        <section className={styles.section}>
          <div className={styles.section__header}>
            <h2 className={styles.section__title}>
              {activeTab === 'token-metrics' && 'Token Metrics'}
              {activeTab === 'community-activity' && 'Community Activity'}
              {activeTab === 'activity-leaderboard' && 'Activity Leaderboard'}
            </h2>
          </div>
          <div className={styles.content}>
            <AnimatePresence mode="wait">
              {activeTab === 'token-metrics' && (
                <motion.div
                  key="token-metrics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TokenMetricsView
                    metrics={selectedTokenMetrics}
                    loading={tokenMetricsLoading}
                  />
                </motion.div>
              )}

              {activeTab === 'community-activity' && (
                <motion.div
                  key="community-activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CommunityActivityView />
                </motion.div>
              )}

              {activeTab === 'activity-leaderboard' && (
                <motion.div
                  key="activity-leaderboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ActivityLeaderboardView
                    leaderboard={activityLeaderboard}
                    loading={leaderboardLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </>
  );
}

// TOKEN METRICS VIEW
function TokenMetricsView({ metrics, loading }: { metrics: BagsTokenMetrics | null; loading: boolean }) {
  if (loading) {
    return (
      <div className={styles.view__loading}>
        <LoadingSpinner size="lg" variant="lock" />
        <p>Loading token metrics...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={styles.view__empty}>
        <span className={styles.view__empty_icon}>📊</span>
        <p>Select a token to view detailed metrics</p>
      </div>
    );
  }

  const priceChangePositive = metrics.price_change_24h >= 0;

  return (
    <div className={styles.metrics}>
      <div className={styles.metrics__header}>
        <div className={styles.metrics__info}>
          <h2 className={styles.metrics__symbol}>{metrics.symbol}</h2>
          <p className={styles.metrics__name}>{metrics.name}</p>
          <span className={styles.metrics__chain}>Chain: {metrics.chain}</span>
        </div>
        <div className={styles.metrics__price_group}>
          <div className={styles.metrics__price}>${metrics.price_usd.toFixed(8)}</div>
          <div className={`${styles.metrics__change} ${priceChangePositive ? styles['metrics__change--up'] : styles['metrics__change--down']}`}>
            {priceChangePositive ? <TrendUpIcon /> : <TrendDownIcon />}
            {priceChangePositive ? '+' : ''}{metrics.price_change_24h.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className={styles.metrics__divider} />

      <div className={styles.metrics__grid}>
        <MetricCard label="Market Cap" value={formatNumber(metrics.market_cap)} icon="💰" trend={null} />
        <MetricCard label="24h Volume" value={formatNumber(metrics.volume_24h)} icon="📈" trend={null} />
        <MetricCard label="Liquidity" value={formatNumber(metrics.liquidity_usd)} icon="💧" trend={null} />
        <MetricCard label="Holders" value={metrics.holder_count.toLocaleString()} icon="👥" trend={null} />
        <MetricCard
          label="7d Change"
          value={`${metrics.price_change_7d >= 0 ? '+' : ''}${metrics.price_change_7d.toFixed(2)}%`}
          icon={metrics.price_change_7d >= 0 ? '📈' : '📉'}
          trend={metrics.price_change_7d >= 0 ? 'up' : 'down'}
        />
        <MetricCard label="FDV" value={formatNumber(metrics.fully_diluted_valuation)} icon="💎" trend={null} />
      </div>

      <div className={styles.metrics__footer}>
        <span className={styles.metrics__timestamp}>
          Data fetched: {new Date(metrics.fetched_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// COMMUNITY ACTIVITY VIEW
function CommunityActivityView() {
  return (
    <div className={styles.view__empty}>
      <span className={styles.view__empty_icon}>🏘️</span>
      <h3>Community Analytics Coming Soon</h3>
      <p>Select a community from the Communities page to view activity analytics including member growth, engagement metrics, and trending posts.</p>
    </div>
  );
}

// ACTIVITY LEADERBOARD VIEW
function ActivityLeaderboardView({
  leaderboard,
  loading,
}: {
  leaderboard: TokenActivityScore[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className={styles.view__loading}>
        <LoadingSpinner size="lg" variant="lock" />
        <p>Loading activity leaderboard...</p>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className={styles.view__empty}>
        <span className={styles.view__empty_icon}>🏆</span>
        <p>Select a token to view the activity leaderboard</p>
      </div>
    );
  }

  return (
    <div className={styles.leaderboard}>
      <div className={styles.leaderboard__header}>
        <h3>Top Active Holders</h3>
        <p>Ranked by holdings, trading volume, and engagement</p>
      </div>

      <div className={styles.leaderboard__divider} />

      <div className={styles.leaderboard__list}>
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.userId}
            className={`${styles.leaderboard__entry} ${index < 3 ? styles[`leaderboard__entry--top${index + 1}`] : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className={styles.leaderboard__rank}>
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `#${entry.rank}`}
            </div>
            <Avatar src={entry.avatarUrl} alt={entry.username} size="md" />
            <div className={styles.leaderboard__user}>
              <div className={styles.leaderboard__username}>{entry.username}</div>
              <div className={styles.leaderboard__stats}>
                {entry.holdingPercentage.toFixed(4)}% supply · Rank #{entry.holderRank}
              </div>
              {entry.tradingVolume24h > 0 && (
                <div className={styles.leaderboard__volume}>
                  24h Vol: ${entry.tradingVolume24h.toLocaleString()}
                </div>
              )}
            </div>
            <div className={styles.leaderboard__score}>
              <div className={styles.leaderboard__score_value}>{Math.floor(entry.totalScore).toLocaleString()}</div>
              <div className={styles.leaderboard__score_label}>points</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  trend: 'up' | 'down' | null;
}) {
  return (
    <div className={`${styles.metric_card} ${trend ? styles[`metric_card--${trend}`] : ''}`}>
      <div className={styles.metric_card__icon}>{icon}</div>
      <div className={styles.metric_card__content}>
        <div className={styles.metric_card__label}>{label}</div>
        <div className={styles.metric_card__value}>{value}</div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (!num || num === 0) return '$0.00';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}
