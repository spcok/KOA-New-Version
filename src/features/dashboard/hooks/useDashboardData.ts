import { useQuery } from '@tanstack/react-query';
import { db } from '../../../lib/db';
import { AnimalSchema } from '../../../lib/schemas';
import { z } from 'zod';

/**
 * Hardened Dashboard Data Hook
 * Obeys R-01 (SQL-side joins) and O-01 (Zod validation).
 */
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      // 1. Fetch List with Status Flags (SQL-side computation)
      const listRes = await db.query(`
        SELECT 
          a.*,
          (SELECT weight_grams FROM daily_logs l 
           WHERE l.animal_id = a.id AND l.log_type = 'weight' 
           AND l.log_date::date = CURRENT_DATE AND l.is_deleted = false 
           LIMIT 1) as today_weight,
          EXISTS (
            SELECT 1 FROM daily_logs l 
            WHERE l.animal_id = a.id AND l.log_type = 'feed' 
            AND l.log_date::date = CURRENT_DATE AND l.is_deleted = false
          ) as fed_today
        FROM animals a
        WHERE a.is_deleted = false
        ORDER BY a.display_order ASC
      `);

      // 2. Fetch Aggregates (SQL-side computation for stats)
      const statsRes = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT animal_id) FILTER (WHERE log_type = 'weight' AND log_date::date = CURRENT_DATE) as weighed,
          COUNT(DISTINCT animal_id) FILTER (WHERE log_type = 'feed' AND log_date::date = CURRENT_DATE) as fed
        FROM daily_logs
        WHERE is_deleted = false
      `);

      const stats = statsRes.rows[0] as { total: string; weighed: string; fed: string };

      // 3. Zod Edge Validation (Kill 'as any')
      const processedAnimals = z.array(AnimalSchema.extend({
        today_weight: z.number().nullable(),
        fed_today: z.boolean()
      })).parse(listRes.rows);

      // Return the exact shape the Dashboard component requires
      return { 
        animals: processedAnimals, 
        stats: {
          total: processedAnimals.length, // Total from the current list
          weighed: Number(stats.weighed || 0),
          fed: Number(stats.fed || 0)
        } 
      };
    }
  });
}