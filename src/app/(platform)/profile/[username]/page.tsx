// File: src/app/(platform)/profile/[username]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Feed } from '@/components/feed/Feed/Feed';
import styles from './page.module.scss';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, [username]);

  async function loadUser() {
    // Simulated user fetch
    setUser({
      id: 'user-1',
      username: username,
      displayName: `${username.charAt(0).toUpperCase()}${username.slice(1)}`,
      bio: 'Web3 enthusiast | Token holder | Community builder',
      avatarUrl: null,
      role: 'member',
    });
  }

  if (!user) {
    return (
      <>
        <PageHeader title="Loading..." />
        <div className={styles.profile__loading}>Loading profile...</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`@${user.username}`} />
      
      <div className={styles.profile}>
        <div className={styles.profile__header}>
          <Avatar src={user.avatarUrl} alt={user.username} size="xl" />
          
          <div className={styles.profile__info}>
            <h1 className={styles.profile__name}>{user.displayName}</h1>
            <p className={styles.profile__username}>@{user.username}</p>
            {user.bio && (
              <p className={styles.profile__bio}>{user.bio}</p>
            )}
          </div>

          <div className={styles.profile__actions}>
            <Button variant="secondary">Edit Profile</Button>
          </div>
        </div>

        <div className={styles.profile__stats}>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>0</span>
            <span className={styles.profile__stat_label}>Posts</span>
          </div>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>0</span>
            <span className={styles.profile__stat_label}>Satellites</span>
          </div>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>0</span>
            <span className={styles.profile__stat_label}>Orbiting</span>
          </div>
        </div>

        <div className={styles.profile__content}>
          <h2 className={styles.profile__content_title}>Posts</h2>
          <div className={styles.profile__empty}>
            No posts yet
          </div>
        </div>
      </div>
    </>
  );
}
