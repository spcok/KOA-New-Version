import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { ClockInOutButton } from '../features/timesheets/components/ClockInOutButton';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="bg-[#0A0B0E] text-slate-300 font-sans w-screen h-screen overflow-hidden flex flex-col">
      <header className="h-14 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <h1 className="font-mono text-sm tracking-widest text-emerald-400">KOA MANAGER V1 // SYSTEM_PROTOCOL</h1>
        </div>
        <div className="flex items-center space-x-6 text-[10px] font-mono uppercase tracking-tighter text-slate-500">
          <ClockInOutButton />
          <div>NODE: <span className="text-slate-300">OFFLINE_FIRST_PRIMARY</span></div>
          <div>SYNC: <span className="text-emerald-500">ELECTRIC_SQL_ACTIVE</span></div>
          <div>DB: <span className="text-slate-300 font-bold">pglite@0.4.x</span></div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="p-10 text-center w-full">
          <h2 className="text-2xl font-light text-white mb-2">Initiation Sequence Complete</h2>
          <p className="text-sm text-slate-500 font-mono tracking-tight uppercase">Standby for administrative modules</p>
        </div>
      </main>
      <footer className="h-10 bg-[#0A0B0E] border-t border-slate-800 px-6 flex items-center justify-between text-[10px] font-mono text-slate-600">
        <div>SESSION_ID: <span className="text-slate-400">KOA_8812_SYS</span></div>
        <div>BUILD_TS: 2026-05-05T01:04:00Z</div>
        <div>STATUS: <span className="text-emerald-500">AUTH_READY</span></div>
      </footer>
    </div>
  );
}
