// File: src/app/login/page.tsx
// ============================================================================
// Login Redirect - Redirects to /connect
// ============================================================================

import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/connect');
}
