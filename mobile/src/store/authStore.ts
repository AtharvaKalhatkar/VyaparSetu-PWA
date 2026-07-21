import { create } from 'zustand';
import { AuthService } from '../services/auth';
import type { User, Business } from '../types';

interface AuthState {
  user: User | null;
  business: Business | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, business: Business, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setBusiness: (business: Business | null) => void;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  business: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user, business, accessToken, refreshToken) => {
    await AuthService.setTokens(accessToken, refreshToken);
    await AuthService.setUser(user as unknown as Record<string, unknown>);
    await AuthService.setBusiness(business as unknown as Record<string, unknown>);
    set({
      user,
      business,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await AuthService.clearAll();
    set({
      user: null,
      business: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user) => set({ user }),

  setBusiness: (business) => set({ business }),

  updateTokens: async (accessToken, refreshToken) => {
    await AuthService.setTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  clearAuth: async () => {
    await AuthService.clearAll();
    set({
      user: null,
      business: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, user, business] = await Promise.all([
        AuthService.getAccessToken(),
        AuthService.getRefreshToken(),
        AuthService.getUser<User>(),
        AuthService.getBusiness<Business>(),
      ]);
      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshToken,
          user,
          business,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
