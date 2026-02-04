// File: src/app/(admin)/layout.tsx
// ============================================================================
// Admin Layout - Includes platform layout with sidebar
// ============================================================================

import { Sidebar } from '@/components/navigation/Sidebar/Sidebar';
import { MobileNav } from '@/components/navigation/MobileNav/MobileNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      minHeight: '100vh',
      background: '#000f08',
    }}>
      <Sidebar />
      <main style={{
        padding: '2rem',
        overflowY: 'auto',
      }}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
