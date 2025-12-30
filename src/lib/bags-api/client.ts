// File: src/lib/bags-api/client.ts
// ============================================================================
// Bags API Client - Full Implementation
// Based on https://docs.bags.fm/
// ============================================================================

import { Chain } from '../locke/types';

// ============================================================================
// TYPES (from Bags API documentation)
// ============================================================================

export interface BagsToken {
  address: string;
  chain: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_uri?: string;
  verified: boolean;
}

export interface BagsHolding {
  token_address: string;
  token_symbol: string;
  token_name: string;
  balance: number;
  balance_usd: number;
  chain: string;
  decimals: number;
  logo_uri?: string;
  holder_rank?: number;
  percentage_of_supply?: number;
  last_updated: string;
}

export interface BagsHoldingsResponse {
  wallet_address: string;
  chain: string;
  holdings: BagsHolding[];
  total_value_usd: number;
  fetched_at: string;
}

export interface BagsTokenMetrics {
  token_address: string;
  chain: string;
  symbol: string;
  name: string;
  price_usd: number;
  price_change_24h: number;
  price_change_7d: number;
  holder_count: number;
  volume_24h: number;
  market_cap: number;
  liquidity_usd: number;
  fully_diluted_valuation: number;
  fetched_at: string;
}

export interface BagsHolderDistribution {
  token_address: string;
  chain: string;
  total_holders: number;
  top_holders: Array<{
    wallet_address: string;
    balance: number;
    percentage_of_supply: number;
    rank: number;
  }>;
  distribution: {
    whales: number; // holders with >1% supply
    large: number; // 0.1% - 1%
    medium: number; // 0.01% - 0.1%
    small: number; // <0.01%
  };
}

export interface BagsTradingActivity {
  wallet_address: string;
  chain: string;
  period: '24h' | '7d' | '30d';
  trades: Array<{
    timestamp: string;
    type: 'buy' | 'sell';
    token_address: string;
    token_symbol: string;
    amount: number;
    amount_usd: number;
    price_per_token: number;
    signature?: string;
  }>;
  total_volume_usd: number;
  buy_volume_usd: number;
  sell_volume_usd: number;
  net_flow_usd: number;
  fees_paid_usd: number;
}

export interface BagsPortfolio {
  wallet_address: string;
  chains: string[];
  total_value_usd: number;
  holdings_count: number;
  all_holdings: BagsHolding[];
  chains_breakdown: Record<string, {
    value_usd: number;
    holdings_count: number;
  }>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class BagsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'BagsAPIError';
  }
}

// ============================================================================
// BAGS API CLIENT
// ============================================================================

export class BagsAPI {
  private baseURL: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds default

  constructor(apiKey?: string) {
    this.baseURL = process.env.NEXT_PUBLIC_BAGS_API_URL || 'https://api.bags.fm/v1';
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_BAGS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Bags API key not found. Some features may not work.');
    }
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BagsAPIError(
          errorData.message || `API request failed: ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof BagsAPIError) {
        throw error;
      }
      throw new BagsAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        endpoint
      );
    }
  }

  private getCacheKey(endpoint: string): string {
    return endpoint;
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
   if (this.cache.size > 100) {
  const oldestKey = this.cache.keys().next().value;

  if (typeof oldestKey === 'string') {
    this.cache.delete(oldestKey);
  }
}

  }

  // ==========================================================================
  // HOLDINGS API
  // ==========================================================================

  /**
   * Get all token holdings for a wallet address
   * @param walletAddress - Wallet address to query
   * @param chain - Blockchain (solana or polkadot)
   * @param useCache - Whether to use cache (default: true)
   */
  async getHoldings(
    walletAddress: string,
    chain: Chain,
    useCache = true
  ): Promise<BagsHoldingsResponse> {
    const endpoint = `/holdings/${chain}/${walletAddress}`;
    const cacheKey = this.getCacheKey(endpoint);

    if (useCache) {
      const cached = this.getCache<BagsHoldingsResponse>(cacheKey);
      if (cached) return cached;
    }

    try {
      const data = await this.request<BagsHoldingsResponse>(endpoint);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch holdings for ${walletAddress}:`, error);
      
