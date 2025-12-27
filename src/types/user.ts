// File: src/types/user.ts

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  role: 'member' | 'admin';
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletVerification {
  id: string;
  userId: string;
  chain: 'solana' | 'polkadot';
  walletAddress: string;
  verifiedAt: string;
  isPrimary: boolean;
}
