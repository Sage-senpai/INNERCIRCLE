// File: src/store/auth.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  walletAddress: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'member' | 'admin';
  onboardingCompleted: boolean;
}

interface AuthState {
  user: User | null;
  isConnecting: boolean;
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  setConnecting: (connecting: boolean) => void;
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
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: 'innercircle-auth'
    }
  )
);