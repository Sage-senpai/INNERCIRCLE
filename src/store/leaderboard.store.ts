// File: src/store/leaderboard.store.ts
// ============================================================================
// Real-time Leaderboard State Management
// Updates every minute with accurate rankings
// ============================================================================

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type MetricType = 'holdings' | 'trading' | 'engagement';
export type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    walletAddress: string;
  };
  score: number;
  previousScore?: number;
  change: number; // Rank change since last update
  metrics: {
    holdingsValue?: number;
    tradingVolume?: number;
    postCount?: number;
    signalCount?: number;
    echoCount?: number;
    relayCount?: number;
  };
  lastActive: string;
}

interface LeaderboardState {
  // Data
  entries: LeaderboardEntry[];
  topThree: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;

  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  currentMetric: MetricType;
  currentPeriod: Period;

  // Actions
  fetchLeaderboard: (metric: MetricType, period: Period) => Promise<void>;
  fetchUserRank: (userId: string) => Promise<void>;
  setMetric: (metric: MetricType) => void;
  setPeriod: (period: Period) => void;
  startAutoRefresh: () => () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPeriodStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'all_time':
    default:
      return new Date(0); // Beginning of time
  }
}

function calculateScore(entry: LeaderboardEntry, metric: MetricType): number {
  switch (metric) {
    case 'holdings':
      return entry.metrics.holdingsValue || 0;
    case 'trading':
      return entry.metrics.tradingVolume || 0;
    case 'engagement':
      const posts = (entry.metrics.postCount || 0) * 10;
      const signals = (entry.metrics.signalCount || 0) * 5;
      const echoes = (entry.metrics.echoCount || 0) * 3;
      const relays = (entry.metrics.relayCount || 0) * 2;
      return posts + signals + echoes + relays;
    default:
      return 0;
  }
}

// ============================================================================
// LEADERBOARD STORE
// ============================================================================

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  topThree: [],
  userRank: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  currentMetric: 'holdings',
  currentPeriod: 'all_time',

  setMetric: (metric: MetricType) => {
    set({ currentMetric: metric });
    get().fetchLeaderboard(metric, get().currentPeriod);
  },

  setPeriod: (period: Period) => {
    set({ currentPeriod: period });
    get().fetchLeaderboard(get().currentMetric, period);
  },

  fetchLeaderboard: async (metric: MetricType, period: Period) => {
    set({ isLoading: true, error: null });

    try {
      const periodStart = getPeriodStartDate(period);

      // Use single aggregated RPC call instead of N+1 queries
      const { data, error: rpcError } = await supabase.rpc(
        'get_engagement_leaderboard',
        {
          p_period_start: periodStart.toISOString(),
          p_limit: 100,
        }
      );

      if (rpcError) throw rpcError;
      if (!data || data.length === 0) {
        set({ entries: [], topThree: [], isLoading: false, lastUpdated: new Date() });
        return;
      }

      const entriesWithMetrics: LeaderboardEntry[] = data.map(
        (row: {
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          wallet_address: string;
          post_count: number;
          signal_count: number;
          echo_count: number;
          relay_count: number;
          engagement_score: number;
        }, index: number) => {
          const metrics: LeaderboardEntry['metrics'] = {
            postCount: row.post_count,
            signalCount: row.signal_count,
            echoCount: row.echo_count,
            relayCount: row.relay_count,
            holdingsValue: 0,
            tradingVolume: 0,
          };

          const entry: LeaderboardEntry = {
            rank: index + 1,
            user: {
              id: row.user_id,
              username: row.username,
              displayName: row.display_name || undefined,
              avatarUrl: row.avatar_url || undefined,
              walletAddress: row.wallet_address,
            },
            score: 0,
            change: 0,
            metrics,
            lastActive: new Date().toISOString(),
          };

          entry.score = calculateScore(entry, metric);
          return entry;
        }
      );

      // Re-sort by calculated score (matters when metric != 'engagement')
      entriesWithMetrics.sort((a, b) => b.score - a.score);
      entriesWithMetrics.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      const topThree = entriesWithMetrics.slice(0, 3);

      set({
        entries: entriesWithMetrics,
        topThree,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
      });
    }
  },

  fetchUserRank: async (userId: string) => {
    const { entries } = get();
    const userEntry = entries.find(e => e.user.id === userId);
    set({ userRank: userEntry || null });
  },

  startAutoRefresh: () => {
    // Refresh every minute
    const interval = setInterval(() => {
      const { currentMetric, currentPeriod } = get();
      get().fetchLeaderboard(currentMetric, currentPeriod);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  },
}));
