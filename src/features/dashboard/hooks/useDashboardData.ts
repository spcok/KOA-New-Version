import { useQuery } from '@tanstack/react-query';
import { db } from '../../../lib/db';
import { useDashboardStore } from '../../../store/dashboardStore';

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

export function useDashboardData() {
  const viewingDate = useDashboardStore(s => s.viewingDate);
  const categoryFilter = useDashboardStore(s => s.categoryFilter);
  const sortOrder = useDashboardStore(s => s.sortOrder);
  
  const dateStr = viewingDate.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['dashboardData', dateStr, categoryFilter, sortOrder],
    queryFn: async () => {
      // 1. Strict Parameterized DB Queries
      const animalsRes = await db.query("SELECT * FROM animals ORDER BY name ASC");
      const logsRes = await db.query("SELECT * FROM daily_logs WHERE is_deleted = false");
      
      const rawAnimals = animalsRes.rows as Animal[];
      const logs = logsRes.rows as any[];

      // 2. Data Mapping
      const processedAnimals = rawAnimals.map((a) => {
        const animalLogs = logs.filter((l) => String(l.animal_id) === String(a.id));
        const todayLogs = animalLogs.filter((l) => String(l.log_date).substring(0,10) === dateStr);
        
        const todayWeight = todayLogs.find((l) => String(l.log_type).toLowerCase() === 'weight');
        const todayFeedLogs = todayLogs.filter((l) => String(l.log_type).toLowerCase() === 'feed');
        
        const pastFeedLogs = animalLogs.filter((l) => 
            String(l.log_type).toLowerCase() === 'feed' && String(l.log_date).substring(0,10) < dateStr
        );
        const lastFedLog = pastFeedLogs.length > 0 ? pastFeedLogs[0] : null; 

        return {
          ...a,
          displayId: a.ring_number || a.microchip_id || 'N/A',
          todayWeight: todayWeight || null,
          todayFeedLogs: todayFeedLogs,
          lastFedStr: lastFedLog ? new Date(lastFedLog.log_date).toLocaleDateString('en-GB') : 'N/A',
        };
      });

      // 3. Filtering
      let filteredAnimals = processedAnimals.filter((a) => {
          if (categoryFilter === 'ARCHIVED') return a.is_deleted === true;
          return a.is_deleted === false && a.category?.toLowerCase() === categoryFilter.toLowerCase();
      });

      // 4. Sorting
      if (sortOrder === 'alpha-asc') {
          filteredAnimals.sort((a, b) => a.name.localeCompare(b.name));
      } else {
          filteredAnimals.sort((a, b) => b.name.localeCompare(a.name));
      }

      // 5. Stats
      const animalStats = {
          total: filteredAnimals.length,
          weighed: filteredAnimals.filter(a => a.todayWeight).length,
          fed: filteredAnimals.filter(a => a.todayFeedLogs.length > 0).length
      };

      return { animals: filteredAnimals, stats: animalStats };
    }
  });
}