// File: src/app/(platform)/search/page.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

type SearchTab = 'users' | 'communities' | 'posts';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('users');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    // Simulated search - in production, this would query Supabase
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResults = Array.from({ length: 5 }, (_, i) => ({
      id: `result-${i}`,
      type: activeTab,
      username: `${searchQuery}${i}`,
      displayName: `${searchQuery} User ${i}`,
      avatarUrl: null,
    }));

    setResults(mockResults);
    setIsSearching(false);
  };

  return (
    <>
      <PageHeader title="Search" />
      
      <div className={styles.search}>
        <div className={styles.search__input_wrapper}>
          <input
            type="text"
            className={styles.search__input}
            placeholder="Search InnerCircle..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            autoFocus
          />
        </div>

        <div className={styles.search__tabs}>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
          <Button
            variant={activeTab === 'communities' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('communities')}
          >
            Communities
          </Button>
          <Button
            variant={activeTab === 'posts' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </Button>
        </div>

        <div className={styles.search__results}>
          {isSearching ? (
            <div className={styles.search__loading}>Searching...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <motion.div
                key={result.id}
                className={styles.search__result}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Avatar src={result.avatarUrl} alt={result.username} size="md" />
                <div className={styles.search__result_info}>
                  <span className={styles.search__result_name}>
                    {result.displayName}
                  </span>
                  <span className={styles.search__result_username}>
                    @{result.username}
                  </span>
                </div>
              </motion.div>
            ))
          ) : query ? (
            <div className={styles.search__empty}>No results found</div>
          ) : (
            <div className={styles.search__prompt}>
              Start typing to search
            </div>
          )}
        </div>
      </div>
    </>
  );
}