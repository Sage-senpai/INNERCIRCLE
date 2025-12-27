// File: src/components/leaderboards/LeaderboardEntry/LeaderboardEntry.tsx

import Link from 'next/link';
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

  return (
    <Link href={`/profile/${entry.user.username}`}>
      <div className={`${styles.entry} ${getRankClass(entry.rank)}`}>
        <div className={styles.entry__rank}>
          {entry.rank}
        </div>

        <Avatar
          src={entry.user.avatarUrl}
          alt={entry.user.username}
          size="md"
        />

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
            <span className={`${styles.entry__change} ${
              entry.change > 0 ? styles['entry__change--up'] : styles['entry__change--down']
            }`}>
              {entry.change > 0 ? <TrendUpIcon /> : <TrendDownIcon />}
              {Math.abs(entry.change)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}