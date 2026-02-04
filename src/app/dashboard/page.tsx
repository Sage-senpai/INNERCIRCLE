// File: src/app/dashboard/page.tsx
// ============================================================================
// Dashboard Redirect - Redirects to /feed
// ============================================================================

import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/feed');
}
