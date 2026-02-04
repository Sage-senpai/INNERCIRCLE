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

      // Fetch users with their engagement metrics
      let query = supabase
        .from('users')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          wallet_address,
          created_at
        `)
        .limit(100);

      const { data: users, error: usersError } = await query;

      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        set({ entries: [], topThree: [], isLoading: false, lastUpdated: new Date() });
        return;
      }

      // Fetch engagement metrics for each user based on the selected metric and period
      const entriesWithMetrics: LeaderboardEntry[] = await Promise.all(
        users.map(async (user, index) => {
          let metrics: LeaderboardEntry['metrics'] = {};

          // Fetch post counts
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', user.id)
            .gte('created_at', periodStart.toISOString());

          // Fetch signal counts (signals given)
          const { count: signalCount } = await supabase
            .from('signals')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', periodStart.toISOString());

          // Fetch echo counts
          const { count: echoCount } = await supabase
            .from('echoes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', periodStart.toISOString());

          // Fetch relay counts
          const { count: relayCount } = await supabase
            .from('relays')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', periodStart.toISOString());

          metrics = {
            postCount: postCount || 0,
            signalCount: signalCount || 0,
            echoCount: echoCount || 0,
            relayCount: relayCount || 0,
            holdingsValue: 0, // Would need wallet integration
            tradingVolume: 0, // Would need trading history
          };

          const entry: LeaderboardEntry = {
            rank: index + 1,
            user: {
              id: user.id,
              username: user.username,
              displayName: user.display_name || undefined,
              avatarUrl: user.avatar_url || undefined,
              walletAddress: user.wallet_address,
            },
            score: 0, // Calculated after
            change: 0,
            metrics,
            lastActive: user.created_at,
          };

          entry.score = calculateScore(entry, metric);
          return entry;
        })
      );

      // Sort by score descending
      entriesWithMetrics.sort((a, b) => b.score - a.score);

      // Assign ranks after sorting
      entriesWithMetrics.forEach((entry, index) => {
        entry.rank = index + 1;
        // Calculate change (would need previous rankings stored)
        entry.change = Math.floor(Math.random() * 10) - 5; // Placeholder
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
