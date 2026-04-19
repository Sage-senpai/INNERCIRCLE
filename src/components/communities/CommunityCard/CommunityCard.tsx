// File: src/components/communities/CommunityCard/CommunityCard.tsx
// ============================================================================

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import styles from './CommunityCard.module.scss';

interface CommunityCardProps {
  community: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    // Support both camelCase and snake_case
    tokenAddress?: string | null;
    token_address?: string | null;
    chain?: string | null;
    memberCount?: number;
    member_count?: number;
    postCount?: number;
    post_count?: number;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    access_type?: string;
    isMember?: boolean;
    tier?: string | null;
  };
}

export function CommunityCard({ community }: CommunityCardProps) {
  // Normalize properties to handle both camelCase and snake_case
  const avatarUrl = community.avatarUrl ?? community.avatar_url;
  const tokenAddress = community.tokenAddress ?? community.token_address;
  const memberCount = community.memberCount ?? community.member_count ?? 0;
  const postCount = community.postCount ?? community.post_count ?? 0;
  const accessType = community.access_type ?? 'token_gated';
  const isOpenCommunity = accessType === 'open';

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
          {/* Server icon — Discord-style square with rounded corners */}
          <div className={styles.card__server_icon}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={community.name} />
            ) : (
              <span>{community.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.card__header_meta}>
            <h3 className={styles.card__title} title={community.name}>{community.name}</h3>
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
        </div>

        <div className={styles.card__body}>
          <p className={styles.card__description}>{community.description || 'No description'}</p>

          <div className={styles.card__stats}>
            <div className={styles.card__stat}>
              <span className={styles.card__stat_value}>
                {formatNumber(memberCount)}
              </span>
              <span className={styles.card__stat_label}>Members</span>
            </div>
            <div className={styles.card__stat}>
              <span className={styles.card__stat_value}>
                {formatNumber(postCount)}
              </span>
              <span className={styles.card__stat_label}>Broadcasts</span>
            </div>
          </div>
        </div>

        <div className={styles.card__footer}>
          {tokenAddress ? (
            <div className={styles.card__token}>
              <span className={styles.card__token_label}>Token:</span>
              <span className={styles.card__token_address}>
                {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <div className={styles.card__token}>
              <span className={styles.card__token_label}>
                {isOpenCommunity ? '🌐 Open Community' : '🔒 Invite Only'}
              </span>
            </div>
          )}

          {community.isMember ? (
            <Button variant="unlocked" size="sm">
              Joined
            </Button>
          ) : (
            <Button variant="locked" size="sm">
              {isOpenCommunity ? 'Join' : 'View Access'}
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
