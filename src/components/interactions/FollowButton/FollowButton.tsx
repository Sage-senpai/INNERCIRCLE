// File: src/components/interactions/FollowButton/FollowButton.tsx
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import { useAuthStore } from '@/store/auth.store';
import { followUser, unfollowUser, checkFollowStatus } from '@/lib/supabase/actions';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FollowButton({ targetUserId, targetUsername, size = 'md' }: FollowButtonProps) {
  const { user } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFollowStatus();
    }
  }, [user, targetUserId]);

  async function loadFollowStatus() {
    if (!user) return;
    try {
      const status = await checkFollowStatus(user.id, targetUserId);
      setIsFollowing(status);
    } catch (error) {
      console.error('Failed to load follow status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFollow() {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id, targetUserId);
        setIsFollowing(false);
      } else {
        await followUser(user.id, targetUserId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user || user.id === targetUserId) {
    return null;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant={isFollowing ? 'secondary' : 'primary'}
        size={size}
        onClick={handleFollow}
        isLoading={isLoading}
      >
        {isFollowing ? 'Orbiting' : 'Orbit'}
      </Button>
    </motion.div>
  );
}
