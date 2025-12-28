// File: src/app/(platform)/settings/page.tsx
// ============================================================================

'use client';

import { motion } from 'framer-motion';
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
        <motion.section 
          className={styles.settings__section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className={styles.settings__section_title}>Account</h2>
          
          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Username</label>
            <div className={styles.settings__value}>@{user?.username}</div>
          </div>

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Wallet Address</label>
            <div className={styles.settings__value_mono}>
              {user?.walletAddress?.slice(0, 12)}...{user?.walletAddress?.slice(-12)}
            </div>
          </div>

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Role</label>
            <div className={styles.settings__badge}>
              {user?.role === 'admin' ? '👑 Admin' : '👤 Member'}
            </div>
          </div>
        </motion.section>

        <motion.section 
          className={styles.settings__section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className={styles.settings__section_title}>Preferences</h2>
          
          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Theme</label>
            <div className={styles.settings__value}>Dark (Default)</div>
          </div>

          <div className={styles.settings__field}>
            <label className={styles.settings__label}>Language</label>
            <div className={styles.settings__value}>English</div>
          </div>
        </motion.section>

        <motion.section 
          className={styles.settings__section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className={styles.settings__section_title}>Privacy</h2>
          
          <div className={styles.settings__toggle}>
            <div className={styles.settings__toggle_info}>
              <span className={styles.settings__toggle_label}>Show holdings publicly</span>
              <span className={styles.settings__toggle_description}>
                Display your token holdings on your profile
              </span>
            </div>
            <div className={styles.settings__toggle_switch}>
              <input type="checkbox" id="showHoldings" defaultChecked />
              <label htmlFor="showHoldings" />
            </div>
          </div>

          <div className={styles.settings__toggle}>
            <div className={styles.settings__toggle_info}>
              <span className={styles.settings__toggle_label}>Allow transmissions from anyone</span>
              <span className={styles.settings__toggle_description}>
                Let any user send you private messages
              </span>
            </div>
            <div className={styles.settings__toggle_switch}>
              <input type="checkbox" id="allowDMs" />
              <label htmlFor="allowDMs" />
            </div>
          </div>
        </motion.section>

        <motion.section 
          className={`${styles.settings__section} ${styles['settings__section--danger']}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className={styles.settings__section_title}>Danger Zone</h2>
          
          <div className={styles.settings__danger}>
            <div className={styles.settings__danger_info}>
              <p className={styles.settings__danger_title}>Disconnect Wallet</p>
              <p className={styles.settings__danger_description}>
                Sign out and disconnect your wallet from InnerCircle
              </p>
            </div>
            <Button variant="locked" onClick={handleLogout}>
              Disconnect
            </Button>
          </div>
        </motion.section>
      </div>
    </>
  );
}
