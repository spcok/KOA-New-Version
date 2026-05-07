import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { db } from '../../lib/db';
import { useDashboardStore, CategoryFilter } from '../../store/dashboardStore';
import { 
  Heart, Scale, Drumstick, ArrowUpDown, Loader2, ClipboardCheck, 
  CheckCircle, Lock, Unlock, ChevronUp, ChevronDown, Calendar, 
  AlertTriangle, Droplets, Search 
} from 'lucide-react';

export function Dashboard() {
  const [isBentoMinimized, setIsBentoMinimized] = useState(false);
  const [isOrderLocked, setIsOrderLocked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeTab = useDashboardStore(s => s.categoryFilter);
  const setActiveTab = useDashboardStore(s => s.setCategoryFilter);
  const viewingDate = useDashboardStore(s => s.viewingDate);
  const shiftDate = useDashboardStore(s => s.shiftDate);
  const resetToToday = useDashboardStore(s => s.resetToToday);
  const sortOption = useDashboardStore(s => s.sortOrder);
  const cycleSort = useDashboardStore(s => s.toggleSortOrder);

  const dateStr = viewingDate.toISOString().split('T')[0];
  const displayDate = viewingDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // 1. Explicit useQuery inside Dashboard to guarantee mappings
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardData', dateStr],
    queryFn: async () => {
      await db.waitReady;
      const animalsRes = await db.query("SELECT * FROM animals ORDER BY name ASC");
      
      let logsRes = { rows: [] };
      try {
          logsRes = await db.query("SELECT * FROM daily_logs WHERE is_deleted = false ORDER BY log_date DESC");
      } catch (err) {
          console.warn("daily_logs query failed, table might not exist yet:", err);
      }
      
      return { animals: animalsRes.rows as any[], logs: logsRes.rows as any[] };
    }
  });

  const parseLocalDate = (val: any) => {
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
        <div className="p-4 bg-rose-100 text-rose-600 rounded-full">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Database Query Failed</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md text-center">
          {error instanceof Error ? error.message : 'An unknown database error occurred.'}
        </p>
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

  // 2. Process & Map Animals (Replaces the missing hook logic)
  const processedAnimals = (data.animals || []).map((a) => {
    const animalLogs = data.logs.filter((l) => String(l.animal_id) === String(a.id)) || [];
    const todayLogs = animalLogs.filter((l) => parseLocalDate(l.log_date) === dateStr);
    
    const todayWeight = todayLogs.find((l) => String(l.log_type).toLowerCase() === 'weight');
    const todayFeedLogs = todayLogs.filter((l) => String(l.log_type).toLowerCase() === 'feed');
    
    return {
      ...a,
      todayWeight: todayWeight ? todayWeight.weight_grams : null,
      fed_today: todayFeedLogs.length > 0,
    };
  });

  // 3. Filter Resiliency
  const filteredAnimals = processedAnimals.filter((a: any) => {
    // Search
    if (searchTerm && !(a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())) return false;
    
    // Archive
    if (activeTab === 'ARCHIVED') return a.is_deleted === true;
    if (a.is_deleted) return false;

    // Tabs
    const cat = (a.category || '').toLowerCase();
    const tab = (activeTab || '').toLowerCase();
    
    // Safety Net: If animal has no category, show them in Owls so they aren't lost ghosts
    const knownCategories = ['owls', 'raptors', 'mammals', 'exotics'];
    if (!knownCategories.includes(cat) && tab === 'owls') return true;

    return cat === tab || cat + 's' === tab || cat === tab.slice(0, -1);
  });

  // 4. Sort
  filteredAnimals.sort((a: any, b: any) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return sortOption === 'alpha-asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  // 5. Stats Calculation
  const animalStats = {
      total: filteredAnimals.length,
      weighed: filteredAnimals.filter((a: any) => a.todayWeight !== null).length,
      fed: filteredAnimals.filter((a: any) => a.fed_today).length
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
          <p className="text-slate-500 mt-0.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            {displayDate} <span className="text-slate-300">|</span> 🌤️ 14°C Partly Cloudy
          </p>
        </div>
      </div>

      {/* Tasks & Health Rota Bento */}
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
                          <div className="p-2 bg-emerald-50 rounded-full mb-2">
                            <CheckCircle size={24} className="text-emerald-500 opacity-80"/>
                          </div>
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
                          <div className="p-2 bg-rose-50 rounded-full mb-2">
                            <Heart size={24} className="text-rose-300 opacity-60"/>
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Collection Stable</p>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-[#0fa968] rounded-xl p-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-0.5">Weighed Today</div>
            <div className="text-xl lg:text-2xl font-black">
              {animalStats?.weighed || 0}<span className="text-xs lg:text-sm opacity-80">/{animalStats?.total || 0}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
        </div>
        <div className="bg-[#f97316] rounded-xl p-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-90 mb-0.5">Fed Today</div>
            <div className="text-xl lg:text-2xl font-black">
              {animalStats?.fed || 0}<span className="text-xs lg:text-sm opacity-80">/{animalStats?.total || 0}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Drumstick size={20} className="text-white" />
          </div>
        </div>
      </div>

      {/* Viewing Options Control Bar */}
      <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <div className="flex items-center gap-1.5 text-slate-700 font-black uppercase tracking-widest whitespace-nowrap text-[10px] lg:text-xs">
            <Calendar size={16} className="text-emerald-600" />
            Viewing Date:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => shiftDate(-1)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-50 whitespace-nowrap flex-1 sm:flex-none text-center uppercase tracking-widest">← Prev</button>
            <div className="relative flex-1 sm:flex-none min-w-[120px] text-center font-bold text-slate-800 text-sm py-1.5">
              {dateStr}
            </div>
            <button onClick={() => shiftDate(1)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-50 whitespace-nowrap flex-1 sm:flex-none text-center uppercase tracking-widest">Next →</button>
            <button onClick={() => resetToToday()} className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 whitespace-nowrap flex-1 sm:flex-none text-center text-emerald-600">Today</button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-1.5 w-full pt-2 border-t border-slate-100">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={cycleSort} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 text-slate-700 bg-white min-w-[80px]">
                <ArrowUpDown size={14} /> {sortOption === 'alpha-asc' ? 'A-Z' : 'Z-A'}
              </button>
              <button onClick={() => setIsOrderLocked(!isOrderLocked)} className={`shrink-0 p-1.5 border border-slate-200 rounded-lg transition-colors ${isOrderLocked ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>
                {isOrderLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide bg-slate-200 p-1 rounded-xl gap-0.5 sm:gap-1">
        {(['Owls', 'Raptors', 'Mammals', 'Exotics'] as CategoryFilter[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 min-w-fit sm:min-w-[100px] py-2 px-2 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${
              activeTab === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[100px] py-2 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'ARCHIVED' ? 'bg-rose-100 text-rose-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Inlined Animal Table */}
      <div className="space-y-3">
        {filteredAnimals.map((animal: any) => (
          <div key={animal.id} className="bg-white border border-slate-200 rounded-2xl p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow group gap-4">
            
            {/* Left Side: Avatar & Link routes cleanly to AnimalProfileView */}
            <Link 
              to="/animals/$animalId" 
              params={{ animalId: animal.id }}
              className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${animal.name || animal.species}&backgroundColor=e2e8f0`} 
                  alt={animal.name || 'Avatar'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate pr-4">
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                  {animal.name || 'Unnamed'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate mt-0.5">
                  {animal.species || 'Unknown'}
                </p>
              </div>
            </Link>

            {/* Right Side: Quick Action Touch Targets */}
            <div className="flex items-center gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-4">
              <button 
                className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 border-2 border-blue-100 flex items-center justify-center hover:bg-blue-100 transition-colors"
                title="Mark Water Checked"
              >
                <Droplets size={20} />
              </button>
              
              <button 
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors ${
                  animal.fed_today 
                    ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                    : 'bg-slate-50 text-slate-300 border-slate-100 hover:bg-emerald-50 hover:text-emerald-500'
                }`}
                title={animal.fed_today ? "Fed Today" : "Log Feed"}
              >
                <Drumstick size={20} />
              </button>

              <button 
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors ${
                  animal.todayWeight !== null && animal.todayWeight !== undefined
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-slate-50 text-slate-300 border-slate-100 hover:bg-slate-100 hover:text-slate-500'
                }`}
                title={animal.todayWeight ? `Weighed: ${animal.todayWeight}` : "Log Weight"}
              >
                <Scale size={20} />
              </button>
            </div>
          </div>
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