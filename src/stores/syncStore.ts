import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingItemsCount: number;
  syncError: string | null;
  setSyncStatus: (isSyncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  setPendingCount: (count: number) => void;
  setSyncError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  isSyncing: false,
  lastSyncTime: null,
  pendingItemsCount: 0,
  syncError: null,
  setSyncStatus: (isSyncing) => set({ isSyncing }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setPendingCount: (count) => set({ pendingItemsCount: count }),
  setSyncError: (error) => set({ syncError: error }),
}));
