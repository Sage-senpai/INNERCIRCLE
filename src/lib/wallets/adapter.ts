// File: src/lib/wallets/adapter.ts
// ============================================================================
// Wallet Connection Manager - Fixed Error Handling
// ============================================================================

export interface WalletConnection {
  address: string;
  chain: 'solana' | 'ethereum';
  publicKey?: string;
}

export type WalletAdapter = 'phantom' | 'solflare' | 'metamask';

interface SolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  providers?: SolanaProvider[];
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect?: () => Promise<void>;
  signMessage?: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
  publicKey?: { toString: () => string };
  isConnected?: boolean;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  selectedAddress?: string | null;
}

// Extend Window interface to include wallet objects
declare global {
  interface Window {
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
    phantom?: {
      solana?: SolanaProvider;
    };
    ethereum?: EthereumProvider;
  }
}

export class WalletManager {
  private getPhantomProvider(): SolanaProvider | null {
    if (typeof window === 'undefined') return null;

    if (window.phantom?.solana?.isPhantom) {
      return window.phantom.solana;
    }

    if (window.solana?.isPhantom) {
      return window.solana;
    }

    if (Array.isArray(window.solana?.providers)) {
      return window.solana?.providers?.find((provider) => provider?.isPhantom) || null;
    }

    return null;
  }

  private getSolflareProvider(): SolanaProvider | null {
    if (typeof window === 'undefined') return null;

    if (window.solflare?.isSolflare) {
      return window.solflare;
    }

    if (window.solana?.isSolflare) {
      return window.solana;
    }

    if (Array.isArray(window.solana?.providers)) {
      return window.solana?.providers?.find((provider) => provider?.isSolflare) || null;
    }

    return null;
  }

  /**
   * Main connection method - routes to specific adapter
   */
  async connect(adapter: WalletAdapter): Promise<WalletConnection> {
    switch (adapter) {
      case 'phantom':
        return this.connectPhantom();
      case 'solflare':
        return this.connectSolflare();
      case 'metamask':
        return this.connectMetamask();
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

      const provider = this.getPhantomProvider();

      if (!provider) {
        throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app');
      }

      // Check if already connected
      if (provider.isConnected && provider.publicKey) {
        console.log('Phantom already connected');
        return {
          address: provider.publicKey.toString(),
          chain: 'solana',
          publicKey: provider.publicKey.toString(),
        };
      }

      // Attempt connection with timeout
      const connectionPromise = provider.connect({ onlyIfTrusted: false });
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

      const provider = this.getSolflareProvider();

      if (!provider) {
        throw new Error('Solflare wallet is not installed. Please install it from https://solflare.com');
      }

      // Check if already connected
      if (provider.isConnected && provider.publicKey) {
        console.log('Solflare already connected');
        return {
          address: provider.publicKey.toString(),
          chain: 'solana',
          publicKey: provider.publicKey.toString(),
        };
      }

      // Attempt connection with timeout
      const connectionPromise = provider.connect();
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
   * MetaMask Wallet Connection
   */
  private async connectMetamask(): Promise<WalletConnection> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask wallet is not installed. Please install it from https://metamask.io');
      }

      if (!window.ethereum.isMetaMask) {
        throw new Error('Detected wallet is not MetaMask. Please use MetaMask wallet.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = Array.isArray(accounts) ? accounts[0] : null;

      if (!address) {
        throw new Error('Failed to get wallet address from MetaMask');
      }

      console.log('MetaMask connected successfully:', address);

      return {
        address,
        chain: 'ethereum',
        publicKey: address,
      };
    } catch (error: any) {
      console.error('MetaMask connection error:', error);

      if (error.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection in your MetaMask wallet.');
      }

      if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check your MetaMask wallet.');
      }

      throw new Error(error.message || 'Failed to connect to MetaMask wallet. Please try again.');
    }
  }

  /**
   * Sign a message with the connected wallet (for SIWS verification)
   */
  async signMessage(adapter: WalletAdapter, message: string): Promise<string> {
    const encodedMessage = new TextEncoder().encode(message);

    if (adapter === 'phantom' || adapter === 'solflare') {
      const provider =
        adapter === 'phantom'
          ? this.getPhantomProvider()
          : this.getSolflareProvider();

      if (!provider?.signMessage) {
        throw new Error(`${adapter} does not support message signing`);
      }

      const { signature } = await provider.signMessage(encodedMessage, 'utf8');
      // Return as base64 for transport
      return Buffer.from(signature).toString('base64');
    }

    throw new Error(`Message signing not supported for ${adapter}`);
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(adapter: WalletAdapter): Promise<void> {
    try {
      switch (adapter) {
        case 'phantom':
          {
            const provider = this.getPhantomProvider();
            if (provider?.disconnect) {
              await provider.disconnect();
            }
          }
          break;
        case 'solflare':
          {
            const provider = this.getSolflareProvider();
            if (provider?.disconnect) {
              await provider.disconnect();
            }
          }
          break;
        case 'metamask':
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
        return !!this.getPhantomProvider();
      case 'solflare':
        return !!this.getSolflareProvider();
      case 'metamask':
        return !!window.ethereum?.isMetaMask;
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
        return this.getPhantomProvider()?.publicKey?.toString() || null;
      case 'solflare':
        return this.getSolflareProvider()?.publicKey?.toString() || null;
      case 'metamask':
        return window.ethereum?.selectedAddress || null;
      default:
        return null;
    }
  }
}
