// File: src/lib/wallets/adapter.ts

export type WalletAdapter = 'phantom' | 'solflare' | 'polkadot-js' | 'talisman';

export interface WalletConnection {
  address: string;
  chain: 'solana' | 'polkadot';
  adapter: WalletAdapter;
}

export class WalletManager {
  async connect(adapter: WalletAdapter): Promise<WalletConnection> {
    switch (adapter) {
      case 'phantom':
        return this.connectPhantom();
      case 'solflare':
        return this.connectSolflare();
      case 'polkadot-js':
        return this.connectPolkadotJS();
      case 'talisman':
        return this.connectTalisman();
      default:
        throw new Error('Unsupported wallet adapter');
    }
  }

  private async connectPhantom(): Promise<WalletConnection> {
    if (typeof window === 'undefined' || !window.solana?.isPhantom) {
      throw new Error('Phantom wallet not found');
    }

    const response = await window.solana.connect();
    return {
      address: response.publicKey.toString(),
      chain: 'solana',
      adapter: 'phantom'
    };
  }

  private async connectSolflare(): Promise<WalletConnection> {
    if (typeof window === 'undefined' || !window.solflare) {
      throw new Error('Solflare wallet not found');
    }

    await window.solflare.connect();
    return {
      address: window.solflare.publicKey.toString(),
      chain: 'solana',
      adapter: 'solflare'
    };
  }

  private async connectPolkadotJS(): Promise<WalletConnection> {
    // Polkadot.js extension integration
    // This is a simplified version - production would use @polkadot/extension-dapp
    throw new Error('Polkadot.js integration pending');
  }

  private async connectTalisman(): Promise<WalletConnection> {
    // Talisman wallet integration
    throw new Error('Talisman integration pending');
  }

  async disconnect(): Promise<void> {
    if (window.solana?.disconnect) {
      await window.solana.disconnect();
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!window.solana) {
      throw new Error('No wallet connected');
    }

    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await window.solana.signMessage(encodedMessage);
    return Buffer.from(signedMessage.signature).toString('hex');
  }
}