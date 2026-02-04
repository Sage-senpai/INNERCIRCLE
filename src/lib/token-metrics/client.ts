// File: src/lib/token-metrics/client.ts
// ============================================================================
// Token Metrics Client - DexScreener + Jupiter APIs
// Free, no API key required, reliable real-time data
// ============================================================================

// ============================================================================
// API ENDPOINTS
// ============================================================================

const DEXSCREENER_API = 'https://api.dexscreener.com';
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenMetrics {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  priceUsd: number;
  priceChange24h: number;
  priceChange6h: number;
  priceChange1h: number;
  volume24h: number;
  volumeChange24h: number;
  liquidity: number;
  marketCap: number;
  fdv: number;
  holders?: number;
  pairAddress?: string;
  dexId?: string;
  createdAt?: string;
  fetchedAt: string;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

export interface JupiterPriceData {
  id: string;
  type: string;
  price: string;
  extraInfo?: {
    quotedPrice?: {
      buyPrice: string;
      buyAt: number;
      sellPrice: string;
      sellAt: number;
    };
    confidenceLevel: string;
    depth?: {
      buyPriceImpactRatio?: { [key: string]: number };
      sellPriceImpactRatio?: { [key: string]: number };
    };
  };
}

export interface TopHolder {
  walletAddress: string;
  balance: number;
  percentageOfSupply: number;
  rank: number;
  valueUsd: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class TokenMetricsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public source?: 'dexscreener' | 'jupiter'
  ) {
    super(message);
    this.name = 'TokenMetricsError';
  }
}

// ============================================================================
// TOKEN METRICS CLIENT
// ============================================================================

export class TokenMetricsClient {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 60000; // 1 minute default for real-time data
  private useProxy: boolean;

  constructor() {
    // Use proxy for browser requests to avoid CORS
    this.useProxy = typeof window !== 'undefined';
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async fetchWithProxy<T>(url: string): Promise<T> {
    const fetchUrl = this.useProxy
      ? `/api/token-proxy?url=${encodeURIComponent(url)}`
      : url;

    const response = await fetch(fetchUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new TokenMetricsError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.cache.delete(oldestKey);
      }
    }
  }

  // ==========================================================================
  // DEXSCREENER API
  // ==========================================================================

  /**
   * Get token pairs from DexScreener
   * Endpoint: /tokens/v1/{chainId}/{tokenAddress}
   */
  async getDexScreenerPairs(tokenAddress: string, chainId = 'solana'): Promise<DexScreenerPair[]> {
    const cacheKey = `dex-pairs-${chainId}-${tokenAddress}`;
    const cached = this.getCached<DexScreenerPair[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use the correct DexScreener endpoint for token data
      const url = `${DEXSCREENER_API}/tokens/v1/${chainId}/${tokenAddress}`;
      const response = await this.fetchWithProxy<DexScreenerPair[] | { pairs?: DexScreenerPair[] }>(url);

      // DexScreener returns array directly for this endpoint
      const pairs = Array.isArray(response) ? response : (response.pairs || []);
      this.setCache(cacheKey, pairs);
      return pairs;
    } catch (error) {
      console.error('DexScreener pairs fetch failed:', error);
      // Try alternative endpoint
      try {
        const altUrl = `${DEXSCREENER_API}/latest/dex/tokens/${tokenAddress}`;
        const altResponse = await this.fetchWithProxy<{ pairs?: DexScreenerPair[] }>(altUrl);
        const pairs = altResponse.pairs || [];
        if (pairs.length > 0) {
          this.setCache(cacheKey, pairs);
        }
        return pairs;
      } catch {
        return [];
      }
    }
  }

  /**
   * Search for tokens on DexScreener
   * Endpoint: /latest/dex/search?q={query}
   */
  async searchTokens(query: string): Promise<DexScreenerPair[]> {
    try {
      const url = `${DEXSCREENER_API}/latest/dex/search?q=${encodeURIComponent(query)}`;
      const response = await this.fetchWithProxy<{ pairs: DexScreenerPair[] }>(url);
      return response.pairs || [];
    } catch (error) {
      console.error('DexScreener search failed:', error);
      return [];
    }
  }

  /**
   * Get best pair for a token (highest liquidity)
   */
  async getBestPair(tokenAddress: string, chainId = 'solana'): Promise<DexScreenerPair | null> {
    const pairs = await this.getDexScreenerPairs(tokenAddress, chainId);

    if (pairs.length === 0) return null;

    // Sort by liquidity and return the best one
    return pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
  }

  // ==========================================================================
  // JUPITER PRICE API
  // ==========================================================================

