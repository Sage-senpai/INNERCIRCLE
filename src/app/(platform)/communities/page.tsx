// File: src/app/(platform)/communities/page.tsx
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { CommunityCard } from '@/components/communities/CommunityCard/CommunityCard';
import { Button } from '@/components/ui/Button/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import styles from './page.module.scss';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'joined' | 'available'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommunities();
  }, [filter]);

  async function loadCommunities() {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockCommunities = [
      {
        id: '1',
        slug: 'bonk-holders',
        name: 'BONK Holders',
        description: 'Official community for BONK token holders. Join the pack and stay updated on the latest BONK developments.',
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
        description: 'For the most dedicated PEPE holders. Exclusive content and alpha only.',
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
        description: 'Much wow, such community. The original meme coin community on InnerCircle.',
        tokenAddress: 'DOGE123456789',
        chain: 'solana',
        memberCount: 42069,
        postCount: 12000,
        avatarUrl: null,
        isMember: true,
        tier: 'holder',
      },
      {
        id: '4',
        slug: 'shib-army',
        name: 'SHIB Army',
        description: 'The Shiba Inu community hub. Strategy, memes, and everything SHIB.',
        tokenAddress: 'SHIB987654321',
        chain: 'solana',
        memberCount: 23456,
        postCount: 5670,
        avatarUrl: null,
        isMember: false,
        tier: null,
      },
      {
        id: '5',
        slug: 'wif-collective',
        name: 'WIF Collective',
        description: 'Dog wif hat holders unite. Exclusive broadcasts and community events.',
        tokenAddress: 'WIF1234567890',
        chain: 'solana',
        memberCount: 11234,
        postCount: 2890,
        avatarUrl: null,
        isMember: true,
        tier: 'elite',
      },
    ];

    setCommunities(mockCommunities);
    setIsLoading(false);
  }

  const filteredCommunities = communities.filter(c => {
    if (filter === 'joined') return c.isMember;
    if (filter === 'available') return !c.isMember;
    return true;
  });

  return (
    <>
      <PageHeader 
        title="Communities" 
        subtitle="Token-gated communities powered by on-chain ownership"
      />
      
      <div className={styles.communities}>
        <motion.div 
          className={styles.communities__filters}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            onClick={() => setFilter('all')}
          >
            All Communities
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
        </motion.div>

        {isLoading ? (
          <div className={styles.communities__loading}>
            <LoadingSpinner size="lg" variant="lock" />
          </div>
        ) : (
          <div className={styles.communities__grid}>
            <AnimatePresence mode="popLayout">
              {filteredCommunities.map((community, index) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <CommunityCard community={community} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && filteredCommunities.length === 0 && (
          <motion.div 
            className={styles.communities__empty}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>No communities found</p>
          </motion.div>
        )}
      </div>
    </>
  );
}
