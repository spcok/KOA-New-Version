import { createRootRoute, Outlet, useLocation, Link } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { db } from '../lib/db'; // V3 FIX: Import the db singleton, not initDb
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { ClockInOutButton } from '../features/timesheets/components/ClockInOutButton';
import { Activity, FileText, Pill, ShieldAlert, CalendarClock, Wrench, HeartPulse, AlertTriangle, Flame, Loader2, ShieldCheck } from 'lucide-react';

const NotFoundComponent = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">404</h1>
        <p className="text-slate-500 font-bold mb-8 text-sm">The module or page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-colors shadow-md block w-full">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export const Route = createRootRoute({
  beforeLoad: () => {
    // V3 PHASE 1: Auth Guard Disabled for Offline Dev
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

export const rootRoute = Route;

function RootComponent() {
  const location = useLocation();
  
  // Audit Point: Boot-Guard State
  const [isDbReady, setIsDbReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Zustand Law: Strict Selectors
  const session = useAuthStore(s => s.session);
  const signOut = useAuthStore(s => s.signOut);
  const pullFromCloud = useSyncStore(s => s.pullFromCloud);
  const startBackgroundWorker = useSyncStore(s => s.startBackgroundWorker);

  // V3 FIX: Modern Bootloader using the Database Class
  useEffect(() => {
    async function boot() {
      await db.waitReady; // Replaces initDb()
      setIsDbReady(true);
    }
    boot();
  }, []);

  // Sync Engine
  useEffect(() => {
    if (session && isDbReady) {
      pullFromCloud().catch(console.error);
      startBackgroundWorker();
    }
  }, [session, isDbReady, pullFromCloud, startBackgroundWorker]);

  if (!isDbReady) {
    return (
      <div className="h-screen w-full bg-[#171f30] flex flex-col items-center justify-center text-emerald-400 font-mono z-50 fixed inset-0">
        <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-500" />
          <span className="tracking-widest uppercase text-sm font-bold text-white">Unlocking Clinical Vault...</span>
        </div>
      </div>
    );
  }

  if (location.pathname === '/login') {
    return <Outlet />;
  }

  const ActiveLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <Link 
      to={to} 
      activeProps={{ className: "bg-emerald-500 text-slate-900 font-bold shadow-sm" }} 
      inactiveProps={{ className: "text-slate-300 hover:text-white hover:bg-slate-800/50" }} 
      className={`flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 ${isSidebarOpen ? '' : 'justify-center'}`} 
      title={!isSidebarOpen ? label : undefined}
    >
      <div className="shrink-0">{icon}</div>
      {isSidebarOpen && <span className="text-sm truncate">{label}</span>}
    </Link>
  );

  const InactiveItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div 
      className={`flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 rounded cursor-not-allowed transition-all duration-200 ${isSidebarOpen ? '' : 'justify-center'}`} 
      title={!isSidebarOpen ? `${label} (Coming Soon)` : undefined}
    >
      <div className="shrink-0 opacity-50">{icon}</div>
      {isSidebarOpen && <span className="text-sm truncate">{label}</span>}
    </div>
  );

  const Icons = {
    dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>,
    logs: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>,
    logistics: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>,
    cog: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>,
    admin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
    logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
  };

  return (
    <div className="flex h-screen w-full bg-[#171f30] font-sans text-slate-300 overflow-hidden">
      <Toaster position="top-center" toastOptions={{ className: 'text-sm font-bold shadow-xl border border-slate-100', style: { borderRadius: '12px', background: '#fff', color: '#1e293b' } }} />
      
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 flex flex-col border-r border-slate-800/50 transition-all duration-300 ease-in-out z-20 bg-[#171f30]`}>
        <div className="flex items-center justify-center h-16 px-4 bg-[#0f172a] shrink-0">
          {isSidebarOpen ? <h1 className="text-xl font-bold tracking-tight text-white truncate w-full text-center transition-opacity duration-300">KOA Manager</h1> : <h1 className="text-xl font-bold tracking-tight text-emerald-500 transition-opacity duration-300">KM</h1>}
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden flex flex-col gap-6 scrollbar-hide">
          <div className="pt-4">
            {isSidebarOpen && <div className="px-6 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-opacity duration-300">Collection</div>}
            <div className="px-3 space-y-1">
              <ActiveLink to="/" label="Dashboard" icon={Icons.dashboard} />
            </div>
          </div>

          <div>
            {isSidebarOpen && <div className="px-6 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-opacity duration-300">Husbandry</div>}
            <div className="px-3 space-y-1">
              <ActiveLink to="/daily-logs" label="Daily Logs" icon={Icons.logs} />
              <ActiveLink to="/daily-rounds" label="Daily Rounds" icon={Icons.logs} />
              <ActiveLink to="/tasks" label="Tasks" icon={Icons.logs} />
              <ActiveLink to="/feeding-schedules" label="Feeding Schedule" icon={Icons.logs} />
            </div>
          </div>

          <div className="pt-4">
            {isSidebarOpen && <div className="px-6 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-opacity duration-300">Veterinary & Health</div>}
            <div className="px-3 space-y-1">
              {/* V3 FIX: Aligned paths to match our new medical router definitions */}
              <ActiveLink to="/medical" label="Medical Dashboard" icon={<Activity size={20} />} />
              <ActiveLink to="/medical/records" label="Clinical Records" icon={<FileText size={20} />} />
              <ActiveLink to="/medical/medications" label="Medication Logs" icon={<Pill size={20} />} />
              <ActiveLink to="/medical/isolation" label="Biosecurity & Isolations" icon={<ShieldAlert size={20} />} />
              <ActiveLink to="/medical/schedule" label="Medical Schedule" icon={<CalendarClock size={20} />} />
            </div>
          </div>

          <div className="pt-4">
            {isSidebarOpen && <div className="px-6 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-opacity duration-300">Safety & Compliance</div>}
            <div className="px-3 space-y-1">
              <ActiveLink to="/maintenance" label="Maintenance" icon={<Wrench size={20} />} /> 
              <ActiveLink to="/incidents" label="First Aid" icon={<HeartPulse size={20} />} /> 
              <ActiveLink to="/safety-incidents" label="Safety Incidents" icon={<AlertTriangle size={20} />} />
              <ActiveLink to="/fire-drills" label="Fire Drills" icon={<Flame size={20} />} />
            </div>
          </div>
          
          <div className="pt-4">
            {isSidebarOpen && <div className="px-6 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-opacity duration-300">Staff Management</div>}
            <div className="px-3 space-y-1">
              <ActiveLink to="/timesheets" label="Timesheets" icon={Icons.cog} />
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800/50 shrink-0 space-y-1">
          <ActiveLink to="/settings" label="Settings" icon={Icons.cog} />
          <ActiveLink to="/admin" label="Admin" icon={Icons.admin} />
          <button onClick={async () => { await signOut(); }} className={`w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800/30 rounded transition-all duration-200 ${isSidebarOpen ? '' : 'justify-center'}`} title={!isSidebarOpen ? "Logout" : undefined}>
            <div className="shrink-0">{Icons.logout}</div>
            {isSidebarOpen && <span className="text-sm truncate">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50 text-slate-900 border-l border-slate-300 relative min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-sm">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <svg className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <ClockInOutButton />
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">{session?.user?.email || 'Active User'}</span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                {session?.user?.email ? session.user.email.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative">
           <Outlet />
        </div>
      </main>
    </div>
  );
}