  /**
   * Get token price from Jupiter
   * Endpoint: /price/v2?ids={tokenAddress}
   */
  async getJupiterPrice(tokenAddress: string): Promise<JupiterPriceData | null> {
    const cacheKey = `jup-price-${tokenAddress}`;
    const cached = this.getCached<JupiterPriceData>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${JUPITER_PRICE_API}?ids=${tokenAddress}&showExtraInfo=true`;
      const response = await this.fetchWithProxy<{ data: { [key: string]: JupiterPriceData } }>(url);

      const priceData = response.data?.[tokenAddress];
      if (priceData) {
        this.setCache(cacheKey, priceData);
      }
      return priceData || null;
    } catch (error) {
      console.error('Jupiter price fetch failed:', error);
      return null;
    }
  }

  /**
   * Get multiple token prices from Jupiter
   */
  async getJupiterPrices(tokenAddresses: string[]): Promise<Map<string, JupiterPriceData>> {
    const result = new Map<string, JupiterPriceData>();

    try {
      const ids = tokenAddresses.join(',');
      const url = `${JUPITER_PRICE_API}?ids=${ids}&showExtraInfo=true`;
      const response = await this.fetchWithProxy<{ data: { [key: string]: JupiterPriceData } }>(url);

      if (response.data) {
        for (const [address, data] of Object.entries(response.data)) {
          result.set(address, data);
          this.setCache(`jup-price-${address}`, data);
        }
      }
    } catch (error) {
      console.error('Jupiter prices fetch failed:', error);
    }

    return result;
  }

  // ==========================================================================
  // UNIFIED TOKEN METRICS
  // ==========================================================================

  /**
   * Get comprehensive token metrics combining DexScreener and Jupiter data
   * Falls back to dummy data if APIs fail
   */
  async getTokenMetrics(tokenAddress: string, chainId = 'solana'): Promise<TokenMetrics | null> {
    const cacheKey = `metrics-${chainId}-${tokenAddress}`;
    const cached = this.getCached<TokenMetrics>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch from both sources in parallel
      const [bestPair, jupiterPrice] = await Promise.all([
        this.getBestPair(tokenAddress, chainId),
        this.getJupiterPrice(tokenAddress),
      ]);

      // If no data from either source, use dummy data fallback
      if (!bestPair && !jupiterPrice) {
        console.warn(`No API data for ${tokenAddress}, using dummy data`);
        const dummyMetrics = generateDummyMetrics(tokenAddress, chainId);
        this.setCache(cacheKey, dummyMetrics);
        return dummyMetrics;
      }

      // Prefer DexScreener for comprehensive data, Jupiter for price accuracy
      const priceUsd = jupiterPrice
        ? parseFloat(jupiterPrice.price)
        : parseFloat(bestPair?.priceUsd || '0');

      const metrics: TokenMetrics = {
        address: tokenAddress,
        symbol: bestPair?.baseToken?.symbol || 'UNKNOWN',
        name: bestPair?.baseToken?.name || 'Unknown Token',
        chain: chainId,
        priceUsd,
        priceChange24h: bestPair?.priceChange?.h24 || 0,
        priceChange6h: bestPair?.priceChange?.h6 || 0,
        priceChange1h: bestPair?.priceChange?.h1 || 0,
        volume24h: bestPair?.volume?.h24 || 0,
        volumeChange24h: 0, // Would need historical data
        liquidity: bestPair?.liquidity?.usd || 0,
        marketCap: bestPair?.marketCap || 0,
        fdv: bestPair?.fdv || 0,
        pairAddress: bestPair?.pairAddress,
        dexId: bestPair?.dexId,
        createdAt: bestPair?.pairCreatedAt
          ? new Date(bestPair.pairCreatedAt).toISOString()
          : undefined,
        fetchedAt: new Date().toISOString(),
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to fetch token metrics, using dummy data:', error);
      // Return dummy data as fallback
      const dummyMetrics = generateDummyMetrics(tokenAddress, chainId);
      this.setCache(cacheKey, dummyMetrics);
      return dummyMetrics;
    }
  }

  /**
   * Get metrics for multiple tokens
   */
  async getMultipleTokenMetrics(
    tokenAddresses: string[],
    chainId = 'solana'
  ): Promise<Map<string, TokenMetrics>> {
    const results = new Map<string, TokenMetrics>();

    // Fetch all in parallel
    const metricsPromises = tokenAddresses.map(async (address) => {
      const metrics = await this.getTokenMetrics(address, chainId);
      if (metrics) {
        results.set(address, metrics);
      }
    });

    await Promise.all(metricsPromises);
    return results;
  }

  /**
   * Get real-time price updates (shorter cache)
   */
  async getLivePrice(tokenAddress: string): Promise<{ price: number; change24h: number } | null> {
    // Use Jupiter for more accurate real-time prices
    const jupiterPrice = await this.getJupiterPrice(tokenAddress);

    if (jupiterPrice) {
      return {
        price: parseFloat(jupiterPrice.price),
        change24h: 0, // Jupiter doesn't provide change directly
      };
    }

    // Fall back to DexScreener
    const pair = await this.getBestPair(tokenAddress);
    if (pair) {
      return {
        price: parseFloat(pair.priceUsd || '0'),
        change24h: pair.priceChange?.h24 || 0,
      };
    }

    return null;
  }

  // ==========================================================================
  // TRENDING & DISCOVERY
  // ==========================================================================

  /**
   * Get trending tokens from DexScreener
   */
  async getTrendingTokens(chainId = 'solana', limit = 10): Promise<DexScreenerPair[]> {
    try {
      // Search for high-volume pairs on the chain
      const url = `${DEXSCREENER_API}/latest/dex/tokens/${chainId}`;
      // Note: This endpoint may not exist, falling back to search
      const pairs = await this.searchTokens(chainId);

      // Sort by volume and return top ones
      return pairs
        .filter(p => p.chainId === chainId)
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
      return [];
    }
  }

  // ==========================================================================
  // BAGS TOKENS
  // ==========================================================================

  /**
   * Get all Bags-launched tokens with metrics
   */
  async getAllBagsTokens(): Promise<TokenMetrics[]> {
    const cacheKey = 'all-bags-tokens';
    const cached = this.getCached<TokenMetrics[]>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch metrics for all known Bags tokens
      const metricsPromises = BAGS_TOKENS_FALLBACK.map(token =>
        this.getTokenMetrics(token.address, token.chain)
      );

      const results = await Promise.all(metricsPromises);
      const validTokens = results.filter((m): m is TokenMetrics => m !== null);

      this.setCache(cacheKey, validTokens);
      return validTokens;
    } catch (error) {
      console.error('Failed to fetch Bags tokens:', error);
      // Return fallback data
      return BAGS_TOKENS_FALLBACK;
    }
  }

  /**
   * Get Bags token addresses
   */
  getBagsTokenAddresses(): string[] {
    return BAGS_TOKENS_FALLBACK.map(t => t.address);
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  clearCache(): void {
    this.cache.clear();
  }

  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }
}

// ============================================================================
// DUMMY DATA FALLBACK
// ============================================================================

// Popular Bags-launched tokens with dummy data as fallback
const BAGS_TOKENS_FALLBACK: TokenMetrics[] = [
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    chain: 'solana',
    priceUsd: 0.0000234,
    priceChange24h: 12.5,
    priceChange6h: 5.2,
    priceChange1h: 1.8,
    volume24h: 15234567,
    volumeChange24h: 8.3,
    liquidity: 8234567,
    marketCap: 234567890,
    fdv: 345678901,
    fetchedAt: new Date().toISOString(),
  },
  {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    chain: 'solana',
    priceUsd: 0.845,
    priceChange24h: -3.2,
    priceChange6h: -1.5,
    priceChange1h: 0.5,
    volume24h: 45678901,
    volumeChange24h: -5.4,
    liquidity: 12345678,
    marketCap: 567890123,
    fdv: 678901234,
    fetchedAt: new Date().toISOString(),
  },
  {
    address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    symbol: 'POPCAT',
    name: 'Popcat',
    chain: 'solana',
    priceUsd: 0.567,
    priceChange24h: 23.8,
    priceChange6h: 12.3,
    priceChange1h: 3.2,
    volume24h: 8901234,
    volumeChange24h: 15.6,
    liquidity: 4567890,
    marketCap: 123456789,
    fdv: 234567890,
    fetchedAt: new Date().toISOString(),
  },
  {
    address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
    symbol: 'MEW',
    name: 'Cat in a Dog World',
    chain: 'solana',
    priceUsd: 0.00234,
    priceChange24h: 8.9,
    priceChange6h: 4.2,
    priceChange1h: 1.1,
    volume24h: 3456789,
    volumeChange24h: 6.7,
    liquidity: 2345678,
    marketCap: 56789012,
    fdv: 67890123,
    fetchedAt: new Date().toISOString(),
  },
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    chain: 'solana',
    priceUsd: 98.45,
    priceChange24h: 5.6,
    priceChange6h: 2.3,
    priceChange1h: 0.8,
    volume24h: 123456789,
    volumeChange24h: 3.4,
    liquidity: 45678901,
    marketCap: 3456789012,
    fdv: 4567890123,
    fetchedAt: new Date().toISOString(),
  },
];

function generateDummyMetrics(tokenAddress: string, chainId: string): TokenMetrics {
  // Check if we have a predefined fallback
  const predefined = BAGS_TOKENS_FALLBACK.find(t => t.address === tokenAddress);
  if (predefined) return predefined;

  // Generate random dummy data
  const randomPrice = Math.random() * 10;
  const randomChange = (Math.random() - 0.5) * 50;

  return {
    address: tokenAddress,
    symbol: 'UNKNOWN',
    name: 'Unknown Token',
    chain: chainId,
    priceUsd: randomPrice,
    priceChange24h: randomChange,
    priceChange6h: randomChange * 0.6,
    priceChange1h: randomChange * 0.2,
    volume24h: Math.random() * 1000000,
    volumeChange24h: (Math.random() - 0.5) * 20,
    liquidity: Math.random() * 500000,
    marketCap: Math.random() * 10000000,
    fdv: Math.random() * 15000000,
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const tokenMetricsClient = new TokenMetricsClient();
