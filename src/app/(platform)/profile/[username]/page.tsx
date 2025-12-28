// File: src/app/(platform)/profile/[username]/page.tsx
// ============================================================================

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Feed } from '@/components/feed/Feed/Feed';
import styles from './page.module.scss';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [username]);

  async function loadUser() {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setUser({
      id: 'user-1',
      username: username,
      displayName: `${username.charAt(0).toUpperCase()}${username.slice(1)}`,
      bio: 'Web3 enthusiast | Token holder | Community builder | Memecoin maximalist',
      avatarUrl: null,
      role: 'member',
      satelliteCount: 234,
      orbitingCount: 123,
      postCount: 45,
    });
    
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Loading..." />
        <div className={styles.profile__loading}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            Loading profile...
          </motion.div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageHeader title="Not Found" />
        <div className={styles.profile__loading}>User not found</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`@${user.username}`} />
      
      <div className={styles.profile}>
        <motion.div 
          className={styles.profile__header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <Avatar src={user.avatarUrl} alt={user.username} size="xl" />
          </motion.div>
          
          <div className={styles.profile__info}>
            <h1 className={styles.profile__name}>{user.displayName}</h1>
            <p className={styles.profile__username}>@{user.username}</p>
            {user.bio && (
              <p className={styles.profile__bio}>{user.bio}</p>
            )}
          </div>

          <div className={styles.profile__actions}>
            <Button variant="secondary" size="md">
              Edit Profile
            </Button>
          </div>
        </motion.div>

        <motion.div 
          className={styles.profile__stats}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>{user.postCount}</span>
            <span className={styles.profile__stat_label}>Broadcasts</span>
          </div>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>{user.satelliteCount}</span>
            <span className={styles.profile__stat_label}>Satellites</span>
          </div>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>{user.orbitingCount}</span>
            <span className={styles.profile__stat_label}>Orbiting</span>
          </div>
        </motion.div>

        <motion.div 
          className={styles.profile__content}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={styles.profile__content_title}>Broadcasts</h2>
          <div className={styles.profile__empty}>
            <p>No broadcasts yet</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}