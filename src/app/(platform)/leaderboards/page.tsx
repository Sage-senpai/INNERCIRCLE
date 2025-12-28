// File: src/app/(platform)/leaderboards/page.tsx
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { LeaderboardEntry } from '@/components/leaderboards/LeaderboardEntry/LeaderboardEntry';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import styles from './page.module.scss';

type MetricType = 'holdings' | 'trading' | 'engagement';
type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardsPage() {
  const [metric, setMetric] = useState<MetricType>('holdings');
  const [period, setPeriod] = useState<Period>('all_time');
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [metric, period]);

  async function loadLeaderboard() {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockEntries = Array.from({ length: 50 }, (_, i) => ({
      rank: i + 1,
      user: {
        id: `user-${i}`,
        username: `trader${i}`,
        displayName: `Trader ${i}`,
        avatarUrl: null,
      },
      score: Math.floor(Math.random() * 1000000) + 100000,
      change: Math.floor(Math.random() * 40) - 20,
    }));

    setEntries(mockEntries);
    setIsLoading(false);
  }

  // Inline Skeleton Row Component
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
        subtitle="Top performers across holdings, trading volume, and community engagement"
      />
      
      <div className={styles.leaderboards}>
        <div className={styles.leaderboards__filters}>
          {/* Modern Segmented Control for Metrics */}
          <div className={styles.segmented}>
            <button 
              className={metric === 'holdings' ? styles.active : ''} 
              onClick={() => setMetric('holdings')}
            >
              Holdings
            </button>
            <button 
              className={metric === 'trading' ? styles.active : ''} 
              onClick={() => setMetric('trading')}
            >
              Trading
            </button>
            <button 
              className={metric === 'engagement' ? styles.active : ''} 
              onClick={() => setMetric('engagement')}
            >
              Engagement
            </button>
          </div>

          {/* Pill Buttons for Periods */}
          <div className={styles.pills}>
            {(['daily', 'weekly', 'monthly', 'all_time'] as Period[]).map(p => (
              <button
                key={p}
                className={period === p ? styles.active : ''}
                onClick={() => setPeriod(p)}
              >
                {p.replace('_', ' ').charAt(0).toUpperCase() + p.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
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
                  <LeaderboardEntry entry={entry} metric={metric} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}