// File: src/app/register/page.tsx
// ============================================================================
// Register Redirect - Redirects to /connect
// ============================================================================

import { redirect } from 'next/navigation';

export default function RegisterPage() {
  redirect('/connect');
}
