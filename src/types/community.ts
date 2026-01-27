// File: src/types/community.ts

import type { Chain } from '@/lib/locke/types';

export interface Community {
  id: string;
  slug: string;
  name: string;
  description?: string;
  creatorId: string;
  tokenAddress: string;
  chain: Chain;
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
  tokenBalance: number;
  tier: 'holder' | 'whale' | 'elite';
  joinedAt: string;
  lastVerified: string;
}