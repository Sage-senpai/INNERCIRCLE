// File: src/app/(platform)/feed/page.tsx
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feed } from '@/components/feed/Feed/Feed';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { supabase } from '@/lib/supabase/client';
import styles from './page.module.scss';

interface CommunityTab {
  id: string;
  name: string;
  slug: string;
}

interface CommunityInfo {
  id: string;
  name: string;
  slug: string;
}

interface MembershipWithCommunity {
  community_id: string;
  communities: CommunityInfo | CommunityInfo[];
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [communityTabs, setCommunityTabs] = useState<CommunityTab[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    loadJoinedCommunities();
  }, []);

  async function loadJoinedCommunities() {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setCommunityTabs([]);
        return;
      }

      const { data: memberships, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          communities (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.user.id);

      if (error) throw error;

      const tabs = (memberships as MembershipWithCommunity[] | null)?.map((m) => {
        // Handle both array and single object from Supabase join
        const community = Array.isArray(m.communities) ? m.communities[0] : m.communities;
        if (!community) return null;
        return {
          id: community.id,
          name: community.name,
          slug: community.slug,
        };
      }).filter((tab): tab is CommunityTab => tab !== null) || [];

      setCommunityTabs(tabs);
    } catch (error) {
      console.error('Failed to load joined communities:', error);
      setCommunityTabs([]);
    }
  }

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const allTabs = ['home', ...communityTabs.map(c => c.id)];
    const currentIndex = allTabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < allTabs.length - 1) {
      setActiveTab(allTabs[currentIndex + 1]);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      setActiveTab(allTabs[currentIndex - 1]);
    }
  };

  return (
    <>
      <PageHeader title="Feed" />
      
      <div className={styles.feed_container}>
        <motion.div 
          className={styles.tabs}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.tabs__scroll}>
            <button
              className={`${styles.tab} ${activeTab === 'home' ? styles['tab--active'] : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <span className={styles.tab__icon}>🏠</span>
              <span className={styles.tab__label}>Home</span>
              {activeTab === 'home' && (
                <motion.div 
                  className={styles.tab__indicator}
                  layoutId="tabIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>

            {communityTabs.map((community) => (
              <button
                key={community.id}
                className={`${styles.tab} ${activeTab === community.id ? styles['tab--active'] : ''}`}
                onClick={() => setActiveTab(community.id)}
              >
                <span className={styles.tab__label}>{community.name}</span>
                {activeTab === community.id && (
                  <motion.div 
                    className={styles.tab__indicator}
                    layoutId="tabIndicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        <div 
          className={styles.feed_content}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'home' ? (
                <Feed type="home" />
              ) : (
                <Feed 
                  type="community" 
                  communityId={activeTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}