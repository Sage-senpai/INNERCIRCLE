// File: src/app/api/auth/verify-wallet/route.ts
// ============================================================================
// Server-side wallet signature verification endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifySolanaSignature, buildSignInMessage } from '@/lib/wallets/verify';

// Nonce store - in production, use Redis or DB
const nonceStore = new Map<string, { nonce: string; message: string; expiresAt: number }>();

export async function GET() {
  // Generate a nonce for the client to sign
  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Build the message once and store it — timestamp must be identical at verify time
  const message = buildSignInMessage(nonce);
  nonceStore.set(nonce, { nonce, message, expiresAt });

  // Clean expired nonces
  for (const [key, entry] of nonceStore) {
    if (entry.expiresAt < Date.now()) nonceStore.delete(key);
  }

  return NextResponse.json({ nonce, message });
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, nonce, signature } = await request.json();

    if (!walletAddress || !nonce || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, nonce, signature' },
        { status: 400 }
      );
    }

    // Verify nonce exists and hasn't expired
    const nonceEntry = nonceStore.get(nonce);
    if (!nonceEntry || nonceEntry.expiresAt < Date.now()) {
      nonceStore.delete(nonce);
      return NextResponse.json(
        { error: 'Invalid or expired nonce. Please try again.' },
        { status: 401 }
      );
    }

    // Capture the stored message before consuming the nonce
    const storedMessage = nonceEntry.message;

    // Consume the nonce (one-time use)
    nonceStore.delete(nonce);

    // Verify against the exact message the client signed
    const isValid = await verifySolanaSignature(walletAddress, storedMessage, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature. Wallet ownership could not be verified.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ verified: true, walletAddress });
  } catch (error) {
    console.error('Wallet verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
