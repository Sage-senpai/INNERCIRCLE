// File: src/app/(platform)/profile/[username]/page.tsx
// ============================================================================

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Feed } from '@/components/feed/Feed/Feed';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { useAuthStore } from '@/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import styles from './page.module.scss';

interface ProfileUser {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface ProfileStats {
  postCount: number;
  satelliteCount: number;
  orbitingCount: number;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user: currentUser, updateUserProfile } = useAuthStore();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ postCount: 0, satelliteCount: 0, orbitingCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
  });
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    loadUser();
  }, [username]);

  async function loadUser() {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch user from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          setError('User not found');
        } else {
          setError(userError.message);
        }
        setIsLoading(false);
        return;
      }

      setProfileUser(user);
      setEditForm({
        displayName: user.display_name || '',
        bio: user.bio || '',
      });

      // Fetch stats
      const [postsResult, satellitesResult, orbitingResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('orbits').select('id', { count: 'exact', head: true }).eq('center_id', user.id),
        supabase.from('orbits').select('id', { count: 'exact', head: true }).eq('satellite_id', user.id),
      ]);

      setStats({
        postCount: postsResult.count || 0,
        satelliteCount: satellitesResult.count || 0,
        orbitingCount: orbitingResult.count || 0,
      });

    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!profileUser || !isOwnProfile) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          display_name: editForm.displayName || null,
          bio: editForm.bio || null,
        })
        .eq('id', profileUser.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Update local state
      setProfileUser({
        ...profileUser,
        display_name: editForm.displayName || null,
        bio: editForm.bio || null,
      });

      // Update auth store
      updateUserProfile({
        displayName: editForm.displayName || undefined,
        bio: editForm.bio || undefined,
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFollow() {
    if (!currentUser || !profileUser || isOwnProfile) return;

    try {
      const { error } = await supabase
        .from('orbits')
        .insert({
          center_id: profileUser.id,
          satellite_id: currentUser.id,
        });

      if (error) {
        if (error.code === '23505') {
          // Already following, unfollow
          await supabase
            .from('orbits')
            .delete()
            .eq('center_id', profileUser.id)
            .eq('satellite_id', currentUser.id);

          setStats(prev => ({ ...prev, satelliteCount: prev.satelliteCount - 1 }));
        } else {
          console.error('Follow error:', error);
        }
      } else {
        setStats(prev => ({ ...prev, satelliteCount: prev.satelliteCount + 1 }));
      }
    } catch (err) {
      console.error('Error following:', err);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Loading..." />
        <div className={styles.profile__loading}>
          <LoadingSpinner variant="lock" size="lg" />
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  if (error || !profileUser) {
    return (
      <>
        <PageHeader title="Not Found" />
        <div className={styles.profile__loading}>
          <p>{error || 'User not found'}</p>
          <Button variant="secondary" onClick={() => router.push('/feed')}>
            Go to Feed
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`@${profileUser.username}`} />

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
            <Avatar src={profileUser.avatar_url} alt={profileUser.username} size="xl" />
          </motion.div>

          <div className={styles.profile__info}>
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  className={styles.profile__edit_form}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <input
                    type="text"
                    className={styles.profile__edit_input}
                    placeholder="Display Name"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  />
                  <textarea
                    className={styles.profile__edit_textarea}
                    placeholder="Bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                  />
                  {error && <p className={styles.profile__error}>{error}</p>}
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h1 className={styles.profile__name}>
                    {profileUser.display_name || profileUser.username}
                  </h1>
                  <p className={styles.profile__username}>@{profileUser.username}</p>
                  {profileUser.bio && (
                    <p className={styles.profile__bio}>{profileUser.bio}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={styles.profile__actions}>
            {isOwnProfile ? (
              isEditing ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSaveProfile} isLoading={isSaving}>
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="md" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )
            ) : (
              <Button variant="primary" size="md" onClick={handleFollow}>
                Follow
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          className={styles.profile__stats}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>{stats.postCount}</span>
            <span className={styles.profile__stat_label}>Broadcasts</span>
          </div>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>{stats.satelliteCount}</span>
            <span className={styles.profile__stat_label}>Satellites</span>
          </div>
          <div className={styles.profile__stat}>
            <span className={styles.profile__stat_value}>{stats.orbitingCount}</span>
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
          <Feed authorId={profileUser.id} />
        </motion.div>
      </div>
    </>
  );
}
