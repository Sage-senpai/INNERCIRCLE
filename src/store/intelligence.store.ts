// File: src/store/intelligence.store.ts
// ============================================================================
// Market Intelligence State Management with DexScreener + Jupiter APIs
// ============================================================================

import { create } from 'zustand';
import { tokenMetricsClient, type TokenMetrics, type DexScreenerPair } from '@/lib/token-metrics/client';
import { bagsAPI, type TokenLaunchFeedItem } from '@/lib/bags-api/client';
import type { Chain } from '@/lib/locke/types';

// Bags-launched tokens with known addresses for reliable data
export const SUPPORTED_TOKENS = [
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', chain: 'solana' as const, isBags: true },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', chain: 'solana' as const, isBags: true },
  { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat', chain: 'solana' as const, isBags: true },
  { address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'Cat in a Dog World', chain: 'solana' as const, isBags: true },
  { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Wrapped SOL', chain: 'solana' as const, isBags: false },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', chain: 'solana' as const, isBags: false },
] as const;

// Filter to get only Bags tokens
export const BAGS_TOKENS = SUPPORTED_TOKENS.filter(t => t.isBags);

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

  // Token metrics from DexScreener + Jupiter
  tokenMetrics: TokenMetrics | null;
  topPairs: DexScreenerPair[];

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
  // Token Metrics from DexScreener + Jupiter
  selectedTokenMetrics: TokenMetrics | null;
  tokenMetricsLoading: boolean;
  tokenMetricsCache: Map<string, { data: TokenMetrics; timestamp: number }>;

  // Community Analytics
  communityAnalytics: Map<string, CommunityAnalytics>;
  analyticsLoading: boolean;

  // Activity Leaderboard
  activityLeaderboard: TokenActivityScore[];
  leaderboardLoading: boolean;

  // Bags Token Launch Feed
  tokenLaunchFeed: TokenLaunchFeedItem[];
  tokenLaunchFeedLoading: boolean;

  // Actions
  fetchTokenMetrics: (tokenAddress: string, chain: Chain) => Promise<void>;
  fetchCommunityAnalytics: (communityId: string, tokenAddress: string, chain: Chain) => Promise<void>;
  fetchActivityLeaderboard: (tokenAddress: string, chain: Chain, limit?: number) => Promise<void>;
  fetchTokenLaunchFeed: () => Promise<void>;
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

  tokenLaunchFeed: [],
  tokenLaunchFeedLoading: false,
  
  fetchTokenMetrics: async (tokenAddress: string, chain: Chain) => {
    const cacheKey = `${chain}:${tokenAddress}`;
    const cached = get().tokenMetricsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      set({ selectedTokenMetrics: cached.data });
      return;
    }

    set({ tokenMetricsLoading: true });

    try {
      // Use DexScreener + Jupiter APIs for real-time token metrics
      const metrics = await tokenMetricsClient.getTokenMetrics(tokenAddress, chain);

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
      // Fetch token data from DexScreener + Jupiter APIs
      const [tokenMetrics, pairs] = await Promise.all([
        tokenMetricsClient.getTokenMetrics(tokenAddress, chain),
        tokenMetricsClient.getDexScreenerPairs(tokenAddress, chain)
      ]);

      // TODO: Fetch community activity from Supabase
      // For now, using mock engagement data
      const analytics: CommunityAnalytics = {
        communityId,
        communityName: '', // Will be set by component
        tokenAddress,
        chain,
        tokenMetrics,
        topPairs: pairs.slice(0, 5), // Top 5 trading pairs
        newMembers: 0,
        activeMembers: 0,
        totalPosts: 0,
        totalEngagement: 0,
        growthRate: tokenMetrics?.priceChange24h || 0,
        activityTrend: tokenMetrics?.priceChange24h
          ? tokenMetrics.priceChange24h > 0 ? 'up' : tokenMetrics.priceChange24h < 0 ? 'down' : 'stable'
          : 'stable',
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
      // Fetch token metrics and pairs from DexScreener + Jupiter
      const [tokenMetrics, pairs] = await Promise.all([
        tokenMetricsClient.getTokenMetrics(tokenAddress, chain),
        tokenMetricsClient.getDexScreenerPairs(tokenAddress, chain),
      ]);

      if (!tokenMetrics && pairs.length === 0) {
        set({ leaderboardLoading: false });
        return;
      }

      // DexScreener doesn't provide holder data directly, but we can use
      // trading pairs data to show market activity. For a full leaderboard,
      // you'd need to integrate with on-chain data or a holder tracking API.

      // Generate activity scores based on trading pair data
      const activityScores: TokenActivityScore[] = pairs.slice(0, Math.min(limit, 20)).map((pair, index) => {
        // Use pair data to generate activity metrics
        const volume24h = pair.volume?.h24 || 0;
        const txns24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
        const liquidityUsd = pair.liquidity?.usd || 0;

        // Calculate score based on trading activity
        const volumeScore = Math.log10(volume24h + 1) * 100;
        const txnScore = txns24h * 2;
        const liquidityScore = Math.log10(liquidityUsd + 1) * 50;
        const totalScore = volumeScore + txnScore + liquidityScore;

        return {
          userId: pair.pairAddress,
          username: `${pair.dexId}/${pair.baseToken.symbol}-${pair.quoteToken.symbol}`,
          displayName: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
          avatarUrl: pair.info?.imageUrl,
          tokenAddress,
          tokenSymbol: tokenMetrics?.symbol || pair.baseToken.symbol,
          holdingValue: liquidityUsd,
          holdingPercentage: 0, // Not available from DexScreener
          holderRank: index + 1,
          tradingVolume24h: volume24h,
          tradeCount24h: txns24h,
          postCount: 0,
          signalCount: 0,
          echoCount: 0,
          totalScore,
          rank: index + 1,
        };
      });

      // Sort by total score
      activityScores.sort((a, b) => b.totalScore - a.totalScore);

      // Update ranks after sorting
      activityScores.forEach((score, index) => {
        score.rank = index + 1;
      });

      set({
        activityLeaderboard: activityScores.slice(0, limit),
        leaderboardLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch activity leaderboard:', error);
      set({ leaderboardLoading: false });
    }
  },
  
  fetchTokenLaunchFeed: async () => {
    set({ tokenLaunchFeedLoading: true });

    try {
      const feed = await bagsAPI.getTokenLaunchFeed();
      set({
        tokenLaunchFeed: feed,
        tokenLaunchFeedLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch token launch feed:', error);
      set({ tokenLaunchFeedLoading: false });
    }
  },

  clearCache: () => {
    set({
      tokenMetricsCache: new Map(),
      communityAnalytics: new Map(),
      selectedTokenMetrics: null,
      activityLeaderboard: [],
      tokenLaunchFeed: [],
    });
  }
}));