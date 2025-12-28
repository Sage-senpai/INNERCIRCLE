// File: src/app/(admin)/control/page.tsx
// ============================================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

export default function AdminControlPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'communities' | 'users' | 'reports' | 'featured'>('communities');

  if (user?.role !== 'admin') {
    return (
      <div className={styles.admin}>
        <PageHeader title="Access Denied" />
        <motion.div 
          className={styles.admin__denied}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.admin__denied_icon}>🔒</div>
          <p className={styles.admin__denied_text}>
            You do not have permission to access this area.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Admin Control Panel" 
        subtitle="Manage communities, users, and platform content"
      />
      
      <div className={styles.admin}>
        <motion.div 
          className={styles.admin__tabs}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant={activeTab === 'communities' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('communities')}
          >
            Communities
          </Button>
          <Button
            variant={activeTab === 'users' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </Button>
          <Button
            variant={activeTab === 'featured' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('featured')}
          >
            Featured
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            className={styles.admin__content}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'communities' && <CommunitiesAdmin />}
            {activeTab === 'users' && <UsersAdmin />}
            {activeTab === 'reports' && <ReportsAdmin />}
            {activeTab === 'featured' && <FeaturedAdmin />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

function CommunitiesAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2 className={styles.admin__panel_title}>Manage Communities</h2>
      <p className={styles.admin__panel_description}>
        Review, approve, and manage token-gated communities on the platform.
      </p>
      <div className={styles.admin__panel_placeholder}>
        <span>🏘️</span>
        <p>Community management interface</p>
      </div>
    </div>
  );
}

function UsersAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2 className={styles.admin__panel_title}>Manage Users</h2>
      <p className={styles.admin__panel_description}>
        Search users, manage roles, and handle account issues.
      </p>
      <div className={styles.admin__panel_placeholder}>
        <span>👥</span>
        <p>User management interface</p>
      </div>
    </div>
  );
}

function ReportsAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2 className={styles.admin__panel_title}>Review Reports</h2>
      <p className={styles.admin__panel_description}>
        Handle content moderation and user reports.
      </p>
      <div className={styles.admin__panel_placeholder}>
        <span>⚠️</span>
        <p>Report queue interface</p>
      </div>
    </div>
  );
}

function FeaturedAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2 className={styles.admin__panel_title}>Featured Content</h2>
      <p className={styles.admin__panel_description}>
        Curate and promote content, communities, and users.
      </p>
      <div className={styles.admin__panel_placeholder}>
        <span>⭐</span>
        <p>Featured content manager</p>
      </div>
    </div>
  );
}