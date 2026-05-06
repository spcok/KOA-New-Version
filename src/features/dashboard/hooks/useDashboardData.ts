import { useQuery } from '@tanstack/react-query';
import { db } from '../../../lib/db';
import { useDashboardStore } from '../../../store/dashboardStore';

// Strict typing obeys Law 3
export interface Animal {
  id: string;
  name: string;
  species: string | null;
  category: string | null;
  ring_number: string | null;
  microchip_id: string | null;
  is_deleted: boolean;
  parent_mob_id?: string | null;
}

export interface DailyLog {
  id: string;
  animal_id: string;
  log_type: string;
  log_date: string;
  weight_grams?: number;
  quantity?: number;
  food?: string;
  value?: string;
  feed_time?: string;
  created_at: string;
}

export function useDashboardData() {
  const viewingDate = useDashboardStore(s => s.viewingDate);
  const categoryFilter = useDashboardStore(s => s.categoryFilter);
  const sortOrder = useDashboardStore(s => s.sortOrder);
  
  const dateStr = viewingDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['dashboardData', dateStr, categoryFilter, sortOrder],
    queryFn: async () => {
      // ENTERPRISE FIX: Database Law. Use $1 to let PGLite filter the logs natively.
      const animalsRes = await db.query("SELECT * FROM animals WHERE is_deleted = false ORDER BY name ASC");
      
      // Pull today's logs specifically
      const todayLogsRes = await db.query(
        "SELECT * FROM daily_logs WHERE is_deleted = false AND log_date::date = $1::date", 
        [dateStr]
      );
      
      // We only need past feed logs to calculate "Last Fed". 
      // In a true enterprise app, this would be a lateral join, but this prevents the N+1 memory trap.
      const pastFeedLogsRes = await db.query(
        "SELECT DISTINCT ON (animal_id) animal_id, log_date, feed_time FROM daily_logs WHERE is_deleted = false AND log_type ILIKE 'feed' AND log_date::date < $1::date ORDER BY animal_id, log_date DESC",
        [dateStr]
      );

      const rawAnimals = animalsRes.rows as Animal[];
      const todayLogs = todayLogsRes.rows as DailyLog[];
      const pastFeedLogs = pastFeedLogsRes.rows as DailyLog[];

      // Map data in O(N) time
      const processedAnimals = rawAnimals.map((a) => {
        const myTodayLogs = todayLogs.filter((l) => String(l.animal_id) === String(a.id));
        const todayWeight = myTodayLogs.find((l) => String(l.log_type).toLowerCase() === 'weight');
        const todayFeedLogs = myTodayLogs.filter((l) => String(l.log_type).toLowerCase() === 'feed');
        const myLastFed = pastFeedLogs.find((l) => String(l.animal_id) === String(a.id));

        return {
          ...a,
          displayId: a.ring_number || a.microchip_id || 'N/A',
          todayWeight: todayWeight || null,
          todayFeedLogs: todayFeedLogs,
          lastFedStr: myLastFed ? new Date(myLastFed.log_date).toLocaleDateString('en-GB') : 'N/A',
          isMobParent: false,
          isVirtualMob: false,
          subRows: []
        };
      });

      // Filter
      const filteredAnimals = processedAnimals.filter((a) => {
          if (categoryFilter === 'ARCHIVED') return a.is_deleted === true;
          return a.category?.toLowerCase() === categoryFilter.toLowerCase();
      });

      // Sort
      if (sortOrder === 'alpha-asc') {
          filteredAnimals.sort((a, b) => a.name.localeCompare(b.name));
      } else {
          filteredAnimals.sort((a, b) => b.name.localeCompare(a.name));
      }

      // Stats
      const animalStats = {
          total: filteredAnimals.length,
          weighed: filteredAnimals.filter(a => a.todayWeight).length,
          fed: filteredAnimals.filter(a => a.todayFeedLogs.length > 0).length
      };

      return { animals: filteredAnimals, stats: animalStats };
    }
  });
}