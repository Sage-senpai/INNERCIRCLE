// File: src/components/leaderboards/LeaderboardEntry/LeaderboardEntry.tsx
// ============================================================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import styles from './LeaderboardEntry.module.scss';

interface LeaderboardEntryProps {
  entry: {
    rank: number;
    user: {
      id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string | null;
    };
    score: number;
    change?: number;
  };
  metric: 'holdings' | 'trading' | 'engagement';
}

export function LeaderboardEntry({ entry, metric }: LeaderboardEntryProps) {
  const getRankClass = (rank: number) => {
    if (rank === 1) return styles['entry--gold'];
    if (rank === 2) return styles['entry--silver'];
    if (rank === 3) return styles['entry--bronze'];
    return '';
  };

 

  const formatScore = (score: number) => {
    if (metric === 'holdings') {
      return `$${(score / 1000).toFixed(1)}K`;
    }
    return score.toLocaleString();
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };
   // Add medal badges for top 3
const getMedal = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
};
  return (
    <Link href={`/profile/${entry.user.username}`}>
      <motion.div 
        className={`${styles.entry} ${getRankClass(entry.rank)}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4, scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.entry__rank}>
          {getRankEmoji(entry.rank) || entry.rank}
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
          </span>
          <span className={styles.entry__username}>
            @{entry.user.username}
          </span>
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