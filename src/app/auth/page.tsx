// File: src/app/auth/page.tsx
// ============================================================================
// Auth Redirect - Redirects to /connect
// ============================================================================

import { redirect } from 'next/navigation';

export default function AuthPage() {
  redirect('/connect');
}
