// File: src/components/leaderboards/LeaderboardEntry/LeaderboardEntry.tsx
// ============================================================================
// Individual leaderboard entry with real-time updates
// ============================================================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import type { LeaderboardEntry as LeaderboardEntryType, MetricType } from '@/store/leaderboard.store';
import styles from './LeaderboardEntry.module.scss';

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  metric: MetricType;
  isCurrentUser?: boolean;
}

export function LeaderboardEntry({ entry, metric, isCurrentUser }: LeaderboardEntryProps) {
  const getRankClass = (rank: number) => {
    if (rank === 1) return styles['entry--gold'];
    if (rank === 2) return styles['entry--silver'];
    if (rank === 3) return styles['entry--bronze'];
    return '';
  };

  const formatScore = (score: number) => {
    if (metric === 'holdings' || metric === 'trading') {
      if (score >= 1e9) return `$${(score / 1e9).toFixed(2)}B`;
      if (score >= 1e6) return `$${(score / 1e6).toFixed(2)}M`;
      if (score >= 1e3) return `$${(score / 1e3).toFixed(1)}K`;
      return `$${score.toFixed(2)}`;
    }
    return score.toLocaleString();
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getMetricDetail = () => {
    switch (metric) {
      case 'holdings':
        return entry.metrics.holdingsValue
          ? `Value: ${formatScore(entry.metrics.holdingsValue)}`
          : null;
      case 'trading':
        return entry.metrics.tradingVolume
          ? `Volume: ${formatScore(entry.metrics.tradingVolume)}`
          : null;
      case 'engagement':
        const { postCount = 0, signalCount = 0, echoCount = 0 } = entry.metrics;
        return `${postCount} posts · ${signalCount} signals · ${echoCount} echoes`;
      default:
        return null;
    }
  };

  return (
    <Link href={`/profile/${entry.user.username}`}>
      <motion.div
        className={`${styles.entry} ${getRankClass(entry.rank)} ${isCurrentUser ? styles['entry--current'] : ''}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.entry__rank}>
          {getRankEmoji(entry.rank) || `#${entry.rank}`}
        </div>

        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Avatar
            src={entry.user.avatarUrl}
            alt={entry.user.username}
            size="md"
          />
        </motion.div>

        <div className={styles.entry__user}>
          <span className={styles.entry__name}>
            {entry.user.displayName || entry.user.username}
            {isCurrentUser && <span className={styles.entry__you}>(You)</span>}
          </span>
          <span className={styles.entry__username}>
            @{entry.user.username}
          </span>
          {getMetricDetail() && (
            <span className={styles.entry__detail}>
              {getMetricDetail()}
            </span>
          )}
        </div>

        <div className={styles.entry__score}>
          <span className={styles.entry__score_value}>
            {formatScore(entry.score)}
          </span>
          {entry.change !== undefined && entry.change !== 0 && (
            <motion.span
              className={`${styles.entry__change} ${
                entry.change > 0 ? styles['entry__change--up'] : styles['entry__change--down']
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              {entry.change > 0 ? <TrendUpIcon /> : <TrendDownIcon />}
              {Math.abs(entry.change)}
            </motion.span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
