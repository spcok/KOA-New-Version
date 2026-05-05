import { Calendar as CalendarIcon, ArrowUpDown, Plus } from 'lucide-react';
import { useDashboardStore } from '../../../store/dashboardStore';
import { Link } from '@tanstack/react-router';

export function DashboardToolbar() {
  const { setSortOrder, sortOrder } = useDashboardStore();

  return (
    <div className="flex items-center justify-between bg-[#111827] p-4 rounded-lg border border-slate-800">
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
          <CalendarIcon size={14} />
          <span>Today</span>
        </button>
        <button 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center space-x-2 text-xs text-slate-400"
        >
          <ArrowUpDown size={14} />
          <span>Sort: {sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
        </button>
      </div>
      <Link to="/animals/new" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded flex items-center space-x-1">
        <Plus size={14} />
        <span>Add Animal</span>
      </Link>
    </div>
  );
}
