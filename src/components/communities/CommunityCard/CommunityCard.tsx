// File: src/components/communities/CommunityCard/CommunityCard.tsx
// ============================================================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import styles from './CommunityCard.module.scss';

interface CommunityCardProps {
  community: {
    id: string;
    slug: string;
    name: string;
    description: string;
    tokenAddress: string;
    chain: string;
    memberCount: number;
    postCount: number;
    avatarUrl?: string | null;
    isMember: boolean;
    tier?: string | null;
  };
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link href={`/communities/${community.slug}`}>
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.card__header}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Avatar
              src={community.avatarUrl}
              alt={community.name}
              size="lg"
            />
          </motion.div>
          {community.isMember && community.tier && (
            <motion.div 
              className={styles.card__badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            >
              {community.tier.toUpperCase()}
            </motion.div>
          )}
        </div>

        <div className={styles.card__body}>
          <h3 className={styles.card__title}>{community.name}</h3>
          <p className={styles.card__description}>{community.description}</p>

          <div className={styles.card__stats}>
            <div className={styles.card__stat}>
              <span className={styles.card__stat_value}>
                {formatNumber(community.memberCount)}
              </span>
              <span className={styles.card__stat_label}>Members</span>
            </div>
            <div className={styles.card__stat}>
              <span className={styles.card__stat_value}>
                {formatNumber(community.postCount)}
              </span>
              <span className={styles.card__stat_label}>Broadcasts</span>
            </div>
          </div>
        </div>

        <div className={styles.card__footer}>
          <div className={styles.card__token}>
            <span className={styles.card__token_label}>Token:</span>
            <span className={styles.card__token_address}>
              {community.tokenAddress.slice(0, 6)}...{community.tokenAddress.slice(-4)}
            </span>
          </div>
          
          {community.isMember ? (
            <Button variant="unlocked" size="sm">
              Joined
            </Button>
          ) : (
            <Button variant="locked" size="sm">
              View Access
            </Button>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
