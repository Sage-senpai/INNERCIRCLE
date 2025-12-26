// File: src/app/(platform)/communities/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { CommunityCard } from '@/components/communities/CommunityCard/CommunityCard';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'joined' | 'available'>('all');

  useEffect(() => {
    loadCommunities();
  }, [filter]);

  async function loadCommunities() {
    // Simulated data fetch
    const mockCommunities = [
      {
        id: '1',
        slug: 'bonk-holders',
        name: 'BONK Holders',
        description: 'Official community for BONK token holders',
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        chain: 'solana',
        memberCount: 15420,
        postCount: 3240,
        avatarUrl: null,
        isMember: true,
        tier: 'whale',
      },
      {
        id: '2',
        slug: 'pepe-elites',
        name: 'PEPE Elites',
        description: 'For the most dedicated PEPE holders',
        tokenAddress: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        chain: 'ethereum',
        memberCount: 8932,
        postCount: 1876,
        avatarUrl: null,
        isMember: false,
        tier: null,
      },
      {
        id: '3',
        slug: 'doge-maximalists',
        name: 'DOGE Maximalists',
        description: 'Much wow, such community',
        tokenAddress: 'DOGE123...',
        chain: 'solana',
        memberCount: 42069,
        postCount: 12000,
        avatarUrl: null,
        isMember: true,
        tier: 'holder',
      },
    ];

    setCommunities(mockCommunities);
  }

  const filteredCommunities = communities.filter(c => {
    if (filter === 'joined') return c.isMember;
    if (filter === 'available') return !c.isMember;
    return true;
  });

  return (
    <>
      <PageHeader title="Communities" />
      
      <div className={styles.communities}>
        <div className={styles.communities__filters}>
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'joined' ? 'primary' : 'ghost'}
            onClick={() => setFilter('joined')}
          >
            Joined
          </Button>
          <Button
            variant={filter === 'available' ? 'primary' : 'ghost'}
            onClick={() => setFilter('available')}
          >
            Available
          </Button>
        </div>

        <div className={styles.communities__grid}>
          {filteredCommunities.map((community) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CommunityCard community={community} />
            </motion.div>
          ))}
        </div>

        {filteredCommunities.length === 0 && (
          <div className={styles.communities__empty}>
            <p>No communities found</p>
          </div>
        )}
      </div>
    </>
  );
}
