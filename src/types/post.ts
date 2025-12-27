// File: src/types/post.ts
import { User } from './user';
export interface Post {
  id: string;
  authorId: string;
  communityId?: string;
  content: string;
  mediaUrls?: string[];
  isGated: boolean;
  visibility: 'public' | 'gated' | 'community';
  signalCount: number;
  echoCount: number;
  relayCount: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
  gates?: PostGate[];
  hasSignaled?: boolean;
  hasRelayed?: boolean;
}

export interface PostGate {
  id: string;
  postId: string;
  ruleType: 'token_ownership' | 'minimum_balance' | 'holder_tier' | 'combined';
  tokenAddress?: string;
  chain?: 'solana' | 'polkadot';
  minimumBalance?: number;
  requiredTier?: 'holder' | 'whale' | 'elite';
  customLogic?: Record<string, any>;
  createdAt: string;
}

export interface Echo {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  signalCount: number;
  createdAt: string;
  updatedAt: string;
  author?: User;
}