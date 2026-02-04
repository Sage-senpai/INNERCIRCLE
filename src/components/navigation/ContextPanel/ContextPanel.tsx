// File: src/components/navigation/ContextPanel/ContextPanel.tsx
// ============================================================================
// Context panel with real-time leaderboard data
// ============================================================================

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import { useLeaderboardStore } from '@/store/leaderboard.store';
import styles from './ContextPanel.module.scss';

export function ContextPanel() {
  const pathname = usePathname();

  // Determine what to show based on current page
  const getContextContent = () => {
    if (pathname.startsWith('/communities/')) {
      return <CommunityContext />;
    }
    if (pathname === '/feed' || pathname === '/') {
      return <FeedContext />;
    }
    if (pathname === '/leaderboards') {
      return <LeaderboardContext />;
    }
    if (pathname === '/intelligence') {
      return <IntelligenceContext />;
    }
    return <DefaultContext />;
  };

  return (
    <aside className={styles.context}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {getContextContent()}
      </motion.div>
    </aside>
  );
}

function FeedContext() {
  const { topThree, isLoading, lastUpdated, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    // Fetch engagement leaderboard for the feed context
    fetchLeaderboard('engagement', 'daily');
  }, [fetchLeaderboard]);

  const formatScore = (score: number): string => {
    if (score >= 1e6) return `${(score / 1e6).toFixed(1)}M`;
    if (score >= 1e3) return `${(score / 1e3).toFixed(1)}K`;
    return score.toString();
  };

  return (
    <>
      <div className={styles.context__section}>
        <div className={styles.context__header}>
          <h3 className={styles.context__title}>Top Engagers Today</h3>
          {lastUpdated && (
            <span className={styles.context__live}>
              <span className={styles.context__live_dot} />
              Live
            </span>
          )}
        </div>
        <div className={styles.context__list}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.context__skeleton} />
            ))
          ) : topThree.length > 0 ? (
            topThree.map((entry, i) => (
              <motion.div
                key={entry.user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/profile/${entry.user.username}`}>
                  <div className={styles.context__leader}>
                    <span className={styles.context__leader_rank}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </span>
                    <Avatar src={entry.user.avatarUrl} alt={entry.user.username} size="sm" />
                    <div className={styles.context__leader_info}>
                      <span className={styles.context__leader_name}>{entry.user.username}</span>
                      <span className={styles.context__leader_score}>
                        {formatScore(entry.score)} pts
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <p className={styles.context__empty}>No activity yet today</p>
          )}
        </div>
        <Link href="/leaderboards" className={styles.context__view_all}>
          View full leaderboard →
        </Link>
      </div>

      <div className={styles.context__section}>
        <h3 className={styles.context__title}>Trending Communities</h3>
        <div className={styles.context__list}>
          {[
            { name: 'BONK Holders', members: '15.4K', change: +12, slug: 'bonk-holders' },
            { name: 'JUP Traders', members: '8.9K', change: +8, slug: 'jup-traders' },
            { name: 'SOL Whales', members: '11.2K', change: +15, slug: 'sol-whales' },
          ].map((community, i) => (
            <motion.div
              key={community.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link href={`/communities/${community.slug}`}>
                <div className={styles.context__item}>
                  <div className={styles.context__item_info}>
                    <span className={styles.context__item_name}>{community.name}</span>
                    <span className={styles.context__item_meta}>{community.members} members</span>
                  </div>
                  <div className={`${styles.context__item_change} ${
                    community.change > 0 ? styles['context__item_change--up'] : ''
                  }`}>
                    {community.change > 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                    {Math.abs(community.change)}%
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

function CommunityContext() {
  const { topThree, fetchLeaderboard, isLoading } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard('holdings', 'all_time');
  }, [fetchLeaderboard]);

  const formatScore = (score: number): string => {
    if (score >= 1e6) return `$${(score / 1e6).toFixed(1)}M`;
    if (score >= 1e3) return `$${(score / 1e3).toFixed(1)}K`;
    return `$${score.toFixed(0)}`;
  };

  return (
    <>
      <div className={styles.context__section}>
        <h3 className={styles.context__title}>Top Holders</h3>
        <div className={styles.context__list}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.context__skeleton} />
            ))
          ) : topThree.length > 0 ? (
            topThree.map((entry, i) => (
              <motion.div
                key={entry.user.id}
                className={styles.context__leader}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className={styles.context__leader_rank}>#{entry.rank}</span>
                <Avatar src={entry.user.avatarUrl} alt={entry.user.username} size="sm" />
                <div className={styles.context__leader_info}>
                  <span className={styles.context__leader_name}>{entry.user.username}</span>
                  <span className={styles.context__leader_score}>
                    {formatScore(entry.score)}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <p className={styles.context__empty}>No holders data</p>
          )}
        </div>
      </div>
    </>
  );
}

function LeaderboardContext() {
  const { lastUpdated, currentMetric, currentPeriod } = useLeaderboardStore();

  return (
    <div className={styles.context__section}>
      <h3 className={styles.context__title}>Ranking Info</h3>
      <div className={styles.context__info}>
        <div className={styles.context__info_item}>
          <span className={styles.context__info_label}>Current View</span>
          <span className={styles.context__info_value}>
            {currentMetric.charAt(0).toUpperCase() + currentMetric.slice(1)} · {currentPeriod.replace('_', ' ')}
          </span>
        </div>
        <div className={styles.context__info_item}>
          <span className={styles.context__info_label}>Refresh Rate</span>
          <span className={styles.context__info_value}>Every minute</span>
        </div>
        {lastUpdated && (
          <div className={styles.context__info_item}>
            <span className={styles.context__info_label}>Last Updated</span>
            <span className={styles.context__info_value}>{lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
      <div className={styles.context__metrics}>
        <h4>Score Calculation</h4>
        <ul>
          <li>Posts: 10 points</li>
          <li>Signals: 5 points</li>
          <li>Echoes: 3 points</li>
          <li>Relays: 2 points</li>
        </ul>
      </div>
    </div>
  );
}

function IntelligenceContext() {
  return (
    <div className={styles.context__section}>
      <h3 className={styles.context__title}>Data Sources</h3>
      <div className={styles.context__info}>
        <div className={styles.context__source}>
          <span className={styles.context__source_name}>DexScreener</span>
          <span className={styles.context__source_desc}>Price, volume, liquidity data</span>
        </div>
        <div className={styles.context__source}>
          <span className={styles.context__source_name}>Jupiter</span>
          <span className={styles.context__source_desc}>Real-time prices</span>
        </div>
      </div>
      <p className={styles.context__note}>
        Data refreshes every 60 seconds for accurate market information.
      </p>
    </div>
  );
}

function DefaultContext() {
  const { entries, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    if (entries.length === 0) {
      fetchLeaderboard('engagement', 'all_time');
    }
  }, [entries.length, fetchLeaderboard]);

  return (
    <div className={styles.context__section}>
      <h3 className={styles.context__title}>Platform Stats</h3>
      <div className={styles.context__stats}>
        <div className={styles.context__stat}>
          <span className={styles.context__stat_value}>{entries.length || '—'}</span>
          <span className={styles.context__stat_label}>Active Users</span>
        </div>
        <div className={styles.context__stat}>
          <span className={styles.context__stat_value}>
            {entries.reduce((sum, e) => sum + (e.metrics.postCount || 0), 0) || '—'}
          </span>
          <span className={styles.context__stat_label}>Total Posts</span>
        </div>
      </div>
      <Link href="/leaderboards" className={styles.context__view_all}>
        View leaderboards →
      </Link>
    </div>
  );
}
