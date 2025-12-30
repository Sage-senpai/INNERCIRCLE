//UPDATED LOCKE STORE (src/store/locke.store.ts)


import { create } from 'zustand';
import { LockeContext, GateEvaluation, Chain } from '@/lib/locke/types';
import { lockeEngine } from '@/lib/locke/engine';

interface LockeState {
  context: LockeContext | null;
  isLoadingContext: boolean;
  
  setContext: (context: LockeContext) => void;
  buildContext: (walletAddress: string, chain: Chain) => Promise<void>;
  refreshContext: (walletAddress: string, chain: Chain) => Promise<void>;
  clearContext: () => void;
}

export const useLockeStore = create<LockeState>((set, get) => ({
  context: null,
  isLoadingContext: false,
  
  setContext: (context) => set({ context }),
  
  buildContext: async (walletAddress, chain) => {
    set({ isLoadingContext: true });
    try {
      const context = await lockeEngine.buildContext(walletAddress, chain);
      set({ context, isLoadingContext: false });
    } catch (error) {
      console.error('Failed to build context:', error);
      set({ isLoadingContext: false });
    }
  },
  
  refreshContext: async (walletAddress, chain) => {
    set({ isLoadingContext: true });
    try {
      const context = await lockeEngine.refreshContext(walletAddress, chain);
      set({ context, isLoadingContext: false });
    } catch (error) {
      console.error('Failed to refresh context:', error);
      set({ isLoadingContext: false });
    }
  },
  
  clearContext: () => {
    set({ context: null });
    lockeEngine.clearAllCaches();
  },
}));
