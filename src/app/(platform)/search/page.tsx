// File: src/app/(platform)/search/page.tsx
// ============================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { SearchIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase/client';
import styles from './page.module.scss';

type SearchTab = 'users' | 'communities' | 'posts';

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface CommunityResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
}

interface PostResult {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('users');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityResult[]>([]);
  const [postResults, setPostResults] = useState<PostResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string, tab: SearchTab) => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      setCommunityResults([]);
      setPostResults([]);
      return;
    }

    setIsSearching(true);

    try {
      if (tab === 'users') {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, bio')
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) {
          console.error('Search error:', error);
        } else {
          setUserResults(data || []);
        }
      } else if (tab === 'communities') {
        const { data, error } = await supabase
          .from('communities')
          .select('id, name, slug, description, avatar_url, member_count')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) {
          console.error('Search error:', error);
        } else {
          setCommunityResults(data || []);
        }
      } else if (tab === 'posts') {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            author:users(id, username, display_name, avatar_url)
          `)
          .ilike('content', `%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Search error:', error);
        } else {
          setPostResults((data || []).map((post: any) => ({
            ...post,
            author: post.author || { id: '', username: 'unknown', display_name: null, avatar_url: null }
          })));
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search
    const timeout = setTimeout(() => {
      performSearch(value, activeTab);
    }, 400);

    setSearchTimeout(timeout);
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (query) {
      performSearch(query, tab);
    }
  };

  const navigateToUser = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const navigateToCommunity = (slug: string) => {
    router.push(`/communities/${slug}`);
  };

  const getResults = () => {
    if (activeTab === 'users') return userResults;
    if (activeTab === 'communities') return communityResults;
    return postResults;
  };

  const results = getResults();

  return (
    <>
      <PageHeader title="Search" />

      <div className={styles.search}>
        <motion.div
          className={styles.search__input_wrapper}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SearchIcon className={styles.search__input_icon} />
          <input
            type="text"
            className={styles.search__input}
            placeholder="Search InnerCircle..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            autoFocus
          />
          {isSearching && (
            <motion.div
              className={styles.search__input_loading}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.search__input_spinner} />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className={styles.search__tabs}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant={activeTab === 'users' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('users')}
          >
            Users
          </Button>
          <Button
            variant={activeTab === 'communities' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('communities')}
          >
            Communities
          </Button>
          <Button
            variant={activeTab === 'posts' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('posts')}
          >
            Posts
          </Button>
        </motion.div>

        <div className={styles.search__results}>
          <AnimatePresence mode="popLayout">
            {!query && !isSearching && (
              <motion.div
                className={styles.search__prompt}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SearchIcon className={styles.search__prompt_icon} />
                <p>Start typing to search</p>
              </motion.div>
            )}

            {query && !isSearching && results.length === 0 && (
              <motion.div
                className={styles.search__empty}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p>No results found for "{query}"</p>
              </motion.div>
            )}

            {/* User Results */}
            {activeTab === 'users' && userResults.map((user, index) => (
              <motion.div
                key={user.id}
                className={styles.search__result}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                onClick={() => navigateToUser(user.username)}
              >
                <Avatar src={user.avatar_url} alt={user.username} size="md" />
                <div className={styles.search__result_info}>
                  <span className={styles.search__result_name}>
                    {user.display_name || user.username}
                  </span>
                  <span className={styles.search__result_username}>
                    @{user.username}
                  </span>
                  {user.bio && (
                    <span className={styles.search__result_bio}>
                      {user.bio}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Community Results */}
            {activeTab === 'communities' && communityResults.map((community, index) => (
              <motion.div
                key={community.id}
                className={styles.search__result}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                onClick={() => navigateToCommunity(community.slug)}
              >
                <Avatar src={community.avatar_url} alt={community.name} size="md" />
                <div className={styles.search__result_info}>
                  <span className={styles.search__result_name}>
                    {community.name}
                  </span>
                  <span className={styles.search__result_username}>
                    /{community.slug}
                  </span>
                  {community.description && (
                    <span className={styles.search__result_bio}>
                      {community.description}
                    </span>
                  )}
                  <span className={styles.search__result_meta}>
                    {community.member_count.toLocaleString()} members
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Post Results */}
            {activeTab === 'posts' && postResults.map((post, index) => (
              <motion.div
                key={post.id}
                className={styles.search__result}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
              >
                <Avatar src={post.author.avatar_url} alt={post.author.username} size="md" />
                <div className={styles.search__result_info}>
                  <span className={styles.search__result_name}>
                    {post.author.display_name || post.author.username}
                  </span>
                  <span className={styles.search__result_username}>
                    @{post.author.username}
                  </span>
                  <span className={styles.search__result_content}>
                    {post.content.length > 150 ? `${post.content.slice(0, 150)}...` : post.content}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
