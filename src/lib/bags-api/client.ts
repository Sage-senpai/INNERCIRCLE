// File: src/lib/bags-api/client.ts
// ============================================================================
// Bags API Client - Based on Official @bagsfm/bags-sdk
// https://www.npmjs.com/package/@bagsfm/bags-sdk
// ============================================================================

import { Chain } from '../locke/types';
import { getAllSPLTokenBalances, getSPLTokenBalance } from '../solana/token-verification';

// ============================================================================
// API CONFIGURATION - Official Bags Public API V2
// ============================================================================

const BAGS_PUBLIC_API_V2 = 'https://public-api-v2.bags.fm/api/v1';

// ============================================================================
// TYPES
// ============================================================================

export interface BagsToken {
  address: string;
  chain: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_uri?: string;
  verified: boolean;
  price_usd?: number;
  market_cap?: number;
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
    whales: number;
    large: number;
    medium: number;
    small: number;
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

// Official SDK Types
export interface TokenLaunchCreator {
  username: string;
  pfp: string;
  royaltyBps: number;
  isCreator: boolean;
  wallet: string;
  provider: string | null;
  providerUsername: string | null;
}

export interface ClaimablePosition {
  baseMint: string;
  virtualPool: string;
  totalClaimableLamportsUserShare: number;
  isMigrated: boolean;
  claimableDisplayAmount?: number;
}

export interface TradeQuoteResponse {
  contextSlot: number;
  inAmount: string;
  inputMint: string;
  minOutAmount: string;
  otherAmountThreshold: string;
  outAmount: string;
  outputMint: string;
  priceImpactPct: string;
  slippageBps: number;
  requestId: string;
  simulatedComputeUnits: number | null;
}

export interface TokenClaimStats {
  username: string;
  totalClaimed: string;
  wallet: string;
  isCreator: boolean;
}

export interface TokenLaunchFeedItem {
  tokenMint: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creator?: string;
  createdAt?: string;
  marketCap?: number;
  lifetimeFees?: number;
  // Pool-level data (from /bags/pools fallback)
  virtualPool?: string;
  isMigrated?: boolean;
  holderCount?: number;
  liquidity?: number;
}

export interface BagsPool {
  tokenMint: string;
  virtualPool: string;
  isMigrated: boolean;
  holderCount?: number;
  liquidity?: number;
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
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds default
  private useProxy: boolean;

  constructor(apiKey?: string) {
    // Use official API V2 base URL, remove any trailing slashes
    const envURL = process.env.NEXT_PUBLIC_BAGS_API_URL || BAGS_PUBLIC_API_V2;
    this.baseURL = envURL.replace(/\/+$/, '');
    this.apiKey = apiKey || process.env.BAGS_API_KEY || process.env.NEXT_PUBLIC_BAGS_API_KEY || '';
    // Use proxy for browser requests to avoid CORS
    this.useProxy = typeof window !== 'undefined';

    if (!this.apiKey) {
      console.warn('Bags API key not found. Some features may be limited.');
    }
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Build query string from params
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      queryString = '?' + searchParams.toString();
    }

    const fullEndpoint = normalizedEndpoint + queryString;

