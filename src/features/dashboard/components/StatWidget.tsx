import { ReactNode } from 'react';

interface StatWidgetProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
}

export function StatWidget({ title, value, icon, trend }: StatWidgetProps) {
  return (
    <div className="bg-[#111827] border border-slate-800 p-4 rounded-lg flex items-center justify-between">
      <div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{title}</div>
        <div className="text-2xl font-light text-white mt-1">{value}</div>
        {trend && <div className="text-[10px] text-emerald-500 mt-1">{trend}</div>}
      </div>
      <div className="text-slate-600">{icon}</div>
    </div>
  );
}
