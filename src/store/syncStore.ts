import { create } from 'zustand';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

/**
 * MASTER SCHEMA CONFIGURATION
 * We handle strict NOT NULL constraints by defining safe clinical defaults.
 */
const SCHEMA_CONFIG = [
  { 
    name: 'animals', 
    cols: ['id', 'entity_type', 'name', 'species', 'category', 'census_count', 'weight_unit', 'red_list_status', 'is_deleted'], 
    defaults: { 
      entity_type: 'ANIMAL', 
      census_count: 0, 
      weight_unit: 'g', 
      red_list_status: 'NE',
      is_deleted: false 
    } 
  },
  { 
    name: 'clinical_records', 
    cols: ['id', 'animal_id', 'record_type', 'record_date', 'soap_assessment', 'is_deleted'], 
    defaults: { record_type: 'GENERAL', is_deleted: false } 
  },
  { 
    name: 'tasks', 
    cols: ['id', 'title', 'status', 'is_deleted'], 
    defaults: { status: 'PENDING', is_deleted: false } 
  },
  { 
    name: 'users', 
    cols: ['id', 'email', 'name', 'role', 'is_deleted'], 
    defaults: { role: 'KEEPER', is_deleted: false } 
  }
];

type SyncState = {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastSynced: string | null;
  progress: string;
  pullFromCloud: () => Promise<void>;
  startBackgroundWorker: () => void; // Fixed: Added back to Type
};

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'disconnected',
  lastSynced: null,
  progress: 'Idle',

  pullFromCloud: async () => {
    if (get().status === 'connecting') return;
    set({ status: 'connecting', progress: 'Initializing Master Sync...' });

    try {
      await db.waitReady;

      for (const table of SCHEMA_CONFIG) {
        set({ progress: `Syncing ${table.name}...` });
        
        const { data, error } = await supabase
          .from(table.name)
          .select(table.cols.join(','));

        if (error) {
          console.warn(`[Sync Engine] ${table.name} fetch warning:`, error.message);
          continue; 
        }

        if (data && data.length > 0) {
          await db.query('BEGIN');
          try {
            for (const row of data) {
              const columns = table.cols;
              const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
              const updateSet = columns
                .filter(c => c !== 'id')
                .map((c) => `${c} = EXCLUDED.${c}`)
                .join(', ');

              const values = columns.map(col => {
                const val = row[col];
                // CRITICAL FIX: Inject defaults for NOT NULL violations
                if (val === null || val === undefined) {
                  return table.defaults[col as keyof typeof table.defaults] ?? null;
                }
                return val;
              });

              const sql = `
                INSERT INTO ${table.name} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE SET ${updateSet}
              `;

              await db.query(sql, values);
            }
            await db.query('COMMIT');
          } catch (e) {
            await db.query('ROLLBACK');
            throw e;
          }
        }
      }

      set({ 
        status: 'connected', 
        lastSynced: new Date().toISOString(),
        progress: 'Vault Synchronized' 
      });
      console.log('[Sync Engine] Master Synchronisation Complete.');

    } catch (err) {
      console.error('[Sync Engine] Master Sync failed:', err);
      set({ status: 'error', progress: 'Sync Failed' });
    }
  },

  // FIXED: Implementation added back to prevent "not a function" error
  startBackgroundWorker: () => {
    console.log('[Sync Engine] Background heartbeat initialized.');
    setInterval(() => {
      if (get().status !== 'connecting') {
        get().pullFromCloud();
      }
    }, 300000); // Sync every 5 minutes
  }
}));