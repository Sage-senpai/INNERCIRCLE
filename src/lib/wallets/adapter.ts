// File: src/lib/wallets/adapter.ts
// ============================================================================
// Wallet Connection Manager - Fixed Error Handling
// ============================================================================

export interface WalletConnection {
  address: string;
  chain: 'solana';
  publicKey?: string;
}

export type WalletAdapter = 'phantom' | 'solflare';

// Extend Window interface to include wallet objects
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
      isConnected?: boolean;
    };
    solflare?: {
      isSolflare?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      publicKey?: { toString: () => string };
      isConnected?: boolean;
    };
  }
}

export class WalletManager {
  /**
   * Main connection method - routes to specific adapter
   */
  async connect(adapter: WalletAdapter): Promise<WalletConnection> {
    switch (adapter) {
      case 'phantom':
        return this.connectPhantom();
      case 'solflare':
        return this.connectSolflare();
      default:
        throw new Error(`Unsupported wallet adapter: ${adapter}`);
    }
  }

  /**
   * Phantom Wallet Connection - Fixed with proper error handling
   */
  private async connectPhantom(): Promise<WalletConnection> {
    try {
      // Check if Phantom is installed
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      if (!window.solana) {
        throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app');
      }

      if (!window.solana.isPhantom) {
        throw new Error('Detected wallet is not Phantom. Please use Phantom wallet.');
      }

      // Check if already connected
      if (window.solana.isConnected && window.solana.publicKey) {
        console.log('Phantom already connected');
        return {
          address: window.solana.publicKey.toString(),
          chain: 'solana',
          publicKey: window.solana.publicKey.toString(),
        };
      }

      // Attempt connection with timeout
      const connectionPromise = window.solana.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout. Please try again.')), 30000);
      });

      const response = await Promise.race([connectionPromise, timeoutPromise]);

      if (!response || !response.publicKey) {
        throw new Error('Failed to get wallet address from Phantom');
      }

      const address = response.publicKey.toString();
      console.log('Phantom connected successfully:', address);

      return {
        address,
        chain: 'solana',
        publicKey: address,
      };
    } catch (error: any) {
      console.error('Phantom connection error:', error);

      // Handle specific error cases
      if (error.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in your Phantom wallet.');
      }

      if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check your Phantom wallet.');
      }

      if (error.message?.includes('User rejected')) {
        throw new Error('Connection rejected. Please approve the connection in your Phantom wallet.');
      }

      // Re-throw with user-friendly message
      throw new Error(error.message || 'Failed to connect to Phantom wallet. Please try again.');
    }
  }

  /**
   * Solflare Wallet Connection - Fixed with proper error handling
   */
  private async connectSolflare(): Promise<WalletConnection> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      if (!window.solflare) {
        throw new Error('Solflare wallet is not installed. Please install it from https://solflare.com');
      }

      if (!window.solflare.isSolflare) {
        throw new Error('Detected wallet is not Solflare. Please use Solflare wallet.');
      }

      // Check if already connected
      if (window.solflare.isConnected && window.solflare.publicKey) {
        console.log('Solflare already connected');
        return {
          address: window.solflare.publicKey.toString(),
          chain: 'solana',
          publicKey: window.solflare.publicKey.toString(),
        };
      }

      // Attempt connection with timeout
      const connectionPromise = window.solflare.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout. Please try again.')), 30000);
      });

      const response = await Promise.race([connectionPromise, timeoutPromise]);

      if (!response || !response.publicKey) {
        throw new Error('Failed to get wallet address from Solflare');
      }

      const address = response.publicKey.toString();
      console.log('Solflare connected successfully:', address);

      return {
        address,
        chain: 'solana',
        publicKey: address,
      };
    } catch (error: any) {
      console.error('Solflare connection error:', error);

      if (error.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in your Solflare wallet.');
      }

      if (error.message?.includes('User rejected')) {
        throw new Error('Connection rejected. Please approve the connection in your Solflare wallet.');
      }

      throw new Error(error.message || 'Failed to connect to Solflare wallet. Please try again.');
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(adapter: WalletAdapter): Promise<void> {
    try {
      switch (adapter) {
        case 'phantom':
          if (window.solana?.disconnect) {
            await window.solana.disconnect();
          }
          break;
        case 'solflare':
          if (window.solflare?.disconnect) {
            await window.solflare.disconnect();
          }
          break;
      }
      console.log(`Disconnected from ${adapter}`);
    } catch (error) {
      console.error('Disconnect error:', error);
      throw new Error('Failed to disconnect wallet');
    }
  }

  /**
   * Check if a specific wallet is installed
   */
  isWalletInstalled(adapter: WalletAdapter): boolean {
    if (typeof window === 'undefined') return false;

    switch (adapter) {
      case 'phantom':
        return !!(window.solana?.isPhantom);
      case 'solflare':
        return !!(window.solflare?.isSolflare);
      default:
        return false;
    }
  }

  /**
   * Get currently connected address if any
   */
  getConnectedAddress(adapter: WalletAdapter): string | null {
    if (typeof window === 'undefined') return null;

    switch (adapter) {
      case 'phantom':
        return window.solana?.publicKey?.toString() || null;
      case 'solflare':
        return window.solflare?.publicKey?.toString() || null;
      default:
        return null;
    }
  }
}