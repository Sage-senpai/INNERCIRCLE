// File: src/store/intelligence.store.ts
// ============================================================================
// Market Intelligence State Management with Real Bags API Data
// ============================================================================

import { create } from 'zustand';
import { bagsAPI } from '@/lib/bags-api/client';
import type { BagsTokenMetrics, BagsHolderDistribution, BagsTradingActivity } from '@/lib/bags-api/client';
import type { Chain } from '@/lib/locke/types';

// Popular Solana tokens with known addresses for reliable data
export const SUPPORTED_TOKENS = [
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', chain: 'solana' as const },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', chain: 'solana' as const },
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Wrapped SOL', chain: 'solana' as const },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', chain: 'solana' as const },
  { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat', chain: 'solana' as const },
  { address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'Cat in a Dog World', chain: 'solana' as const },
] as const;

export interface TokenActivityScore {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  tokenAddress: string;
  tokenSymbol: string;
  
  // Metrics
  holdingValue: number;
  holdingPercentage: number;
  holderRank: number;
  tradingVolume24h: number;
  tradeCount24h: number;
  
  // Engagement (from posts, signals, etc.)
  postCount: number;
  signalCount: number;
  echoCount: number;
  
  // Calculated score
  totalScore: number;
  rank?: number;
}

export interface CommunityAnalytics {
  communityId: string;
  communityName: string;
  tokenAddress: string;
  chain: Chain;
  
  // Token metrics
  tokenMetrics: BagsTokenMetrics | null;
  holderDistribution: BagsHolderDistribution | null;
  
  // Activity metrics (24h)
  newMembers: number;
  activeMembers: number;
  totalPosts: number;
  totalEngagement: number; // signals + echoes
  
  // Trending
  growthRate: number; // percentage
  activityTrend: 'up' | 'down' | 'stable';
  
  // Top contributors
  topContributors: TokenActivityScore[];
  
  lastUpdated: string;
}

interface IntelligenceState {
  // Token Metrics
  selectedTokenMetrics: BagsTokenMetrics | null;
  tokenMetricsLoading: boolean;
  tokenMetricsCache: Map<string, { data: BagsTokenMetrics; timestamp: number }>;
  
  // Community Analytics
  communityAnalytics: Map<string, CommunityAnalytics>;
  analyticsLoading: boolean;
  
  // Activity Leaderboard
  activityLeaderboard: TokenActivityScore[];
  leaderboardLoading: boolean;
  
  // Actions
  fetchTokenMetrics: (tokenAddress: string, chain: Chain) => Promise<void>;
  fetchCommunityAnalytics: (communityId: string, tokenAddress: string, chain: Chain) => Promise<void>;
  fetchActivityLeaderboard: (tokenAddress: string, chain: Chain, limit?: number) => Promise<void>;
  clearCache: () => void;
}

