// File: src/app/(platform)/settings/page.tsx

'use client';

import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.scss';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/connect';
  };

  return (
    <>
      <PageHeader title="Settings" />
      
      <div className={styles.settings}>
        <section className={styles.settings__section}>
          <h2 className={styles.settings__section_title}>Account</h2>
          
          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Username</label>
            <div className={styles.settings__value}>@{user?.username}</div>
          </div>

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Wallet Address</label>
            <div className={styles.settings__value_mono}>
              {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
            </div>
          </div>
        </section>

        <section className={styles.settings__section}>
          <h2 className={styles.settings__section_title}>Preferences</h2>
          
          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Theme</label>
            <div className={styles.settings__value}>Dark (Default)</div>
          </div>
        </section>

        <section className={styles.settings__section}>
          <h2 className={styles.settings__section_title}>Danger Zone</h2>
          
          <Button variant="locked" onClick={handleLogout}>
            Disconnect Wallet
          </Button>
        </section>
      </div>
    </>
  );
}