      // Return empty holdings on error
      return {
        wallet_address: walletAddress,
        chain,
        holdings: [],
        total_value_usd: 0,
        fetched_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Get holdings across all supported chains for a wallet
   */
  async getPortfolio(walletAddress: string): Promise<BagsPortfolio> {
    const endpoint = `/portfolio/${walletAddress}`;
    const cacheKey = this.getCacheKey(endpoint);

    const cached = this.getCache<BagsPortfolio>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<BagsPortfolio>(endpoint);
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch portfolio for ${walletAddress}:`, error);
      
      // Fallback: fetch Solana holdings only
      const solanaHoldings = await this.getHoldings(walletAddress, 'solana');
      return {
        wallet_address: walletAddress,
        chains: ['solana'],
        total_value_usd: solanaHoldings.total_value_usd,
        holdings_count: solanaHoldings.holdings.length,
        all_holdings: solanaHoldings.holdings,
        chains_breakdown: {
          solana: {
            value_usd: solanaHoldings.total_value_usd,
            holdings_count: solanaHoldings.holdings.length,
          },
        },
      };
    }
  }

  // ==========================================================================
  // TOKEN METRICS API
  // ==========================================================================

  /**
   * Get comprehensive metrics for a specific token
   */
  async getTokenMetrics(
    tokenAddress: string,
    chain: Chain
  ): Promise<BagsTokenMetrics | null> {
    const endpoint = `/tokens/${chain}/${tokenAddress}/metrics`;
    const cacheKey = this.getCacheKey(endpoint);

    const cached = this.getCache<BagsTokenMetrics>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<BagsTokenMetrics>(endpoint);
      this.setCache(cacheKey, data, 300000); // 5 minute cache for metrics
      return data;
    } catch (error) {
      console.error(`Failed to fetch token metrics for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Get holder distribution for a token
   */
  async getHolderDistribution(
    tokenAddress: string,
    chain: Chain
  ): Promise<BagsHolderDistribution | null> {
    const endpoint = `/tokens/${chain}/${tokenAddress}/holders`;
    const cacheKey = this.getCacheKey(endpoint);

    const cached = this.getCache<BagsHolderDistribution>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<BagsHolderDistribution>(endpoint);
      this.setCache(cacheKey, data, 300000); // 5 minute cache
      return data;
    } catch (error) {
      console.error(`Failed to fetch holder distribution for ${tokenAddress}:`, error);
      return null;
    }
  }

  // ==========================================================================
  // TRADING ACTIVITY API
  // ==========================================================================

  /**
   * Get trading activity for a wallet
   */
  async getTradingActivity(
    walletAddress: string,
    chain: Chain,
    period: '24h' | '7d' | '30d' = '24h'
  ): Promise<BagsTradingActivity | null> {
    const endpoint = `/activity/${chain}/${walletAddress}?period=${period}`;
    const cacheKey = this.getCacheKey(endpoint);

    const cached = this.getCache<BagsTradingActivity>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<BagsTradingActivity>(endpoint);
      this.setCache(cacheKey, data, 60000); // 1 minute cache for activity
      return data;
    } catch (error) {
      console.error(`Failed to fetch trading activity for ${walletAddress}:`, error);
      return null;
    }
  }

  // ==========================================================================
  // VERIFICATION HELPERS
  // ==========================================================================

  /**
   * Verify if a wallet owns a specific token
   */
  async verifyOwnership(
    walletAddress: string,
    tokenAddress: string,
    chain: Chain,
    minimumBalance?: number
  ): Promise<boolean> {
    try {
      const holdings = await this.getHoldings(walletAddress, chain);
      const holding = holdings.holdings.find(
        h => h.token_address.toLowerCase() === tokenAddress.toLowerCase()
      );
      
      if (!holding) return false;
      if (minimumBalance !== undefined && holding.balance < minimumBalance) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ownership verification failed:', error);
      return false;
    }
  }

  /**
   * Get specific holding for a token
   */
  async getTokenHolding(
    walletAddress: string,
    tokenAddress: string,
    chain: Chain
  ): Promise<BagsHolding | null> {
    try {
      const holdings = await this.getHoldings(walletAddress, chain);
      return holdings.holdings.find(
        h => h.token_address.toLowerCase() === tokenAddress.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Failed to get token holding:', error);
      return null;
    }
  }

  /**
   * Calculate holder tier based on balance and rank
   */
  calculateTier(
    balance: number,
    holderRank?: number,
    percentageOfSupply?: number
  ): 'holder' | 'whale' | 'elite' {
    // Elite: Top 10 holders OR >1% supply
    if (holderRank && holderRank <= 10) return 'elite';
    if (percentageOfSupply && percentageOfSupply >= 1) return 'elite';
    
    // Whale: Top 100 holders OR 0.1-1% supply OR >100k tokens
    if (holderRank && holderRank <= 100) return 'whale';
    if (percentageOfSupply && percentageOfSupply >= 0.1) return 'whale';
    if (balance > 100000) return 'whale';
    
    return 'holder';
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific wallet
   */
  clearWalletCache(walletAddress: string): void {
    for (const [key] of this.cache) {
      if (key.includes(walletAddress)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Set cache TTL (in milliseconds)
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const bagsAPI = new BagsAPI();