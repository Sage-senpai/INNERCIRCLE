// File: src/lib/solana/token-verification.ts
// ============================================================================
// Solana RPC token balance verification for token gating
// Uses getParsedTokenAccountsByOwner for SPL token balance checks
// ============================================================================

import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://api.mainnet-beta.solana.com';

const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);

let connectionInstance: Connection | null = null;

function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(SOLANA_RPC_URL, 'confirmed');
  }
  return connectionInstance;
}

export interface SPLTokenBalance {
  tokenAddress: string;
  balance: number;
  decimals: number;
  uiAmount: number;
}

/**
 * Get the balance of a specific SPL token for a wallet
 */
export async function getSPLTokenBalance(
  walletAddress: string,
  tokenMintAddress: string
): Promise<number> {
  const connection = getConnection();

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(tokenMintAddress) },
      'confirmed'
    );

    if (tokenAccounts.value.length === 0) return 0;

    return tokenAccounts.value.reduce((total, account) => {
      const parsed = account.account.data.parsed;
      return total + (parsed.info.tokenAmount.uiAmount ?? 0);
    }, 0);
  } catch (error) {
    console.error(
      `Failed to get SPL token balance for ${walletAddress}:`,
      error
    );
    return 0;
  }
}

/**
 * Get all SPL token balances for a wallet
 */
export async function getAllSPLTokenBalances(
  walletAddress: string
): Promise<SPLTokenBalance[]> {
  const connection = getConnection();

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { programId: TOKEN_PROGRAM_ID },
      'confirmed'
    );

    return tokenAccounts.value
      .map((account) => {
        const parsed = account.account.data.parsed;
        const info = parsed.info;
        return {
          tokenAddress: info.mint as string,
          balance: Number(info.tokenAmount.amount),
          decimals: info.tokenAmount.decimals as number,
          uiAmount: (info.tokenAmount.uiAmount ?? 0) as number,
        };
      })
      .filter((t) => t.uiAmount > 0);
  } catch (error) {
    console.error(
      `Failed to get all SPL token balances for ${walletAddress}:`,
      error
    );
    return [];
  }
}

/**
 * Verify that a wallet holds at least `minimumBalance` of a given token
 */
export async function verifyTokenHolding(
  walletAddress: string,
  tokenMintAddress: string,
  minimumBalance: number = 0
): Promise<boolean> {
  const balance = await getSPLTokenBalance(walletAddress, tokenMintAddress);
  return balance >= minimumBalance;
}

/**
 * Get SOL balance for a wallet (in SOL, not lamports)
 */
export async function getSOLBalance(walletAddress: string): Promise<number> {
  const connection = getConnection();

  try {
    const balance = await connection.getBalance(
      new PublicKey(walletAddress),
      'confirmed'
    );
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error(`Failed to get SOL balance for ${walletAddress}:`, error);
    return 0;
  }
}
