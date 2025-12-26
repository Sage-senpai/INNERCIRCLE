
// File: src/app/(platform)/layout.tsx

import { Sidebar } from '@/components/navigation/Sidebar/Sidebar';
import { MobileNav } from '@/components/navigation/MobileNav/MobileNav';
import styles from './layout.module.scss';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.platform}>
      <Sidebar />
      <main className={styles.platform__main}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}