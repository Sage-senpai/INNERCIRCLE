// File: src/types/community.ts

import type { Chain } from '@/lib/locke/types';

export type CommunityAccessType = 'open' | 'token_gated' | 'invite_only';
export type CommunityMemberRole = 'member' | 'moderator' | 'admin';

export interface Community {
  id: string;
  slug: string;
  name: string;
  description?: string;
  creatorId: string;
  tokenAddress?: string;
  chain?: Chain;
  accessType: CommunityAccessType;
  minTokenAmount?: number;
  minHoldDurationDays?: number;
  bannerUrl?: string;
  avatarUrl?: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  tokenBalance?: number;
  tier?: 'holder' | 'whale' | 'elite';
  role: CommunityMemberRole;
  joinedAt: string;
  lastVerified?: string;
}

export interface CommunityGate {
  id: string;
  communityId: string;
  gateType: 'token_ownership' | 'hold_duration' | 'nft_ownership' | 'invite';
  tokenAddress?: string;
  chain?: Chain;
  minAmount?: number;
  minHoldDays?: number;
  createdAt: string;
}

export interface CommunityInvite {
  id: string;
  communityId: string;
  inviterId: string;
  inviteCode: string;
  maxUses: number;
  uses: number;
  inviteeWallet?: string;
  used: boolean;
  createdAt: string;
  expiresAt?: string;
}