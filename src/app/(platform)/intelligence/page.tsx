// File: src/app/(platform)/intelligence/page.tsx
// ============================================================================
// Market Intelligence with DexScreener + Jupiter APIs
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
import type { TokenMetrics } from '@/lib/token-metrics/client';
import type { TokenLaunchFeedItem } from '@/lib/bags-api/client';
import { CreatorFeeDashboard } from '@/components/communities/CreatorFeeDashboard/CreatorFeeDashboard';
import styles from './page.module.scss';

type Tab = 'token-metrics' | 'bags-launches' | 'creator-fees' | 'community-activity' | 'activity-leaderboard';

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>('token-metrics');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    selectedTokenMetrics,
    tokenMetricsLoading,
    activityLeaderboard,
    leaderboardLoading,
    tokenLaunchFeed,
    tokenLaunchFeedLoading,
    fetchTokenMetrics,
    fetchActivityLeaderboard,
    fetchTokenLaunchFeed,
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
        subtitle="Real-time token analytics powered by DexScreener + Bags API"
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
              variant={activeTab === 'bags-launches' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('bags-launches')}
            >
              Bags Launches
            </Button>
            <Button
              variant={activeTab === 'creator-fees' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('creator-fees')}
            >
              Creator Fees
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
              {activeTab === 'bags-launches' && 'Recently Launched on Bags'}
              {activeTab === 'creator-fees' && 'Creator Fee Revenue'}
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

              {activeTab === 'bags-launches' && (
                <motion.div
                  key="bags-launches"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <BagsLaunchFeedView
                    feed={tokenLaunchFeed}
                    loading={tokenLaunchFeedLoading}
                    onLoad={fetchTokenLaunchFeed}
                  />
                </motion.div>
              )}

              {activeTab === 'creator-fees' && (
                <motion.div
                  key="creator-fees"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {selectedToken ? (
                    <CreatorFeeDashboard tokenMint={selectedToken} />
                  ) : (
                    <div className={styles.view__empty}>
                      <span className={styles.view__empty_icon}>💰</span>
                      <p>Select a Bags token to view creator fee revenue</p>
                    </div>
                  )}
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
function TokenMetricsView({ metrics, loading }: { metrics: TokenMetrics | null; loading: boolean }) {
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

  const priceChangePositive = metrics.priceChange24h >= 0;

  return (
    <div className={styles.metrics}>
      <div className={styles.metrics__header}>
        <div className={styles.metrics__info}>
          <h2 className={styles.metrics__symbol}>{metrics.symbol}</h2>
          <p className={styles.metrics__name}>{metrics.name}</p>
          <span className={styles.metrics__chain}>Chain: {metrics.chain}</span>
        </div>
        <div className={styles.metrics__price_group}>
          <div className={styles.metrics__price}>${metrics.priceUsd.toFixed(8)}</div>
          <div className={`${styles.metrics__change} ${priceChangePositive ? styles['metrics__change--up'] : styles['metrics__change--down']}`}>
            {priceChangePositive ? <TrendUpIcon /> : <TrendDownIcon />}
            {priceChangePositive ? '+' : ''}{metrics.priceChange24h.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className={styles.metrics__divider} />

      <div className={styles.metrics__grid}>
        <MetricCard label="Market Cap" value={formatNumber(metrics.marketCap)} icon="💰" trend={null} />
        <MetricCard label="24h Volume" value={formatNumber(metrics.volume24h)} icon="📈" trend={null} />
        <MetricCard label="Liquidity" value={formatNumber(metrics.liquidity)} icon="💧" trend={null} />
        <MetricCard
          label="6h Change"
          value={`${metrics.priceChange6h >= 0 ? '+' : ''}${metrics.priceChange6h.toFixed(2)}%`}
          icon={metrics.priceChange6h >= 0 ? '📈' : '📉'}
          trend={metrics.priceChange6h >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="1h Change"
          value={`${metrics.priceChange1h >= 0 ? '+' : ''}${metrics.priceChange1h.toFixed(2)}%`}
          icon={metrics.priceChange1h >= 0 ? '📈' : '📉'}
          trend={metrics.priceChange1h >= 0 ? 'up' : 'down'}
        />
        <MetricCard label="FDV" value={formatNumber(metrics.fdv)} icon="💎" trend={null} />
      </div>

      <div className={styles.metrics__footer}>
        <span className={styles.metrics__timestamp}>
          Data fetched: {new Date(metrics.fetchedAt).toLocaleString()}
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
        <h3>Trading Pairs Activity</h3>
        <p>Top trading pairs ranked by volume and liquidity</p>
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
              <div className={styles.leaderboard__username}>{entry.displayName || entry.username}</div>
              <div className={styles.leaderboard__stats}>
                Liquidity: ${entry.holdingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              {entry.tradingVolume24h > 0 && (
                <div className={styles.leaderboard__volume}>
                  24h Vol: ${entry.tradingVolume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {entry.tradeCount24h} trades
                </div>
              )}
            </div>
            <div className={styles.leaderboard__score}>
              <div className={styles.leaderboard__score_value}>{Math.floor(entry.totalScore).toLocaleString()}</div>
              <div className={styles.leaderboard__score_label}>score</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// BAGS LAUNCH FEED VIEW
function BagsLaunchFeedView({
  feed,
  loading,
  onLoad,
}: {
  feed: TokenLaunchFeedItem[];
  loading: boolean;
  onLoad: () => void;
}) {
  useEffect(() => {
    if (feed.length === 0 && !loading) {
      onLoad();
    }
  }, [feed.length, loading, onLoad]);

  if (loading) {
    return (
      <div className={styles.view__loading}>
        <LoadingSpinner size="lg" variant="lock" />
        <p>Loading Bags token launches...</p>
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className={styles.view__empty}>
        <span className={styles.view__empty_icon}>🚀</span>
        <h3>No Recent Launches</h3>
        <p>Check back soon for new tokens launched on Bags</p>
        <Button variant="ghost" onClick={onLoad}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className={styles.leaderboard}>
      <div className={styles.leaderboard__header}>
        <h3>Recently Launched on Bags</h3>
        <p>New tokens launched via the Bags platform</p>
      </div>

      <div className={styles.leaderboard__divider} />

      <div className={styles.leaderboard__list}>
        {feed.map((item, index) => (
          <motion.div
            key={item.tokenMint || index}
            className={styles.leaderboard__entry}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className={styles.leaderboard__rank}>
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
            </div>
            {item.image ? (
              <Avatar src={item.image} alt={item.symbol || item.name} size="md" />
            ) : (
              <div className={styles.leaderboard__avatar_placeholder}>
                {(item.symbol || '?')[0]}
              </div>
            )}
            <div className={styles.leaderboard__user}>
              <div className={styles.leaderboard__username}>
                {item.symbol && item.symbol !== 'LIVE' && item.symbol !== 'GRADUATED'
                  ? item.symbol
                  : `${item.tokenMint.slice(0, 6)}…${item.tokenMint.slice(-4)}`}
                {item.isMigrated !== undefined && (
                  <span className={styles.leaderboard__badge}>
                    {item.isMigrated ? '✓ Graduated' : '⚡ Live'}
                  </span>
                )}
              </div>
              <div className={styles.leaderboard__stats}>
                {item.name && item.name !== item.symbol ? item.name : item.description || ''}
              </div>
              {item.creator && (
                <div className={styles.leaderboard__volume}>
                  Creator: {item.creator.slice(0, 4)}…{item.creator.slice(-4)}
                </div>
              )}
              {item.holderCount !== undefined && (
                <div className={styles.leaderboard__volume}>
                  Holders: {item.holderCount.toLocaleString()}
                </div>
              )}
            </div>
            <div className={styles.leaderboard__score}>
              {item.marketCap !== undefined && item.marketCap > 0 ? (
                <>
                  <div className={styles.leaderboard__score_value}>{formatNumber(item.marketCap)}</div>
                  <div className={styles.leaderboard__score_label}>mkt cap</div>
                </>
              ) : item.liquidity !== undefined && item.liquidity > 0 ? (
                <>
                  <div className={styles.leaderboard__score_value}>{formatNumber(item.liquidity)}</div>
                  <div className={styles.leaderboard__score_label}>liquidity</div>
                </>
              ) : (
                <>
                  <div className={styles.leaderboard__score_value}>
                    {item.tokenMint.slice(0, 4)}…{item.tokenMint.slice(-4)}
                  </div>
                  <div className={styles.leaderboard__score_label}>mint</div>
                </>
              )}
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
