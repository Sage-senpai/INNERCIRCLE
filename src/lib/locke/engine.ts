// File: src/lib/locke/engine.ts
// ============================================================================
// Locke Engine: Production-ready token-gating system with Bags API
// ============================================================================

import { GateRule, GateEvaluation, LockeContext, HolderTier, Chain, TokenHolding } from './types';
import { BagsAPI, BagsHolding } from '../bags-api/client';

/**
 * Locke Engine: Universal token-gating system
 * 
 * Evaluates on-chain ownership against access rules
 * Supports multiple chains, complex logic, and dynamic reevaluation
 */
export class LockeEngine {
  private bagsAPI: BagsAPI;
  private contextCache: Map<string, { context: LockeContext; timestamp: number }> = new Map();
  private evaluationCache: Map<string, { evaluation: GateEvaluation; timestamp: number }> = new Map();
  private readonly CONTEXT_TTL = 30000; // 30 seconds
  private readonly EVALUATION_TTL = 60000; // 1 minute

  constructor(bagsAPI: BagsAPI) {
    this.bagsAPI = bagsAPI;
  }

  // ==========================================================================
  // MAIN EVALUATION METHODS
  // ==========================================================================

  /**
   * Evaluate a single gate rule against user context
   */
  async evaluateRule(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    const cacheKey = this.getEvaluationCacheKey(rule.id, context.walletAddress);
    const cached = this.getCachedEvaluation(cacheKey);
    if (cached) return cached;

    let evaluation: GateEvaluation;

    switch (rule.ruleType) {
      case 'token_ownership':
        evaluation = await this.evaluateTokenOwnership(rule, context);
        break;
      
      case 'minimum_balance':
        evaluation = await this.evaluateMinimumBalance(rule, context);
        break;
      
      case 'holder_tier':
        evaluation = await this.evaluateHolderTier(rule, context);
        break;
      
      case 'combined':
        evaluation = await this.evaluateCombined(rule, context);
        break;
      
      default:
        evaluation = {
          granted: false,
          reason: 'Unknown rule type'
        };
    }

    this.cacheEvaluation(cacheKey, evaluation);
    return evaluation;
  }

  /**
   * Evaluate multiple rules with AND/OR logic
   */
  async evaluateRules(
    rules: GateRule[],
    context: LockeContext,
    operator: 'AND' | 'OR' = 'AND'
  ): Promise<GateEvaluation> {
    if (rules.length === 0) {
      return { granted: true };
    }

    const evaluations = await Promise.all(
      rules.map(rule => this.evaluateRule(rule, context))
    );

    if (operator === 'AND') {
      const allGranted = evaluations.every(e => e.granted);
      const failedEvaluations = evaluations.filter(e => !e.granted);
      
      return {
        granted: allGranted,
        reason: allGranted ? 'All requirements met' : 'Missing requirements',
        missingRequirements: failedEvaluations.flatMap(e => e.missingRequirements || [])
      };
    } else {
      const anyGranted = evaluations.some(e => e.granted);
      
      return {
        granted: anyGranted,
        reason: anyGranted ? 'At least one requirement met' : 'No requirements met',
        missingRequirements: anyGranted ? undefined : evaluations.flatMap(e => e.missingRequirements || [])
      };
    }
  }

  // ==========================================================================
  // RULE TYPE EVALUATORS
  // ==========================================================================

  private async evaluateTokenOwnership(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    if (!rule.tokenAddress || !rule.chain) {
      return { granted: false, reason: 'Invalid rule configuration' };
    }

    const holding = context.holdings.find(
      h => h.tokenAddress.toLowerCase() === rule.tokenAddress!.toLowerCase() && 
           h.chain === rule.chain
    );

    if (!holding || holding.balance === 0) {
      return {
        granted: false,
        reason: `Requires ownership of token`,
        missingRequirements: [`Hold any amount of ${rule.tokenAddress.slice(0, 8)}...`]
      };
    }

    return {
      granted: true,
      reason: 'Token ownership verified',
      userBalance: holding.balance
    };
  }

  private async evaluateMinimumBalance(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    if (!rule.tokenAddress || !rule.chain || rule.minimumBalance === undefined) {
      return { granted: false, reason: 'Invalid rule configuration' };
    }

    const holding = context.holdings.find(
      h => h.tokenAddress.toLowerCase() === rule.tokenAddress!.toLowerCase() && 
           h.chain === rule.chain
    );

    const userBalance = holding?.balance || 0;

    if (userBalance < rule.minimumBalance) {
      return {
        granted: false,
        reason: `Insufficient balance`,
        missingRequirements: [
          `Hold at least ${this.formatNumber(rule.minimumBalance)} tokens (you have ${this.formatNumber(userBalance)})`
        ],
        userBalance,
        requiredBalance: rule.minimumBalance
      };
    }

    return {
      granted: true,
      reason: 'Minimum balance met',
      userBalance,
      requiredBalance: rule.minimumBalance
    };
  }

  private async evaluateHolderTier(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    if (!rule.tokenAddress || !rule.chain || !rule.requiredTier) {
      return { granted: false, reason: 'Invalid tier rule' };
    }

    const holding = context.holdings.find(
      h => h.tokenAddress.toLowerCase() === rule.tokenAddress!.toLowerCase() && 
           h.chain === rule.chain
    );

    if (!holding) {
      return {
        granted: false,
        reason: 'Token not held',
        missingRequirements: [`Hold ${rule.tokenAddress.slice(0, 8)}...`]
      };
    }

    const tierHierarchy: Record<HolderTier, number> = {
      'holder': 1,
      'whale': 2,
      'elite': 3
    };

    const userTierLevel = tierHierarchy[holding.tier || 'holder'];
    const requiredTierLevel = tierHierarchy[rule.requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return {
        granted: false,
        reason: `Requires ${rule.requiredTier} tier`,
        missingRequirements: [
          `Achieve ${rule.requiredTier} tier (you are ${holding.tier || 'holder'})`
        ]
      };
    }

    return {
      granted: true,
      reason: `${holding.tier || 'holder'} tier verified`
    };
  }

