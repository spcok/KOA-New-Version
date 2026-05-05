import { useQuery } from '@tanstack/react-query';
import { db } from '../../lib/db';
import { DashboardToolbar } from './components/DashboardToolbar';
import { AnimalTable } from './components/AnimalTable';
import { StatWidget } from './components/StatWidget';
import { DutyWidget } from './components/DutyWidget';
import { Activity, ClipboardList } from 'lucide-react';

export function Dashboard() {
  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await db.query(`SELECT id, name, species, category FROM animals WHERE is_deleted = false LIMIT 10`);
      return res.rows as any[];
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatWidget title="Total Animals" value={animals.length} icon={<Activity size={20} />} />
        <StatWidget title="To-Do Tasks" value={5} icon={<ClipboardList size={20} />} trend="+2 new" />
        <DutyWidget title="Daily Rounds" count={3} type="logs" statusText="pending" />
        <DutyWidget title="Feed Needed" count={2} type="tasks" statusText="due" />
      </div>
      <DashboardToolbar />
      <AnimalTable animals={animals} />
    </div>
  );
}
