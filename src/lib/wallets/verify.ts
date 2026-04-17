// File: src/lib/wallets/verify.ts
// ============================================================================
// Wallet signature verification (Sign-In With Solana)
// Server-side only — uses tweetnacl for Ed25519 verification
// ============================================================================

import { PublicKey } from '@solana/web3.js';

/**
 * Build a sign-in message with a nonce and timestamp
 */
export function buildSignInMessage(nonce: string): string {
  return [
    'Sign in to InnerCircle',
    '',
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join('\n');
}

/**
 * Verify a Solana wallet signature against a message
 * Returns true if the signature is valid for the given wallet and message
 */
export async function verifySolanaSignature(
  walletAddress: string,
  message: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    // Dynamic import — tweetnacl is server-side only
    const nacl = (await import('tweetnacl')).default;

    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Uint8Array.from(
      Buffer.from(signatureBase64, 'base64')
    );

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
