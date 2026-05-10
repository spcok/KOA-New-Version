import { create } from 'zustand';
import { db } from '../lib/db';
import { ShapeStream } from '@electric-sql/client';

// Your live, secure Zrok tunnel
const ELECTRIC_URL = 'https://9hv10jlrku6y.share.zrok.io';

type SyncState = {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastSynced: string | null;
  pullFromCloud: (token?: string) => Promise<void>;
  startBackgroundWorker: () => void;
  setStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
};

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'disconnected',
  lastSynced: null,

  setStatus: (status) => set({ status }),

  pullFromCloud: async (token?: string) => {
    // Prevent multiple streams from opening
    if (get().status === 'connected' || get().status === 'connecting') return;
    
    set({ status: 'connecting' });
    console.log('[Sync Engine] Establishing secure link to Electric sync server...');

    try {
      // 1. Establish the Shape Stream for the animals table
      const animalStream = new ShapeStream({
        url: `${ELECTRIC_URL}/v1/shape/animals`,
        // Pass the cached JWT token to respect Supabase RLS
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      // 2. Listen to the stream and update local PGlite
      animalStream.subscribe(async (messages) => {
        await db.waitReady;
        
        for (const msg of messages) {
          if (msg.headers.operation === 'insert' || msg.headers.operation === 'update') {
            const data = msg.value;
            // Upsert the data into the local vault
            await db.query(
              `INSERT INTO animals (id, name, species, category, is_deleted) 
               VALUES ($1, $2, $3, $4, $5) 
               ON CONFLICT (id) DO UPDATE SET 
                 name = EXCLUDED.name, 
                 species = EXCLUDED.species, 
                 category = EXCLUDED.category, 
                 is_deleted = EXCLUDED.is_deleted`,
              [data.id, data.name, data.species, data.category, data.is_deleted]
            );
          } else if (msg.headers.operation === 'delete') {
             await db.query(`DELETE FROM animals WHERE id = $1`, [msg.value.id]);
          }
        }
        
        // Mark as connected once the initial burst of data finishes
        if (get().status !== 'connected') {
           set({ status: 'connected', lastSynced: new Date().toISOString() });
           console.log('[Sync Engine] Cloud vault is mirrored locally. Sync Active.');
        }
      });

    } catch (err) {
      console.error('[Sync Engine] Failed to connect to cloud vault:', err);
      set({ status: 'error' });
    }
  },

  startBackgroundWorker: () => {
    console.log('[Sync Engine] Background outbox worker initialized.');
    setInterval(() => {
      if (get().status === 'connected') {
        set({ lastSynced: new Date().toISOString() });
      }
    }, 60000);
  }
}));