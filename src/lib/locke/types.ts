// File: src/lib/locke/types.ts

export type Chain = 'solana' | 'polkadot';

export type RuleType = 
  | 'token_ownership'
  | 'minimum_balance'
  | 'holder_tier'
  | 'combined';

export type HolderTier = 'holder' | 'whale' | 'elite';

export interface GateRule {
  id: string;
  ruleType: RuleType;
  tokenAddress?: string;
  chain?: Chain;
  minimumBalance?: number;
  requiredTier?: HolderTier;
  customLogic?: Record<string, any>;
}

export interface GateEvaluation {
  granted: boolean;
  reason?: string;
  missingRequirements?: string[];
  userBalance?: number;
  requiredBalance?: number;
}

export interface LockeContext {
  walletAddress: string;
  chain: Chain;
  holdings: TokenHolding[];
}

export interface TokenHolding {
  tokenAddress: string;
  balance: number;
  chain: Chain;
  tier?: HolderTier;
}