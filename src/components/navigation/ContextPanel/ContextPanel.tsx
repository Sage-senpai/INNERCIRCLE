// File: src/components/navigation/ContextPanel/ContextPanel.tsx
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
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
  const trendingCommunities = [
    { name: 'BONK Holders', members: '15.4K', change: +12, slug: 'bonk-holders' },
    { name: 'PEPE Elites', members: '8.9K', change: +8, slug: 'pepe-elites' },
    { name: 'WIF Collective', members: '11.2K', change: +15, slug: 'wif-collective' },
  ];

  const tokenMovers = [
    { symbol: 'BONK', change: +23.4, volume: '$2.3M' },
    { symbol: 'PEPE', change: -5.2, volume: '$1.8M' },
    { symbol: 'WIF', change: +15.8, volume: '$3.1M' },
  ];

  return (
    <>
      <div className={styles.context__section}>
        <h3 className={styles.context__title}>Trending Communities</h3>
        <div className={styles.context__list}>
          {trendingCommunities.map((community, i) => (
            <motion.div
              key={community.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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

      <div className={styles.context__section}>
        <h3 className={styles.context__title}>Token Movers</h3>
        <div className={styles.context__list}>
          {tokenMovers.map((token, i) => (
            <motion.div
              key={token.symbol}
              className={styles.context__token}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className={styles.context__token_info}>
                <span className={styles.context__token_symbol}>{token.symbol}</span>
                <span className={styles.context__token_volume}>{token.volume}</span>
              </div>
              <div className={`${styles.context__token_change} ${
                token.change > 0 ? styles['context__token_change--up'] : styles['context__token_change--down']
              }`}>
                {token.change > 0 ? '+' : ''}{token.change}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

function CommunityContext() {
  const leaderboard = [
    { rank: 1, username: 'whale_trader', score: 250000 },
    { rank: 2, username: 'crypto_king', score: 180000 },
    { rank: 3, username: 'token_master', score: 145000 },
  ];

  return (
    <>
      <div className={styles.context__section}>
        <h3 className={styles.context__title}>Community Leaderboard</h3>
        <div className={styles.context__list}>
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.username}
              className={styles.context__leader}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className={styles.context__leader_rank}>#{entry.rank}</span>
              <Avatar src={null} alt={entry.username} size="sm" />
              <div className={styles.context__leader_info}>
                <span className={styles.context__leader_name}>{entry.username}</span>
                <span className={styles.context__leader_score}>
                  ${(entry.score / 1000).toFixed(1)}K
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

function LeaderboardContext() {
  return (
    <div className={styles.context__section}>
      <h3 className={styles.context__title}>Ranking Info</h3>
      <div className={styles.context__info}>
        <p>Rankings update every 24 hours based on holdings, trading volume, and engagement.</p>
      </div>
    </div>
  );
}

function DefaultContext() {
  return (
    <div className={styles.context__section}>
      <h3 className={styles.context__title}>Quick Stats</h3>
      <div className={styles.context__stats}>
        <div className={styles.context__stat}>
          <span className={styles.context__stat_value}>1,234</span>
          <span className={styles.context__stat_label}>Active Users</span>
        </div>
        <div className={styles.context__stat}>
          <span className={styles.context__stat_value}>45</span>
          <span className={styles.context__stat_label}>Communities</span>
        </div>
      </div>
    </div>
  );
}