import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  incrementPending: () => void;
  decrementPending: () => void;
  setSyncing: (syncing: boolean) => void;
  setLastSynced: (timestamp: string) => void;
  reset: () => void;
}

const initialState = {
  isOnline: true,
  pendingSyncCount: 0,
  lastSyncedAt: null,
  isSyncing: false,
};

export const useSyncStore = create<SyncState>((set) => ({
  ...initialState,

  setOnline: (online) => set({ isOnline: online }),

  incrementPending: () =>
    set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 })),

  decrementPending: () =>
    set((state) => ({
      pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
    })),

  setSyncing: (syncing) => set({ isSyncing: syncing }),

  setLastSynced: (timestamp) => set({ lastSyncedAt: timestamp }),

  reset: () => set(initialState),
}));
