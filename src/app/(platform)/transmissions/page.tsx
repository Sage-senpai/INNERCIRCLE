// File: src/app/(platform)/transmissions/page.tsx
// ============================================================================

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { CommunityChat } from '@/components/chat/CommunityChat';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { useAuthStore } from '@/store/auth.store';
import { getUserCommunitiesWithChat } from '@/lib/supabase/actions';
import styles from './page.module.scss';

const DM_WAITLIST_KEY = 'innercircle-dm-waitlist';

interface CommunityWithChat {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
  member_count: number;
}

type TabType = 'communities' | 'dms';

export default function TransmissionsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('communities');
  const [communities, setCommunities] = useState<CommunityWithChat[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  // Check if user already joined the waitlist
  useEffect(() => {
    const stored = localStorage.getItem(DM_WAITLIST_KEY);
    if (stored) {
      setWaitlistSubmitted(true);
    }
  }, []);

  const handleWaitlistSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = waitlistEmail.trim();
    if (!trimmed) return;
    localStorage.setItem(DM_WAITLIST_KEY, trimmed);
    setWaitlistSubmitted(true);
  };

  useEffect(() => {
    async function loadCommunities() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getUserCommunitiesWithChat(user.id);
        setCommunities(data as CommunityWithChat[]);

        // Auto-select first community if available
        if (data.length > 0 && !selectedCommunity) {
          setSelectedCommunity(data[0] as CommunityWithChat);
        }
      } catch (error) {
        console.error('Error loading communities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCommunities();
  }, [user, selectedCommunity]);

  if (!user) {
    return (
      <>
        <PageHeader
          title="Transmissions"
          subtitle="Private wallet-to-wallet messages"
        />
        <div className={styles.transmissions}>
          <div className={styles.transmissions__empty}>
            <p>Please connect your wallet to view transmissions</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Transmissions"
        subtitle="Community chats & private messages"
      />

      <div className={styles.transmissions}>
        <div className={styles.transmissions__tabs}>
          <button
            className={`${styles.transmissions__tab} ${activeTab === 'communities' ? styles['transmissions__tab--active'] : ''}`}
            onClick={() => setActiveTab('communities')}
          >
            Community Chats
          </button>
          <button
            className={`${styles.transmissions__tab} ${activeTab === 'dms' ? styles['transmissions__tab--active'] : ''}`}
            onClick={() => setActiveTab('dms')}
          >
            Direct Messages
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'communities' ? (
            <motion.div
              key="communities"
              className={styles.transmissions__content}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className={styles.transmissions__loading}>
                  <LoadingSpinner variant="lock" size="md" />
                  <p>Loading communities...</p>
                </div>
              ) : communities.length === 0 ? (
                <div className={styles.transmissions__no_communities}>
                  <span className={styles.transmissions__no_icon}>💬</span>
                  <h3>No Communities Yet</h3>
                  <p>Join a community to start chatting with other members!</p>
                </div>
              ) : (
                <div className={styles.transmissions__layout}>
                  <div className={styles.transmissions__sidebar}>
                    <h4 className={styles.transmissions__sidebar_title}>Your Communities</h4>
                    <div className={styles.transmissions__community_list}>
                      {communities.map((community) => (
                        <button
                          key={community.id}
                          className={`${styles.transmissions__community_item} ${
                            selectedCommunity?.id === community.id
                              ? styles['transmissions__community_item--active']
                              : ''
                          }`}
                          onClick={() => setSelectedCommunity(community)}
                        >
                          <Avatar
                            src={community.avatar_url}
                            alt={community.name}
                            size="sm"
                          />
                          <div className={styles.transmissions__community_info}>
                            <span className={styles.transmissions__community_name}>
                              {community.name}
                            </span>
                            <span className={styles.transmissions__community_members}>
                              {community.member_count} members
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.transmissions__chat_area}>
                    {selectedCommunity ? (
                      <CommunityChat
                        communityId={selectedCommunity.id}
                        communityName={selectedCommunity.name}
                      />
                    ) : (
                      <div className={styles.transmissions__select_prompt}>
                        <p>Select a community to start chatting</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dms"
              className={styles.transmissions__content}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.transmissions__coming_soon}>
                <motion.div
                  className={styles.transmissions__coming_soon_icon}
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                >
                  📡
                </motion.div>
                <h2 className={styles.transmissions__coming_soon_title}>
                  Direct Messages Coming Soon
                </h2>
                <p className={styles.transmissions__coming_soon_description}>
                  Send secure, private messages directly to other wallet holders.
                  Messages can be gated by token ownership, ensuring only verified community members can reach you.
                </p>

                {waitlistSubmitted ? (
                  <motion.div
                    className={styles.transmissions__waitlist_success}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className={styles.transmissions__waitlist_success_icon}>✓</span>
                    <p>You&apos;re on the list! We&apos;ll notify you when DMs launch.</p>
                  </motion.div>
                ) : (
                  <form
                    className={styles.transmissions__waitlist_form}
                    onSubmit={handleWaitlistSubmit}
                  >
                    <input
                      type="email"
                      className={styles.transmissions__waitlist_input}
                      placeholder="Enter your email address"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      required
                    />
                    <motion.button
                      type="submit"
                      className={styles.transmissions__waitlist_button}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Join Waitlist
                    </motion.button>
                  </form>
                )}

                <div className={styles.transmissions__features}>
                  <motion.div
                    className={styles.transmissions__feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <LockIcon locked={false} className={styles.transmissions__feature_icon} />
                    <div className={styles.transmissions__feature_content}>
                      <h3 className={styles.transmissions__feature_title}>Token-Gated Access</h3>
                      <p className={styles.transmissions__feature_description}>
                        Control who can message you based on token holdings
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className={styles.transmissions__feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className={styles.transmissions__feature_icon}>🔐</span>
                    <div className={styles.transmissions__feature_content}>
                      <h3 className={styles.transmissions__feature_title}>End-to-End Encrypted</h3>
                      <p className={styles.transmissions__feature_description}>
                        Your conversations remain private and secure
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className={styles.transmissions__feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className={styles.transmissions__feature_icon}>⚡</span>
                    <div className={styles.transmissions__feature_content}>
                      <h3 className={styles.transmissions__feature_title}>Real-time Messaging</h3>
                      <p className={styles.transmissions__feature_description}>
                        Instant delivery with read receipts and typing indicators
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