    // Use proxy in browser to avoid CORS issues
    const url = this.useProxy
      ? `/api/bags-proxy?endpoint=${encodeURIComponent(fullEndpoint)}`
      : `${this.baseURL}${fullEndpoint}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add API key header for direct requests (not through proxy)
      if (!this.useProxy && this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BagsAPIError(
          errorData.message || errorData.error || `API request failed: ${response.statusText}`,
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

  private setCache<T>(key: string, data: T): void {
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
  // TOKEN LAUNCH API (Official SDK Endpoints)
  // ==========================================================================

  /**
   * Get token lifetime fees
   * Note: Only works for tokens launched via Bags.fm platform
   * Returns 0 gracefully for non-Bags tokens (400/404 errors)
   */
  async getTokenLifetimeFees(tokenMint: string): Promise<number> {
    const cacheKey = `lifetime-fees-${tokenMint}`;
    const cached = this.getCache<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const response = await this.request<string>(
        '/token-launch/lifetime-fees',
        {},
        { tokenMint }
      );
      const fees = parseInt(response) || 0;
      this.setCache(cacheKey, fees);
      return fees;
    } catch (error) {
      // 400/404 errors are expected for non-Bags tokens - handle gracefully
      if (error instanceof BagsAPIError && (error.statusCode === 400 || error.statusCode === 404)) {
        this.setCache(cacheKey, 0);
        return 0;
      }
      // Only log unexpected errors
      if (!(error instanceof BagsAPIError) || error.statusCode !== 400) {
        console.error('Failed to get token lifetime fees:', error);
      }
      return 0;
    }
  }

  /**
   * Get token creators (v3 endpoint)
   * Note: Only works for tokens launched via Bags.fm platform
   * Returns empty array gracefully for non-Bags tokens
   */
  async getTokenCreators(tokenMint: string): Promise<TokenLaunchCreator[]> {
    const cacheKey = `creators-${tokenMint}`;
    const cached = this.getCache<TokenLaunchCreator[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<TokenLaunchCreator[]>(
        '/token-launch/creator/v3',
        {},
        { tokenMint }
      );
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      // 400/404 errors are expected for non-Bags tokens - handle gracefully
      if (error instanceof BagsAPIError && (error.statusCode === 400 || error.statusCode === 404)) {
        this.setCache(cacheKey, []);
        return [];
      }
      // Only log unexpected errors
      if (!(error instanceof BagsAPIError) || error.statusCode !== 400) {
        console.error('Failed to get token creators:', error);
      }
      return [];
    }
  }

  /**
   * Get token claim stats
   * Note: Only works for tokens launched via Bags.fm platform
   * Returns empty array gracefully for non-Bags tokens
   */
  async getTokenClaimStats(tokenMint: string): Promise<TokenClaimStats[]> {
    const cacheKey = `claim-stats-${tokenMint}`;
    const cached = this.getCache<TokenClaimStats[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<{ success: boolean; response: TokenClaimStats[] }>(
        '/token-launch/claim-stats',
        {},
        { tokenMint }
      );
      if (response.success) {
        this.setCache(cacheKey, response.response);
        return response.response;
      }
      return [];
    } catch (error) {
      // 400/404 errors are expected for non-Bags tokens - handle gracefully
      if (error instanceof BagsAPIError && (error.statusCode === 400 || error.statusCode === 404)) {
        this.setCache(cacheKey, []);
        return [];
      }
      // Only log unexpected errors
      if (!(error instanceof BagsAPIError) || error.statusCode !== 400) {
        console.error('Failed to get token claim stats:', error);
      }
      return [];
    }
  }

  /**
   * Get claimable positions for a wallet
   */
  async getClaimablePositions(walletAddress: string): Promise<ClaimablePosition[]> {
    const cacheKey = `claimable-${walletAddress}`;
    const cached = this.getCache<ClaimablePosition[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<ClaimablePosition[]>(
        '/token-launch/claimable-positions',
        {},
        { wallet: walletAddress }
      );
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to get claimable positions:', error);
      return [];
    }
  }

  // ==========================================================================
  // TRADE API (Official SDK Endpoints)
  // ==========================================================================

  /**
   * Get trade quote
   */
  async getTradeQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
  }): Promise<TradeQuoteResponse | null> {
    try {
      const response = await this.request<TradeQuoteResponse>(
        '/trade/quote',
        {},
        {
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          slippageMode: 'manual',
          ...(params.slippageBps !== undefined ? { slippageBps: params.slippageBps } : {})
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to get trade quote:', error);
      return null;
    }
  }

  // ==========================================================================
  // TOKEN LAUNCH FEED & POOLS (Official SDK Endpoints)
  // ==========================================================================

  /**
   * Get recent token launches from Bags.
   * Tries /token-launch/feed first; falls back to /bags/pools if that endpoint
   * is unavailable or returns an unexpected shape.
   */
  async getTokenLaunchFeed(): Promise<TokenLaunchFeedItem[]> {
    const cacheKey = 'token-launch-feed';
    const cached = this.getCache<TokenLaunchFeedItem[]>(cacheKey);
    if (cached) return cached;

    // --- Try the dedicated feed endpoint ---
    try {
      const raw = await this.request<unknown>('/token-launch/feed');

      // Normalise: the endpoint may return array directly, or wrapped in data/response
      let items: unknown[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        if (Array.isArray(r.data)) items = r.data;
        else if (Array.isArray(r.response)) items = r.response;
        else if (Array.isArray(r.launches)) items = r.launches;
        else if (Array.isArray(r.tokens)) items = r.tokens;
      }

      if (items.length > 0) {
        const feed: TokenLaunchFeedItem[] = items
          .map((item: unknown) => {
            const i = item as Record<string, unknown>;
            const creatorRaw = i.creator;
            const creator =
              creatorRaw && typeof creatorRaw === 'object'
                ? String((creatorRaw as Record<string, unknown>).wallet || '')
                : creatorRaw
                ? String(creatorRaw)
                : undefined;

            return {
              tokenMint: String(i.tokenMint || i.mint || i.address || ''),
              name: String(i.name || i.tokenName || ''),
              symbol: String(i.symbol || i.tokenSymbol || '—'),
              description: i.description ? String(i.description) : undefined,
              image:
                i.image || i.imageUrl || i.logoUri
                  ? String(i.image ?? i.imageUrl ?? i.logoUri)
                  : undefined,
              creator,
              createdAt: i.createdAt ? String(i.createdAt) : undefined,
              marketCap: typeof i.marketCap === 'number' ? i.marketCap : undefined,
              lifetimeFees: typeof i.lifetimeFees === 'number' ? i.lifetimeFees : undefined,
            };
          })
          .filter((item) => item.tokenMint.length > 0);

        this.setCache(cacheKey, feed);
        return feed;
      }
    } catch {
      // Fall through to pools fallback
    }

    // --- Fallback: derive feed from /bags/pools ---
    return this.getTokenLaunchFeedFromPools();
  }

  private async getTokenLaunchFeedFromPools(): Promise<TokenLaunchFeedItem[]> {
    try {
      const pools = await this.getBagsPools();
      const feed: TokenLaunchFeedItem[] = pools.slice(0, 50).map((pool) => ({
        tokenMint: pool.tokenMint,
        name: `${pool.tokenMint.slice(0, 6)}…${pool.tokenMint.slice(-4)}`,
        symbol: pool.isMigrated ? 'GRADUATED' : 'LIVE',
        description: pool.isMigrated
          ? 'Graduated — trading on open market'
          : 'Active bonding curve on Bags',
        virtualPool: pool.virtualPool,
        isMigrated: pool.isMigrated,
        holderCount: pool.holderCount,
        liquidity: pool.liquidity,
      }));
      return feed;
    } catch {
      return [];
    }
  }

  /**
   * Get all Bags bonding curve pools
   */
  async getBagsPools(): Promise<BagsPool[]> {
    const cacheKey = 'bags-pools';
    const cached = this.getCache<BagsPool[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<BagsPool[]>('/bags/pools');
      const pools = Array.isArray(response) ? response : [];
      this.setCache(cacheKey, pools);
      return pools;
    } catch (error) {
      console.error('Failed to get Bags pools:', error);
      return [];
    }
  }

  /**
   * Get pool for a specific token mint
   */
  async getBagsPool(tokenMint: string): Promise<BagsPool | null> {
    const cacheKey = `bags-pool-${tokenMint}`;
    const cached = this.getCache<BagsPool>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<BagsPool>(
        `/bags/pool/${tokenMint}`
      );
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof BagsAPIError && (error.statusCode === 400 || error.statusCode === 404)) {
        return null;
      }
      console.error('Failed to get Bags pool:', error);
      return null;
    }
  }

  // ==========================================================================
  // HOLDINGS API (via Solana RPC - getParsedTokenAccountsByOwner)
  // ==========================================================================

  /**
   * Get wallet holdings via Solana RPC
   */
  async getHoldings(
    walletAddress: string,
    chain: Chain,
    useCache = true
  ): Promise<BagsHoldingsResponse> {
    const cacheKey = `holdings-${chain}-${walletAddress}`;

    if (useCache) {
      const cached = this.getCache<BagsHoldingsResponse>(cacheKey);
      if (cached) return cached;
    }

    try {
      const tokenBalances = await getAllSPLTokenBalances(walletAddress);

      const holdings: BagsHolding[] = tokenBalances.map((t) => ({
        token_address: t.tokenAddress,
        token_symbol: '',
        token_name: '',
        balance: t.uiAmount,
        balance_usd: 0,
        chain,
        decimals: t.decimals,
        last_updated: new Date().toISOString(),
      }));

      const response: BagsHoldingsResponse = {
        wallet_address: walletAddress,
        chain,
        holdings,
        total_value_usd: 0,
        fetched_at: new Date().toISOString(),
      };

      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Failed to fetch holdings via Solana RPC:', error);
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
   * Get portfolio (wrapper around getHoldings)
   */
  async getPortfolio(walletAddress: string): Promise<BagsPortfolio> {
    const holdings = await this.getHoldings(walletAddress, 'solana');
    return {
      wallet_address: walletAddress,
      chains: ['solana'],
      total_value_usd: holdings.total_value_usd,
      holdings_count: holdings.holdings.length,
      all_holdings: holdings.holdings,
      chains_breakdown: {
        solana: {
          value_usd: holdings.total_value_usd,
          holdings_count: holdings.holdings.length,
        },
      },
    };
  }

  // ==========================================================================
  // TOKEN METRICS (Placeholder)
  // ==========================================================================

  async getTokenMetrics(
    tokenAddress: string,
    chain: Chain
  ): Promise<BagsTokenMetrics | null> {
    const cacheKey = `metrics-${chain}-${tokenAddress}`;
    const cached = this.getCache<BagsTokenMetrics>(cacheKey);
    if (cached) return cached;

    // Try to get token creators to verify token exists
    try {
      const creators = await this.getTokenCreators(tokenAddress);
      const fees = await this.getTokenLifetimeFees(tokenAddress);

      const metrics: BagsTokenMetrics = {
        token_address: tokenAddress,
        chain,
        symbol: 'UNKNOWN',
        name: creators.length > 0 ? creators[0].username || 'Bags Token' : 'Unknown',
        price_usd: 0,
        price_change_24h: 0,
        price_change_7d: 0,
        holder_count: 0,
        volume_24h: fees / 1e9, // Convert lamports to SOL
        market_cap: 0,
        liquidity_usd: 0,
        fully_diluted_valuation: 0,
        fetched_at: new Date().toISOString(),
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get token metrics:', error);
      return null;
    }
  }

  async getLivePrice(_tokenAddress: string): Promise<{ price: number; change24h: number } | null> {
    // Placeholder - would need price feed integration
    return { price: 0, change24h: 0 };
  }

  async getHolderDistribution(
    _tokenAddress: string,
    _chain: Chain
  ): Promise<BagsHolderDistribution | null> {
    // Not available in Bags API
    return null;
  }

  async getTradingActivity(
    _walletAddress: string,
    _chain: Chain,
    _period: '24h' | '7d' | '30d' = '24h'
  ): Promise<BagsTradingActivity | null> {
    // Not available in Bags API
    return null;
  }

  // ==========================================================================
  // VERIFICATION HELPERS
  // ==========================================================================

  async verifyOwnership(
    walletAddress: string,
    tokenAddress: string,
    _chain: Chain,
    minimumBalance?: number
  ): Promise<boolean> {
    try {
      const balance = await getSPLTokenBalance(walletAddress, tokenAddress);
      return balance >= (minimumBalance ?? 0);
    } catch (error) {
      console.error('Token ownership verification failed:', error);
      return false;
    }
  }

  async getTokenHolding(
    walletAddress: string,
    tokenAddress: string,
    chain: Chain
  ): Promise<BagsHolding | null> {
    const holdings = await this.getHoldings(walletAddress, chain);
    return holdings.holdings.find(
      h => h.token_address.toLowerCase() === tokenAddress.toLowerCase()
    ) || null;
  }

  calculateTier(
    balance: number,
    holderRank?: number,
    percentageOfSupply?: number
  ): 'holder' | 'whale' | 'elite' {
    if (holderRank && holderRank <= 10) return 'elite';
    if (percentageOfSupply && percentageOfSupply >= 1) return 'elite';
    if (holderRank && holderRank <= 100) return 'whale';
    if (percentageOfSupply && percentageOfSupply >= 0.1) return 'whale';
    if (balance > 100000) return 'whale';
    return 'holder';
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  clearCache(): void {
    this.cache.clear();
  }

  clearWalletCache(walletAddress: string): void {
    for (const [key] of this.cache) {
      if (key.includes(walletAddress)) {
        this.cache.delete(key);
      }
    }
  }

  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const bagsAPI = new BagsAPI();
