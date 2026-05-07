import React, { useState } from 'react';
import { Calendar, ArrowUpDown, Search, Lock, Unlock, SlidersHorizontal } from 'lucide-react';
import { useDashboardStore, CategoryFilter } from '../../../store/dashboardStore';

const CATEGORIES: CategoryFilter[] = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS', 'ARCHIVED'];

export function DashboardToolbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrderLocked, setIsOrderLocked] = useState(false);

  // V3 FIX: Strict Zustand Selectors (No more full-store destructuring)
  const viewingDate = useDashboardStore(s => s.viewingDate);
  const sortOrder = useDashboardStore(s => s.sortOrder);
  const categoryFilter = useDashboardStore(s => s.categoryFilter);
  const setCategoryFilter = useDashboardStore(s => s.setCategoryFilter);
  const shiftDate = useDashboardStore(s => s.shiftDate);
  const resetToToday = useDashboardStore(s => s.resetToToday);
  const toggleSortOrder = useDashboardStore(s => s.toggleSortOrder);

  const dateStr = viewingDate.toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
      
      {/* Top Row: Dates & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 md:flex-none">
          <div className="flex items-center gap-1.5 text-slate-700 font-black uppercase tracking-widest whitespace-nowrap text-[10px] lg:text-xs mr-2">
            <Calendar size={16} className="text-emerald-600" /> Date
          </div>
          <button onClick={() => shiftDate(-1)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex-1 md:flex-none text-center uppercase tracking-widest transition-colors">←</button>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-800 text-xs min-w-[100px]">
            {dateStr}
          </div>
          <button onClick={() => shiftDate(1)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold hover:bg-slate-50 flex-1 md:flex-none text-center uppercase tracking-widest transition-colors">→</button>
          <button onClick={() => resetToToday()} className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 flex-1 md:flex-none text-center text-emerald-700 transition-colors">Today</button>
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto">
           <div className={`relative flex-1 md:w-48 transition-all duration-300 ${isSearchOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 hidden md:block md:opacity-100 md:translate-x-0'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search vault..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
            
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden shrink-0 p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
              <Search size={14} />
            </button>

            <button onClick={toggleSortOrder} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 text-slate-700 bg-white min-w-[80px] transition-colors">
              <ArrowUpDown size={14} className="text-emerald-600"/> {sortOrder === 'alpha-asc' ? 'A-Z' : 'Z-A'}
            </button>
            
            <button onClick={() => setIsOrderLocked(!isOrderLocked)} className={`shrink-0 p-1.5 border rounded-lg transition-colors ${isOrderLocked ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {isOrderLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
        </div>
      </div>

      {/* Bottom Row: Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl gap-1 mt-1">
        <div className="flex items-center px-2 border-r border-slate-200 mr-1 text-slate-400">
           <SlidersHorizontal size={14} />
        </div>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`flex-1 min-w-fit px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap ${
              categoryFilter === cat 
                ? cat === 'ARCHIVED' ? 'bg-rose-100 text-rose-800 shadow-sm border border-rose-200' : 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}