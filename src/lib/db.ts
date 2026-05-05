import { PGlite } from '@electric-sql/pglite';

// Initialize PGlite instance
export const db = new PGlite();

// Helper to initialize schema based on CSV provided if needed, 
// for now we just verify it's working.
async function initDb() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        shift_date date NOT NULL,
        clock_in_time timestamptz NOT NULL DEFAULT now(),
        clock_out_time timestamptz,
        status text NOT NULL,
        notes text,
        is_deleted boolean NOT NULL DEFAULT false,
        created_by uuid,
        modified_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log('DB Initialized');
  } catch (error) {
    console.error('DB Initialization failed', error);
  }
}

initDb();
