// File: src/app/home/page.tsx
// ============================================================================
// Home Redirect - Redirects to /feed
// ============================================================================

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/feed');
}
