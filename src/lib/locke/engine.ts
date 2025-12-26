// File: src/lib/locke/engine.ts

import { GateRule, GateEvaluation, LockeContext, HolderTier } from './types';
import { BagsAPI } from '../bags-api/client';

/**
 * Locke Engine: Universal token-gating system
 * 
 * Evaluates on-chain ownership against access rules
 * Supports multiple chains, complex logic, and dynamic reevaluation
 */
export class LockeEngine {
  private bagsAPI: BagsAPI;

  constructor(bagsAPI: BagsAPI) {
    this.bagsAPI = bagsAPI;
  }

  /**
   * Evaluate a single gate rule against user context
   */
  async evaluateRule(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    switch (rule.ruleType) {
      case 'token_ownership':
        return this.evaluateTokenOwnership(rule, context);
      
      case 'minimum_balance':
        return this.evaluateMinimumBalance(rule, context);
      
      case 'holder_tier':
        return this.evaluateHolderTier(rule, context);
      
      case 'combined':
        return this.evaluateCombined(rule, context);
      
      default:
        return {
          granted: false,
          reason: 'Unknown rule type'
        };
    }
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
        reason: anyGranted ? 'At least one requirement met' : 'No requirements met'
      };
    }
  }

  private async evaluateTokenOwnership(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    if (!rule.tokenAddress) {
      return { granted: false, reason: 'No token address specified' };
    }

    const holding = context.holdings.find(
      h => h.tokenAddress === rule.tokenAddress && h.chain === rule.chain
    );

    if (!holding || holding.balance === 0) {
      return {
        granted: false,
        reason: `You need to hold ${rule.tokenAddress}`,
        missingRequirements: [`Hold any amount of token ${rule.tokenAddress}`]
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
    if (!rule.tokenAddress || rule.minimumBalance === undefined) {
      return { granted: false, reason: 'Invalid rule configuration' };
    }

    const holding = context.holdings.find(
      h => h.tokenAddress === rule.tokenAddress && h.chain === rule.chain
    );

    const userBalance = holding?.balance || 0;

    if (userBalance < rule.minimumBalance) {
      return {
        granted: false,
        reason: `Insufficient balance`,
        missingRequirements: [
          `Hold at least ${rule.minimumBalance} tokens (you have ${userBalance})`
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
    if (!rule.tokenAddress || !rule.requiredTier) {
      return { granted: false, reason: 'Invalid tier rule' };
    }

    const holding = context.holdings.find(
      h => h.tokenAddress === rule.tokenAddress && h.chain === rule.chain
    );

    if (!holding) {
      return {
        granted: false,
        reason: 'Token not held',
        missingRequirements: [`Hold ${rule.tokenAddress}`]
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
      reason: `${holding.tier} tier verified`
    };
  }

  private async evaluateCombined(
    rule: GateRule,
    context: LockeContext
  ): Promise<GateEvaluation> {
    // Custom logic evaluation
    // This allows for complex rules defined in customLogic JSONB field
    // Example: (TokenA AND TokenB) OR (TokenC with minimum balance)
    
    if (!rule.customLogic) {
      return { granted: false, reason: 'No custom logic defined' };
    }

    // Implementation would parse customLogic and recursively evaluate
    // For MVP, return a placeholder
    return {
      granted: false,
      reason: 'Custom rule evaluation not yet implemented'
    };
  }

  /**
   * Refresh holdings from Bags API
   */
  async refreshContext(walletAddress: string, chain: Chain): Promise<LockeContext> {
    const holdings = await this.bagsAPI.getHoldings(walletAddress, chain);
    
    return {
      walletAddress,
      chain,
      holdings: holdings.map(h => ({
        tokenAddress: h.token_address,
        balance: h.balance,
        chain: h.chain as Chain,
        tier: this.calculateTier(h.balance, h.holder_rank)
      }))
    };
  }

  private calculateTier(balance: number, holderRank?: number): HolderTier {
    // Tier calculation logic based on balance percentiles
    // This would be customized per token/community
    
    if (balance > 1000000 || (holderRank && holderRank <= 10)) {
      return 'elite';
    } else if (balance > 100000 || (holderRank && holderRank <= 100)) {
      return 'whale';
    }
    
    return 'holder';
  }
}