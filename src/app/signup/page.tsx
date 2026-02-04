// File: src/app/signup/page.tsx
// ============================================================================
// Signup Redirect - Redirects to /connect
// ============================================================================

import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/connect');
}