const CACHE_TTL = 300000; // 5 minutes

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
  selectedTokenMetrics: null,
  tokenMetricsLoading: false,
  tokenMetricsCache: new Map(),
  
  communityAnalytics: new Map(),
  analyticsLoading: false,
  
  activityLeaderboard: [],
  leaderboardLoading: false,
  
  fetchTokenMetrics: async (tokenAddress: string, chain: Chain) => {
    const cacheKey = `${chain}:${tokenAddress}`;
    const cached = get().tokenMetricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      set({ selectedTokenMetrics: cached.data });
      return;
    }
    
    set({ tokenMetricsLoading: true });
    
    try {
      const metrics = await bagsAPI.getTokenMetrics(tokenAddress, chain);
      
      if (metrics) {
        const newCache = new Map(get().tokenMetricsCache);
        newCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
        
        set({ 
          selectedTokenMetrics: metrics,
          tokenMetricsCache: newCache,
          tokenMetricsLoading: false 
        });
      } else {
        set({ tokenMetricsLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch token metrics:', error);
      set({ tokenMetricsLoading: false });
    }
  },
  
  fetchCommunityAnalytics: async (communityId: string, tokenAddress: string, chain: Chain) => {
    set({ analyticsLoading: true });
    
    try {
      // Fetch token data from Bags API
      const [tokenMetrics, holderDistribution] = await Promise.all([
        bagsAPI.getTokenMetrics(tokenAddress, chain),
        bagsAPI.getHolderDistribution(tokenAddress, chain)
      ]);
      
      // TODO: Fetch community activity from Supabase
      // For now, using mock engagement data
      const analytics: CommunityAnalytics = {
        communityId,
        communityName: '', // Will be set by component
        tokenAddress,
        chain,
        tokenMetrics,
        holderDistribution,
        newMembers: 0,
        activeMembers: 0,
        totalPosts: 0,
        totalEngagement: 0,
        growthRate: 0,
        activityTrend: 'stable',
        topContributors: [],
        lastUpdated: new Date().toISOString()
      };
      
      const newMap = new Map(get().communityAnalytics);
      newMap.set(communityId, analytics);
      
      set({ 
        communityAnalytics: newMap,
        analyticsLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch community analytics:', error);
      set({ analyticsLoading: false });
    }
  },
  
  fetchActivityLeaderboard: async (tokenAddress: string, chain: Chain, limit = 50) => {
    set({ leaderboardLoading: true });

    try {
      // Fetch holder distribution and token metrics in parallel
      const [holderDistribution, tokenMetrics] = await Promise.all([
        bagsAPI.getHolderDistribution(tokenAddress, chain),
        bagsAPI.getTokenMetrics(tokenAddress, chain),
      ]);

      if (!holderDistribution) {
        set({ leaderboardLoading: false });
        return;
      }

      // Fetch trading activity for top holders (batch for performance)
      const topHolders = holderDistribution.top_holders.slice(0, Math.min(limit, 20));

      const scoresWithActivity = await Promise.all(
        topHolders.map(async (holder, index) => {
          // Try to get trading activity for this holder
          let tradingActivity: BagsTradingActivity | null = null;
          try {
            tradingActivity = await bagsAPI.getTradingActivity(holder.wallet_address, chain, '24h');
          } catch {
            // Silently fail for individual holder lookups
          }

          // Calculate scores based on real data
          const holdingScore = holder.percentage_of_supply * 1000; // Weight by supply percentage
          const tradingScore = tradingActivity
            ? (tradingActivity.total_volume_usd / 1000) + (tradingActivity.trades.length * 10)
            : holder.balance * 0.0001; // Fallback estimate
          const liquidityScore = holder.percentage_of_supply >= 1 ? 500 : holder.percentage_of_supply >= 0.1 ? 200 : 50;

          const totalScore = holdingScore + tradingScore + liquidityScore;

          return {
            userId: holder.wallet_address,
            username: `${holder.wallet_address.slice(0, 4)}...${holder.wallet_address.slice(-4)}`,
            displayName: undefined,
            avatarUrl: undefined,
            tokenAddress,
            tokenSymbol: tokenMetrics?.symbol || '',
            holdingValue: holder.balance * (tokenMetrics?.price_usd || 0),
            holdingPercentage: holder.percentage_of_supply,
            holderRank: holder.rank,
            tradingVolume24h: tradingActivity?.total_volume_usd || 0,
            tradeCount24h: tradingActivity?.trades.length || 0,
            postCount: 0, // From Supabase - would need separate query
            signalCount: 0,
            echoCount: 0,
            totalScore,
            rank: index + 1,
          };
        })
      );

      // Sort by total score
      scoresWithActivity.sort((a, b) => b.totalScore - a.totalScore);

      // Update ranks after sorting
      scoresWithActivity.forEach((score, index) => {
        score.rank = index + 1;
      });

      set({
        activityLeaderboard: scoresWithActivity.slice(0, limit),
        leaderboardLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch activity leaderboard:', error);
      set({ leaderboardLoading: false });
    }
  },
  
  clearCache: () => {
    set({
      tokenMetricsCache: new Map(),
      communityAnalytics: new Map(),
      selectedTokenMetrics: null,
      activityLeaderboard: []
    });
  }
}));