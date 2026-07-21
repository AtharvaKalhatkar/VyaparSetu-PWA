import { create } from 'zustand';
import type { Business, BusinessSettings } from '../types';

interface BusinessState {
  currentBusiness: Business | null;
  businesses: Business[];
  settings: BusinessSettings | null;
  config: Record<string, string>;
  setCurrentBusiness: (business: Business | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  updateSettings: (settings: Partial<BusinessSettings>) => void;
  updateConfig: (config: Record<string, string>) => void;
  reset: () => void;
}

const initialState = {
  currentBusiness: null,
  businesses: [],
  settings: null,
  config: {},
};

export const useBusinessStore = create<BusinessState>((set) => ({
  ...initialState,

  setCurrentBusiness: (business) => set({ currentBusiness: business }),

  setBusinesses: (businesses) => set({ businesses }),

  updateSettings: (settings) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...settings } : (settings as BusinessSettings),
    })),

  updateConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),

  reset: () => set(initialState),
}));
