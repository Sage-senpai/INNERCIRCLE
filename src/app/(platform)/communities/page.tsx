// File: src/app/(platform)/communities/page.tsx
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { CommunityCard } from '@/components/communities/CommunityCard/CommunityCard';
import { Button } from '@/components/ui/Button/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { CreateCommunityModal } from '@/components/interactions/CreateCommunityModal/CreateCommunityModal';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth.store';
import styles from './page.module.scss';

interface CommunityData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  token_address: string | null;
  chain: string | null;
  member_count: number;
  post_count: number;
  avatar_url: string | null;
  access_type: string;
  isMember?: boolean;
  tier?: string | null;
}

export default function CommunitiesPage() {
  const { user } = useAuthStore();
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [filter, setFilter] = useState<'all' | 'joined' | 'available'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadCommunities = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch all communities from Supabase
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false });

      if (communitiesError) throw communitiesError;

      // Fetch user's memberships if logged in
      let membershipSet = new Set<string>();
      if (user) {
        const { data: memberships, error: membershipsError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

        if (!membershipsError && memberships) {
          membershipSet = new Set(memberships.map(m => m.community_id));
        }
      }

      // Map data to expected format
      const formattedCommunities: CommunityData[] = (communitiesData || []).map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        token_address: c.token_address,
        chain: c.chain,
        member_count: c.member_count || 0,
        post_count: c.post_count || 0,
        avatar_url: c.avatar_url,
        access_type: c.access_type || 'open',
        isMember: membershipSet.has(c.id),
        tier: null,
      }));

      setCommunities(formattedCommunities);
    } catch (error) {
      console.error('Failed to load communities:', error);
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

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
        actions={
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Community
          </Button>
        }
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
          <EmptyState
            icon="🏘️"
            title="No communities found"
            description="Create a token-gated community or join an existing one."
            action={{
              label: 'Create Community',
              onClick: () => setShowCreateModal(true),
            }}
          />
        )}
      </div>

      <CreateCommunityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadCommunities();
        }}
      />
    </>
  );
}