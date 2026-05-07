import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { db } from '../../lib/db';
import { useDashboardStore, CategoryFilter } from '../../store/dashboardStore';
import { 
  Heart, Scale, Drumstick, Loader2, ClipboardCheck, 
  CheckCircle, ChevronUp, ChevronDown, 
  AlertTriangle, Search, ChevronRight
} from 'lucide-react';
import { DashboardToolbar } from './components/DashboardToolbar';

interface DBAnimal {
  id: string;
  name: string | null;
  species: string | null;
  category: string | null;
  is_deleted: boolean;
  ring_number: string | null;
  microchip_id: string | null;
}

interface DBLog {
  animal_id: string;
  log_type: string;
  log_date: string;
  weight_grams: number | null;
}

interface ProcessedAnimal extends DBAnimal {
  displayId: string;
  todayWeight: number | null;
  todayFeedLogs: DBLog[];
  fed_today: boolean;
  lastFedStr: string;
  nextFeedTask: null;
}

export function Dashboard() {
  const [isBentoMinimized, setIsBentoMinimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeTab = useDashboardStore(s => s.categoryFilter);
  const viewingDate = useDashboardStore(s => s.viewingDate);
  const sortOption = useDashboardStore(s => s.sortOrder);

  const dateStr = viewingDate.toISOString().split('T')[0];
  const displayDate = viewingDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardData', dateStr],
    queryFn: async () => {
      await db.waitReady;
      const animalsRes = await db.query("SELECT * FROM animals ORDER BY name ASC");
      
      let logsRes = { rows: [] as DBLog[] };
      try {
          logsRes = await db.query("SELECT * FROM daily_logs WHERE is_deleted = false ORDER BY log_date DESC") as { rows: DBLog[] };
      } catch (err) {
          console.warn("daily_logs query failed, table might not exist yet:", err);
      }
      
      return { 
        animals: animalsRes.rows as DBAnimal[], 
        logs: logsRes.rows 
      };
    }
  });

  const parseLocalDate = (val: string | null | undefined) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val).substring(0, 10);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return String(val).substring(0, 10);
    }
  };

  if (isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <div className="p-4 bg-rose-100 text-rose-600 rounded-full"><AlertTriangle size={32} /></div>
        <h2 className="text-xl font-bold text-slate-800">Database Query Failed</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md text-center">{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading Dashboard...</p>
      </div>
    );
  }

  const processedAnimals: ProcessedAnimal[] = (data.animals || []).map((a) => {
    const animalLogs = data.logs.filter((l) => String(l.animal_id) === String(a.id)) || [];
    const todayLogs = animalLogs.filter((l) => parseLocalDate(l.log_date) === dateStr);
    
    const todayWeight = todayLogs.find((l) => String(l.log_type).toLowerCase() === 'weight');
    const todayFeedLogs = todayLogs.filter((l) => String(l.log_type).toLowerCase() === 'feed');

    return {
      ...a,
      displayId: a.ring_number || a.microchip_id || 'N/A',
      todayWeight: todayWeight ? todayWeight.weight_grams : null,
      todayFeedLogs: todayFeedLogs,
      fed_today: todayFeedLogs.length > 0,
      lastFedStr: 'N/A',
      nextFeedTask: null 
    };
  });

  const filteredAnimals = processedAnimals.filter((a: { name?: string | null, category?: string | null, is_deleted?: boolean }) => {
    if (searchTerm && !(a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())) return false;
    if (activeTab === 'ARCHIVED') return a.is_deleted === true;
    if (a.is_deleted) return false;

    const cat = (a.category || '').toLowerCase();
    const tab = (activeTab || '').toLowerCase();
    const knownCategories = ['owls', 'raptors', 'mammals', 'exotics'];
    if (!knownCategories.includes(cat) && tab === 'owls') return true;

    return cat === tab || cat + 's' === tab || cat === tab.slice(0, -1);
  });

  filteredAnimals.sort((a: { name?: string | null }, b: { name?: string | null }) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return sortOption === 'alpha-asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  const animalStats = {
      total: filteredAnimals.length,
      weighed: filteredAnimals.filter((a) => a.todayWeight !== null).length,
      fed: filteredAnimals.filter((a) => a.fed_today).length
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20 bg-slate-50 min-h-screen">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
          <p className="text-slate-500 mt-0.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {displayDate} <span className="text-slate-300">|</span> 🌤️ 14°C Partly Cloudy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col transition-all duration-300">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBentoMinimized(!isBentoMinimized)}>
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><ClipboardCheck size={18} /></div>
                      <h2 className="text-base font-black uppercase tracking-widest text-slate-800">Pending Duties</h2>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      {isBentoMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
              </div>
              {!isBentoMinimized && (
                  <div className="mt-3 flex-1 overflow-y-auto max-h-48 pr-2 space-y-2 scrollbar-hide">
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                          <div className="p-2 bg-emerald-50 rounded-full mb-2"><CheckCircle size={24} className="text-emerald-500 opacity-80"/></div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">All Duties Satisfied</p>
                      </div>
                  </div>
              )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col transition-all duration-300">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBentoMinimized(!isBentoMinimized)}>
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Heart size={18} /></div>
                      <h2 className="text-base font-black uppercase tracking-widest text-slate-800">Health Rota</h2>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      {isBentoMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
              </div>
              {!isBentoMinimized && (
                  <div className="mt-3 flex-1 overflow-y-auto max-h-48 pr-2 space-y-2 scrollbar-hide">
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                          <div className="p-2 bg-rose-50 rounded-full mb-2"><Heart size={24} className="text-rose-300 opacity-60"/></div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Collection Stable</p>
                      </div>
                  </div>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-[#0fa968] rounded-xl p-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-0.5">Weighed Today</div>
            <div className="text-xl lg:text-2xl font-black">{animalStats?.weighed || 0}<span className="text-xs lg:text-sm opacity-80">/{animalStats?.total || 0}</span></div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Scale size={20} className="text-white" /></div>
        </div>
        <div className="bg-[#f97316] rounded-xl p-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-0.5">Fed Today</div>
            <div className="text-xl lg:text-2xl font-black">{animalStats?.fed || 0}<span className="text-xs lg:text-sm opacity-80">/{animalStats?.total || 0}</span></div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Drumstick size={20} className="text-white" /></div>
        </div>
      </div>

      <DashboardToolbar />

      <div className="space-y-3">
        {filteredAnimals.map((animal) => (
          <Link 
            key={animal.id}
            to="/animals/$animalId" 
            params={{ animalId: animal.id }} 
            className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow group gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${animal.name || animal.species}&backgroundColor=e2e8f0`} alt={animal.name || 'Avatar'} className="w-full h-full object-cover"/>
              </div>
              <div className="truncate pr-4">
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">{animal.name || 'Unnamed'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate mt-0.5">{animal.species || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 md:border-l md:border-slate-100 md:pl-4">
              {animal.fed_today && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">Fed Today</span>
              )}
              {animal.todayWeight !== null && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{animal.todayWeight}g</span>
              )}
              <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
          </Link>
        ))}

        {filteredAnimals.length === 0 && (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl border-dashed">
            <Search size={32} className="mx-auto mb-3 text-slate-300" />
            <h3 className="font-black text-slate-700 uppercase tracking-widest mb-1">Vault is Empty</h3>
            <p className="font-bold text-sm text-slate-400">Ensure the mock data has seeded correctly.</p>
          </div>
        )}
      </div>
    </div>
  );
}