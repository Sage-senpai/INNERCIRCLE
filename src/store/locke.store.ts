// File: src/store/locke.store.ts

import { create } from 'zustand';
import { LockeContext, GateEvaluation } from '@/lib/locke/types';

interface LockeState {
  context: LockeContext | null;
  evaluationCache: Map<string, GateEvaluation>;
  
  setContext: (context: LockeContext) => void;
  cacheEvaluation: (ruleId: string, evaluation: GateEvaluation) => void;
  getEvaluation: (ruleId: string) => GateEvaluation | undefined;
  clearCache: () => void;
}

export const useLockeStore = create<LockeState>((set, get) => ({
  context: null,
  evaluationCache: new Map(),
  
  setContext: (context) => set({ context }),
  
  cacheEvaluation: (ruleId, evaluation) => set((state) => {
    const newCache = new Map(state.evaluationCache);
    newCache.set(ruleId, evaluation);
    return { evaluationCache: newCache };
  }),
  
  getEvaluation: (ruleId) => get().evaluationCache.get(ruleId),
  
  clearCache: () => set({ evaluationCache: new Map() })
}));