// File: src/app/(platform)/search/page.tsx
// ============================================================================

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { SearchIcon } from '@/components/icons';
import styles from './page.module.scss';

type SearchTab = 'users' | 'communities' | 'posts';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('users');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockResults = Array.from({ length: 8 }, (_, i) => ({
      id: `result-${i}`,
      type: activeTab,
      username: `${searchQuery}${i}`,
      displayName: `${searchQuery} User ${i}`,
      avatarUrl: null,
      bio: activeTab === 'users' ? `Bio for ${searchQuery} ${i}` : undefined,
      memberCount: activeTab === 'communities' ? Math.floor(Math.random() * 10000) : undefined,
    }));

    setResults(mockResults);
    setIsSearching(false);
  }, [activeTab]);

  const debounceSearch = useCallback((value: string) => {
    const timeoutId = setTimeout(() => handleSearch(value), 400);
    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    debounceSearch(value);
  };

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
            onClick={() => {
              setActiveTab('users');
              if (query) handleSearch(query);
            }}
          >
            Users
          </Button>
          <Button
            variant={activeTab === 'communities' ? 'primary' : 'ghost'}
            onClick={() => {
              setActiveTab('communities');
              if (query) handleSearch(query);
            }}
          >
            Communities
          </Button>
          <Button
            variant={activeTab === 'posts' ? 'primary' : 'ghost'}
            onClick={() => {
              setActiveTab('posts');
              if (query) handleSearch(query);
            }}
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

            {results.map((result, index) => (
              <motion.div
                key={result.id}
                className={styles.search__result}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
              >
                <Avatar src={result.avatarUrl} alt={result.username} size="md" />
                <div className={styles.search__result_info}>
                  <span className={styles.search__result_name}>
                    {result.displayName}
                  </span>
                  <span className={styles.search__result_username}>
                    @{result.username}
                  </span>
                  {result.bio && (
                    <span className={styles.search__result_bio}>
                      {result.bio}
                    </span>
                  )}
                  {result.memberCount && (
                    <span className={styles.search__result_meta}>
                      {result.memberCount.toLocaleString()} members
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}