  private async evaluateCombined(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    if (!rule.customLogic || !rule.customLogic.rules) {
      return { granted: false, reason: 'No custom logic defined' };
    }

    const subRules = rule.customLogic.rules as GateRule[];
    const operator = (rule.customLogic.operator || 'AND') as 'AND' | 'OR';

    return this.evaluateRules(subRules, context, operator);
  }

  // ==========================================================================
  // CONTEXT MANAGEMENT
  // ==========================================================================

  /**
   * Build context from wallet address (fetches from Bags API)
   */
  async buildContext(walletAddress: string, chain: Chain): Promise<LockeContext> {
    const cacheKey = `${walletAddress}-${chain}`;
    const cached = this.getCachedContext(cacheKey);
    if (cached) return cached;

    try {
      const holdingsResponse = await this.bagsAPI.getHoldings(walletAddress, chain, true);
      
      const holdings: TokenHolding[] = holdingsResponse.holdings.map(h => ({
        tokenAddress: h.token_address,
        balance: h.balance,
        chain: h.chain as Chain,
        tier: this.bagsAPI.calculateTier(h.balance, h.holder_rank, h.percentage_of_supply),
        balanceUsd: h.balance_usd,
        holderRank: h.holder_rank,
        percentageOfSupply: h.percentage_of_supply
      }));

      const context: LockeContext = {
        walletAddress,
        chain,
        holdings,
        totalValueUsd: holdingsResponse.total_value_usd,
        fetchedAt: holdingsResponse.fetched_at
      };

      this.cacheContext(cacheKey, context);
      return context;
    } catch (error) {
      console.error('Failed to build context:', error);
      
      // Return empty context on error
      return {
        walletAddress,
        chain,
        holdings: [],
        totalValueUsd: 0,
        fetchedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Refresh context (force fetch from Bags API)
   */
  async refreshContext(walletAddress: string, chain: Chain): Promise<LockeContext> {
    const cacheKey = `${walletAddress}-${chain}`;
    this.contextCache.delete(cacheKey);
    this.bagsAPI.clearWalletCache(walletAddress);
    return this.buildContext(walletAddress, chain);
  }

  /**
   * Build multi-chain context
   */
  async buildMultiChainContext(walletAddress: string): Promise<LockeContext> {
    try {
      const portfolio = await this.bagsAPI.getPortfolio(walletAddress);
      
      const holdings: TokenHolding[] = portfolio.all_holdings.map(h => ({
        tokenAddress: h.token_address,
        balance: h.balance,
        chain: h.chain as Chain,
        tier: this.bagsAPI.calculateTier(h.balance, h.holder_rank, h.percentage_of_supply),
        balanceUsd: h.balance_usd,
        holderRank: h.holder_rank,
        percentageOfSupply: h.percentage_of_supply
      }));

      return {
        walletAddress,
        chain: 'solana', // Default chain
        holdings,
        totalValueUsd: portfolio.total_value_usd,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to build multi-chain context:', error);
      return this.buildContext(walletAddress, 'solana');
    }
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  private getCachedContext(key: string): LockeContext | null {
    const cached = this.contextCache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CONTEXT_TTL;
    if (isExpired) {
      this.contextCache.delete(key);
      return null;
    }
    
    return cached.context;
  }

  private cacheContext(key: string, context: LockeContext): void {
    this.contextCache.set(key, {
      context,
      timestamp: Date.now()
    });
  }

  private getCachedEvaluation(key: string): GateEvaluation | null {
    const cached = this.evaluationCache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.EVALUATION_TTL;
    if (isExpired) {
      this.evaluationCache.delete(key);
      return null;
    }
    
    return cached.evaluation;
  }

  private cacheEvaluation(key: string, evaluation: GateEvaluation): void {
    this.evaluationCache.set(key, {
      evaluation,
      timestamp: Date.now()
    });
  }

  private getEvaluationCacheKey(ruleId: string, walletAddress: string): string {
    return `${ruleId}-${walletAddress}`;
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.contextCache.clear();
    this.evaluationCache.clear();
    this.bagsAPI.clearCache();
  }

  /**
   * Clear caches for specific wallet
   */
  clearWalletCaches(walletAddress: string): void {
    // Clear context cache
    for (const [key] of this.contextCache) {
      if (key.includes(walletAddress)) {
        this.contextCache.delete(key);
      }
    }
    
    // Clear evaluation cache
    for (const [key] of this.evaluationCache) {
      if (key.includes(walletAddress)) {
        this.evaluationCache.delete(key);
      }
    }
    
    this.bagsAPI.clearWalletCache(walletAddress);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  }

  /**
   * Quick verification helper
   */
  async verifyTokenOwnership(
    walletAddress: string,
    tokenAddress: string,
    chain: Chain,
    minimumBalance?: number
  ): Promise<boolean> {
    return this.bagsAPI.verifyOwnership(walletAddress, tokenAddress, chain, minimumBalance);
  }

  /**
   * Get context statistics
   */
  getCacheStats() {
    return {
      contextCacheSize: this.contextCache.size,
      evaluationCacheSize: this.evaluationCache.size,
      contextTTL: this.CONTEXT_TTL,
      evaluationTTL: this.EVALUATION_TTL
    };
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

import { bagsAPI } from '../bags-api/client';
export const lockeEngine = new LockeEngine(bagsAPI);