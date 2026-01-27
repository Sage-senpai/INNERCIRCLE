// File: src/store/auth.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LinkedWallet {
  walletAddress: string;
  chain: string;
  isPrimary: boolean;
  verifiedAt: string;
}

export interface User {
  id: string;
  walletAddress: string; // Current connected wallet
  primaryWalletAddress: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'member' | 'admin';
  onboardingCompleted: boolean;
  linkedWallets?: LinkedWallet[];
}

interface AuthState {
  user: User | null;
  isConnecting: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setConnecting: (connecting: boolean) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isConnecting: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      updateUserProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'innercircle-auth',
    }
  )
);