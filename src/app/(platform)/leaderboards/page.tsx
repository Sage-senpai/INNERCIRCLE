// File: src/app/(platform)/leaderboards/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { LeaderboardEntry } from '@/components/leaderboards/LeaderboardEntry/LeaderboardEntry';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

type MetricType = 'holdings' | 'trading' | 'engagement';
type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardsPage() {
  const [metric, setMetric] = useState<MetricType>('holdings');
  const [period, setPeriod] = useState<Period>('all_time');
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, [metric, period]);

  async function loadLeaderboard() {
    // Simulated leaderboard data
    const mockEntries = Array.from({ length: 50 }, (_, i) => ({
      rank: i + 1,
      user: {
        id: `user-${i}`,
        username: `user${i}`,
        displayName: `User ${i}`,
        avatarUrl: null,
      },
      score: Math.floor(Math.random() * 1000000),
      change: Math.floor(Math.random() * 20) - 10,
    }));

    setEntries(mockEntries);
  }

  return (
    <>
      <PageHeader title="Leaderboards" />
      
      <div className={styles.leaderboards}>
        <div className={styles.leaderboards__controls}>
          <div className={styles.leaderboards__metrics}>
            <Button
              variant={metric === 'holdings' ? 'primary' : 'ghost'}
              onClick={() => setMetric('holdings')}
            >
              Holdings
            </Button>
            <Button
              variant={metric === 'trading' ? 'primary' : 'ghost'}
              onClick={() => setMetric('trading')}
            >
              Trading
            </Button>
            <Button
              variant={metric === 'engagement' ? 'primary' : 'ghost'}
              onClick={() => setMetric('engagement')}
            >
              Engagement
            </Button>
          </div>

          <div className={styles.leaderboards__periods}>
            <Button
              variant={period === 'daily' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('daily')}
            >
              Daily
            </Button>
            <Button
              variant={period === 'weekly' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={period === 'monthly' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={period === 'all_time' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('all_time')}
            >
              All Time
            </Button>
          </div>
        </div>

        <div className={styles.leaderboards__list}>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <LeaderboardEntry entry={entry} metric={metric} />
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}