import { PGlite } from '@electric-sql/pglite';

const pgliteInstance = new PGlite();

export const db = {
  ...pgliteInstance,
  query: async <T>(...args: Parameters<typeof pgliteInstance.query>) => {
    await pgliteInstance.waitReady;
    return pgliteInstance.query<T>(...args);
  },
  exec: async (sql: string) => {
    await pgliteInstance.waitReady;
    return pgliteInstance.exec(sql);
  }
};

async function seedMockData() {
  const check = await db.query("SELECT count(*) as count FROM animals");
  const count = Number((check.rows[0] as { count: string | number }).count);
  
  if (count > 0) return;

  console.log('[DB] Seeding localized clinical mock data...');
  
  // 1. Seed Animals
  await db.exec(`
    INSERT INTO animals (id, name, species, category, weight_unit, census_count, entity_type, red_list_status, display_order)
    VALUES 
    ('11111111-1111-4111-a111-111111111111', 'Teacup', 'Burrowing Owl', 'OWLS', 'g', 0, 'individual', 'LC', 1),
    ('22222222-2222-4222-a222-222222222222', 'Tempest', 'Golden Eagle', 'RAPTORS', 'g', 0, 'individual', 'LC', 2),
    ('33333333-3333-4333-a333-333333333333', 'Meerkat Mob', 'Meerkat', 'MAMMALS', 'g', 12, 'group', 'LC', 3);
  `);

  // 2. Seed a Pending Daily Round
  const today = new Date().toISOString().split('T')[0];
  await db.exec(`
    INSERT INTO daily_rounds (animal_id, date, shift, section, is_alive, water_checked, locks_secured)
    VALUES 
    ('11111111-1111-4111-a111-111111111111', '${today}', 'Morning', 'OWLS', true, true, true),
    ('22222222-2222-4222-a222-222222222222', '${today}', 'Morning', 'RAPTORS', true, null, null);
  `);
}

let isInitializing = false;

export async function initDb() {
  if (isInitializing) return;
  isInitializing = true;

  try {
    console.log('[DB] Initializing WebAssembly Engine...');
    
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

      /* Derived directly from v3-database schema_2.csv with Null Law enforcement */
      CREATE TABLE IF NOT EXISTS daily_rounds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        animal_id uuid NOT NULL REFERENCES animals(id),
        date date NOT NULL,
        shift text NOT NULL,
        section text,
        is_alive boolean,
        water_checked boolean,
        locks_secured boolean,
        animal_issue_note text,
        general_section_note text,
        completed_by uuid,
        completed_at timestamp with time zone,
        is_deleted boolean NOT NULL DEFAULT false,
        created_by uuid,
        modified_by uuid,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    await seedMockData();
    console.log('[DB] Vault Online and Seeded.');
  } catch (error) {
    console.error('[DB] FATAL: Initialization failed:', error);
  } finally {
    isInitializing = false;
  }
}