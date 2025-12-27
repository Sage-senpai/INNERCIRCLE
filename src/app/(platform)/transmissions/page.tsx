// File: src/app/(platform)/transmissions/page.tsx

'use client';

import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import styles from './page.module.scss';

export default function TransmissionsPage() {
  return (
    <>
      <PageHeader title="Transmissions" subtitle="Private wallet-to-wallet messages" />
      
      <div className={styles.transmissions}>
        <div className={styles.transmissions__empty}>
          <div className={styles.transmissions__empty_icon}>📡</div>
          <h2 className={styles.transmissions__empty_title}>
            Transmissions Coming Soon
          </h2>
          <p className={styles.transmissions__empty_description}>
            Send secure, private messages directly to other wallet holders.
            Messages can be gated by token ownership.
          </p>
        </div>
      </div>
    </>
  );
}