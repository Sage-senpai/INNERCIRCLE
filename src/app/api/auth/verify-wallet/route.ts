// File: src/app/api/auth/verify-wallet/route.ts
// ============================================================================
// Server-side wallet signature verification endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifySolanaSignature, buildSignInMessage } from '@/lib/wallets/verify';

// Nonce store - in production, use Redis or DB
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

export async function GET() {
  // Generate a nonce for the client to sign
  const nonce = crypto.randomUUID();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  nonceStore.set(nonce, { nonce, expiresAt });

  // Clean expired nonces
  for (const [key, entry] of nonceStore) {
    if (entry.expiresAt < Date.now()) nonceStore.delete(key);
  }

  const message = buildSignInMessage(nonce);

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

    // Consume the nonce (one-time use)
    nonceStore.delete(nonce);

    // Reconstruct the message and verify signature
    const message = buildSignInMessage(nonce);
    const isValid = await verifySolanaSignature(walletAddress, message, signature);

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
