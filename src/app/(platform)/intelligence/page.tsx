// File: src/app/(platform)/intelligence/page.tsx
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import styles from './page.module.scss';

export default function IntelligencePage() {
  return (
    <>
      <PageHeader 
        title="Market Intelligence" 
        subtitle="Real-time token analytics and community insights"
      />
      
      <div className={styles.intelligence}>
        <div className={styles.intelligence__grid}>
          <motion.div 
            className={styles.intelligence__card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.intelligence__card_header}>
              <h3 className={styles.intelligence__card_title}>Token Metrics</h3>
              <TrendUpIcon className={styles.intelligence__card_icon} />
            </div>
            <p className={styles.intelligence__card_description}>
              Track price movements, volume, and holder growth across all community tokens in real-time.
            </p>
            <div className={styles.intelligence__placeholder}>
              <div className={styles.intelligence__placeholder_icon}>📊</div>
              <p>Interactive charts coming soon</p>
            </div>
          </motion.div>

          <motion.div 
            className={styles.intelligence__card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.intelligence__card_header}>
              <h3 className={styles.intelligence__card_title}>Community Activity</h3>
              <span className={styles.intelligence__card_badge}>Live</span>
            </div>
            <p className={styles.intelligence__card_description}>
              Monitor engagement levels, new members, and content creation rates across communities.
            </p>
            <div className={styles.intelligence__placeholder}>
              <div className={styles.intelligence__placeholder_icon}>📈</div>
              <p>Activity feed coming soon</p>
            </div>
          </motion.div>

          <motion.div 
            className={styles.intelligence__card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.intelligence__card_header}>
              <h3 className={styles.intelligence__card_title}>Trading Insights</h3>
              <TrendDownIcon className={styles.intelligence__card_icon} />
            </div>
            <p className={styles.intelligence__card_description}>
              Analyze buy/sell pressure, whale movements, and market sentiment indicators.
            </p>
            <div className={styles.intelligence__placeholder}>
              <div className={styles.intelligence__placeholder_icon}>💹</div>
              <p>Trading data coming soon</p>
            </div>
          </motion.div>

          <motion.div 
            className={styles.intelligence__card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.intelligence__card_header}>
              <h3 className={styles.intelligence__card_title}>Holder Distribution</h3>
              <span className={styles.intelligence__card_badge}>Premium</span>
            </div>
            <p className={styles.intelligence__card_description}>
              Understand token concentration and tier distribution across communities.
            </p>
            <div className={styles.intelligence__placeholder}>
              <div className={styles.intelligence__placeholder_icon}>🎯</div>
              <p>Distribution charts coming soon</p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className={styles.intelligence__premium}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className={styles.intelligence__premium_title}>
            Premium Intelligence
          </h2>
          <p className={styles.intelligence__premium_description}>
            Get advanced analytics, custom alerts, and API access. Unlock deeper insights into market movements and community dynamics.
          </p>
          <div className={styles.intelligence__premium_features}>
            <div className={styles.intelligence__premium_feature}>
              <span>✓</span> Real-time alerts
            </div>
            <div className={styles.intelligence__premium_feature}>
              <span>✓</span> Custom dashboards
            </div>
            <div className={styles.intelligence__premium_feature}>
              <span>✓</span> API access
            </div>
            <div className={styles.intelligence__premium_feature}>
              <span>✓</span> Historical data
            </div>
          </div>
          <button className={styles.intelligence__premium_button}>
            Coming Soon
          </button>
        </motion.div>
      </div>
    </>
  );
}
