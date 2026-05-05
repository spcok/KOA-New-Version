import { create } from 'zustand';

interface SyncState {
  pullFromCloud: () => Promise<void>;
  startBackgroundWorker: () => void;
}

export const useSyncStore = create<SyncState>(() => ({
  pullFromCloud: async () => {
    // V3: Temporary stub. We will activate Electric SQL in Phase 4.
    console.log("[Sync Engine] pullFromCloud triggered - Currently in Offline-Only Mode.");
  },
  startBackgroundWorker: () => {
    // V3: Temporary stub.
    console.log("[Sync Engine] Background worker triggered - Currently in Offline-Only Mode.");
  }
}));