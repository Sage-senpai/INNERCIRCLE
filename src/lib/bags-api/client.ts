// File: src/lib/bags-api/client.ts

import { Chain } from '../locke/types';

interface BagsHolding {
  token_address: string;
  balance: number;
  chain: string;
  holder_rank?: number;
  last_updated: string;
}

interface BagsTokenMetrics {
  token_address: string;
  price_usd: number;
  holder_count: number;
  volume_24h: number;
  market_cap: number;
}

/**
 * Bags API Client
 * 
 * Interfaces with Bags API for token verification and metrics
 */
export class BagsAPI {
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.baseURL = process.env.NEXT_PUBLIC_BAGS_API_URL || 'https://api.bags.dev';
    this.apiKey = apiKey;
  }

  async getHoldings(walletAddress: string, chain: Chain): Promise<BagsHolding[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/v1/holdings/${chain}/${walletAddress}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Bags API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.holdings || [];
    } catch (error) {
      console.error('Failed to fetch holdings:', error);
      return [];
    }
  }

  async getTokenMetrics(tokenAddress: string, chain: Chain): Promise<BagsTokenMetrics | null> {
    try {
      const response = await fetch(
        `${this.baseURL}/v1/tokens/${chain}/${tokenAddress}/metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch token metrics:', error);
      return null;
    }
  }

  async verifyOwnership(
    walletAddress: string,
    tokenAddress: string,
    chain: Chain,
    minimumBalance?: number
  ): Promise<boolean> {
    const holdings = await this.getHoldings(walletAddress, chain);
    const holding = holdings.find(h => h.token_address === tokenAddress);
    
    if (!holding) return false;
    if (minimumBalance !== undefined && holding.balance < minimumBalance) return false;
    
    return true;
  }
}