// File: src/app/(platform)/leaderboards/page.tsx
// ============================================================================
// Real-time Leaderboards - Updated every minute
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { LeaderboardEntry } from '@/components/leaderboards/LeaderboardEntry/LeaderboardEntry';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useLeaderboardStore, type MetricType, type Period } from '@/store/leaderboard.store';
import { useAuthStore } from '@/store/auth.store';
import styles from './page.module.scss';

export default function LeaderboardsPage() {
  const { user } = useAuthStore();
  const {
    entries,
    topThree,
    userRank,
    isLoading,
    lastUpdated,
    currentMetric,
    currentPeriod,
    setMetric,
    setPeriod,
    fetchLeaderboard,
    fetchUserRank,
    startAutoRefresh,
  } = useLeaderboardStore();

  const [countdown, setCountdown] = useState(60);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchLeaderboard(currentMetric, currentPeriod);
    const stopRefresh = startAutoRefresh();
    return stopRefresh;
  }, []);

  // Fetch user rank when user changes
  useEffect(() => {
    if (user) {
      fetchUserRank(user.id);
    }
  }, [user, entries]);

  // Countdown timer for next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Reset countdown when data updates
  useEffect(() => {
    setCountdown(60);
  }, [lastUpdated]);

  const handleMetricChange = useCallback((metric: MetricType) => {
    setMetric(metric);
  }, [setMetric]);

  const handlePeriodChange = useCallback((period: Period) => {
    setPeriod(period);
  }, [setPeriod]);

  const formatScore = (score: number, metric: MetricType): string => {
    if (metric === 'holdings' || metric === 'trading') {
      if (score >= 1e9) return `$${(score / 1e9).toFixed(2)}B`;
      if (score >= 1e6) return `$${(score / 1e6).toFixed(2)}M`;
      if (score >= 1e3) return `$${(score / 1e3).toFixed(2)}K`;
      return `$${score.toFixed(2)}`;
    }
    return score.toLocaleString();
  };

  // Skeleton loading component
  const SkeletonRow = () => (
    <div className={styles.skeletonRow}>
      <div className={styles.skeletonRank} />
      <div className={styles.skeletonAvatar} />
      <div className={styles.skeletonUser}>
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLineShort} />
      </div>
      <div className={styles.skeletonScore} />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Leaderboards"
        subtitle="Real-time rankings updated every minute"
      />

      <div className={styles.leaderboards}>
        {/* Live Status Bar */}
        <div className={styles.leaderboards__status}>
          <div className={styles.leaderboards__live}>
            <span className={styles.leaderboards__live_dot} />
            <span>Live</span>
          </div>
          <div className={styles.leaderboards__refresh}>
            Next update in {countdown}s
          </div>
          {lastUpdated && (
            <div className={styles.leaderboards__updated}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.leaderboards__filters}>
          {/* Metric Selector */}
          <div className={styles.segmented}>
            <button
              className={currentMetric === 'holdings' ? styles.active : ''}
              onClick={() => handleMetricChange('holdings')}
            >
              Holdings
            </button>
            <button
              className={currentMetric === 'trading' ? styles.active : ''}
              onClick={() => handleMetricChange('trading')}
            >
              Trading
            </button>
            <button
              className={currentMetric === 'engagement' ? styles.active : ''}
              onClick={() => handleMetricChange('engagement')}
            >
              Engagement
            </button>
          </div>

          {/* Period Selector */}
          <div className={styles.pills}>
            {(['daily', 'weekly', 'monthly', 'all_time'] as Period[]).map(p => (
              <button
                key={p}
                className={currentPeriod === p ? styles.active : ''}
                onClick={() => handlePeriodChange(p)}
              >
                {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {!isLoading && topThree.length >= 3 && (
          <div className={styles.leaderboards__podium}>
            {/* Second Place */}
            <motion.div
              className={`${styles.podium__entry} ${styles['podium__entry--second']}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className={styles.podium__rank}>2</div>
              <Avatar
                src={topThree[1]?.user.avatarUrl}
                alt={topThree[1]?.user.username}
                size="lg"
              />
              <div className={styles.podium__user}>{topThree[1]?.user.username}</div>
              <div className={styles.podium__score}>
                {formatScore(topThree[1]?.score || 0, currentMetric)}
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div
              className={`${styles.podium__entry} ${styles['podium__entry--first']}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <div className={styles.podium__crown}>👑</div>
              <div className={styles.podium__rank}>1</div>
              <Avatar
                src={topThree[0]?.user.avatarUrl}
                alt={topThree[0]?.user.username}
                size="xl"
              />
              <div className={styles.podium__user}>{topThree[0]?.user.username}</div>
              <div className={styles.podium__score}>
                {formatScore(topThree[0]?.score || 0, currentMetric)}
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div
              className={`${styles.podium__entry} ${styles['podium__entry--third']}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={styles.podium__rank}>3</div>
              <Avatar
                src={topThree[2]?.user.avatarUrl}
                alt={topThree[2]?.user.username}
                size="lg"
              />
              <div className={styles.podium__user}>{topThree[2]?.user.username}</div>
              <div className={styles.podium__score}>
                {formatScore(topThree[2]?.score || 0, currentMetric)}
              </div>
            </motion.div>
          </div>
        )}

        {/* User's Rank Card */}
        {userRank && (
          <motion.div
            className={styles.leaderboards__your_rank}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.your_rank__label}>Your Rank</div>
            <div className={styles.your_rank__content}>
              <div className={styles.your_rank__position}>#{userRank.rank}</div>
              <div className={styles.your_rank__score}>
                {formatScore(userRank.score, currentMetric)}
              </div>
              {userRank.change !== 0 && (
                <div className={`${styles.your_rank__change} ${userRank.change > 0 ? styles['your_rank__change--up'] : styles['your_rank__change--down']}`}>
                  {userRank.change > 0 ? '↑' : '↓'} {Math.abs(userRank.change)}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard List */}
        {isLoading ? (
          <div className={styles.loading}>
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.empty__icon}>🏆</span>
            <h3>No rankings yet</h3>
            <p>Be the first to earn a spot on the leaderboard!</p>
          </div>
        ) : (
          <div className={styles.list}>
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.user.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <LeaderboardEntry
                    entry={entry}
                    metric={currentMetric}
                    isCurrentUser={entry.user.id === user?.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Metric Explanation */}
        <div className={styles.leaderboards__info}>
          <h4>How rankings are calculated</h4>
          {currentMetric === 'holdings' && (
            <p>Rankings based on total value of token holdings in connected wallets.</p>
          )}
          {currentMetric === 'trading' && (
            <p>Rankings based on total trading volume across all connected wallets.</p>
          )}
          {currentMetric === 'engagement' && (
            <p>
              Rankings based on platform activity: Posts (10pts), Signals (5pts), Echoes (3pts), Relays (2pts).
            </p>
          )}
        </div>
      </div>
    </>
  );
}
