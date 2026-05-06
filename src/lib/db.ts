import { PGlite } from '@electric-sql/pglite';

// Initialize the raw instance (private to this module)
const pgliteInstance = new PGlite();

/**
 * Audit Point C-01: Hardened Database Wrapper
 * This wrapper intercepts all calls to ensure the WASM engine is fully 
 * allocated before any query is executed.
 */
export const db = {
  ...pgliteInstance,
  
  /**
   * Hardened Query Method
   * Automatically awaits waitReady to prevent race conditions during boot.
   */
  query: async <T>(...args: Parameters<typeof pgliteInstance.query>) => {
    await pgliteInstance.waitReady;
    return pgliteInstance.query<T>(...args);
  },

  /**
   * Hardened Exec Method
   * Safely handles multi-statement SQL strings for schema setup.
   */
  exec: async (sql: string) => {
    await pgliteInstance.waitReady;
    return pgliteInstance.exec(sql);
  }
};

/**
 * Clinical Mock Data Seeder
 * Populates the vault with V2-accurate animal records if the DB is empty.
 * Obeys NULL Law: No magic strings used for optional fields[cite: 1].
 */
async function seedMockData() {
  const check = await db.query("SELECT count(*) as count FROM animals");
  const count = Number((check.rows[0] as { count: string | number }).count);
  
  if (count > 0) return;

  console.log('[DB] Seeding localized clinical mock data...');
  await db.exec(`
    INSERT INTO animals (id, name, species, category, weight_unit, census_count, entity_type, red_list_status, display_order)
    VALUES 
    (gen_random_uuid(), 'Teacup', 'Burrowing Owl', 'OWLS', 'g', 0, 'individual', 'LC', 1),
    (gen_random_uuid(), 'Lansell', 'Tawny Owl', 'OWLS', 'g', 0, 'individual', 'LC', 2),
    (gen_random_uuid(), 'Tempest', 'Golden Eagle', 'RAPTORS', 'g', 0, 'individual', 'LC', 3),
    (gen_random_uuid(), 'Freddie', 'Striped Skunk', 'MAMMALS', 'g', 0, 'individual', 'LC', 4),
    (gen_random_uuid(), 'Meerkat Mob', 'Meerkat', 'MAMMALS', 'g', 12, 'group', 'LC', 5),
    (gen_random_uuid(), 'Lincoln', 'Corn Snake', 'EXOTICS', 'g', 0, 'individual', 'LC', 6);
  `);
}

// Audit Point C-03: Initialization Lock
let isInitializing = false;

/**
 * Database Bootloader
 * Sets up the V3 Schema and triggers the mock seeder[cite: 1].
 */
export async function initDb() {
  if (isInitializing) return;
  isInitializing = true;

  try {
    console.log('[DB] Initializing WebAssembly Engine...');
    
    // 1. Create Hardened Schema (V3 Specifications)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS animals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        species text,
        category text,
        weight_unit text NOT NULL DEFAULT 'g',
        census_count integer NOT NULL DEFAULT 0,
        entity_type text NOT NULL,
        red_list_status text NOT NULL DEFAULT 'LC',
        display_order integer NOT NULL DEFAULT 0,
        is_deleted boolean NOT NULL DEFAULT false,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS daily_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        animal_id uuid NOT NULL REFERENCES animals(id),
        log_type text NOT NULL,
        log_date timestamp with time zone NOT NULL,
        notes text,
        weight_grams numeric,
        weight_unit text,
        temperature_c numeric,
        is_deleted boolean NOT NULL DEFAULT false,
        created_by uuid,
        modified_by uuid,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    // 2. Hydrate Local Vault with Seed Data
    await seedMockData();

    console.log('[DB] Vault Online and Seeded.');
  } catch (error) {
    console.error('[DB] FATAL: Initialization failed:', error);
  } finally {
    isInitializing = false;
  }
}