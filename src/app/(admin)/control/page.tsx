// File: src/app/(admin)/control/page.tsx

'use client';

import { useState } from 'react';
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
        <div className={styles.admin__denied}>
          <p>You do not have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Admin Control Panel" />
      
      <div className={styles.admin}>
        <div className={styles.admin__tabs}>
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
        </div>

        <div className={styles.admin__content}>
          {activeTab === 'communities' && <CommunitiesAdmin />}
          {activeTab === 'users' && <UsersAdmin />}
          {activeTab === 'reports' && <ReportsAdmin />}
          {activeTab === 'featured' && <FeaturedAdmin />}
        </div>
      </div>
    </>
  );
}

function CommunitiesAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2>Manage Communities</h2>
      <p>Community management interface will be implemented here.</p>
      {/* Community list, approval queue, etc. */}
    </div>
  );
}

function UsersAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2>Manage Users</h2>
      <p>User management interface will be implemented here.</p>
      {/* User search, role management, suspension, etc. */}
    </div>
  );
}

function ReportsAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2>Review Reports</h2>
      <p>Content moderation interface will be implemented here.</p>
      {/* Report queue, action buttons, etc. */}
    </div>
  );
}

function FeaturedAdmin() {
  return (
    <div className={styles.admin__panel}>
      <h2>Featured Content</h2>
      <p>Feature management interface will be implemented here.</p>
      {/* Curated posts, communities, users, etc. */}
    </div>
  );
}
