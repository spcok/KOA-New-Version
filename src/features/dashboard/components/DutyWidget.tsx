import clsx from 'clsx';
import { ClipboardList } from 'lucide-react';

interface DutyWidgetProps {
  title: string;
  count: number;
  type: 'tasks' | 'logs';
  statusText: string;
}

export function DutyWidget({ title, count, type, statusText }: DutyWidgetProps) {
  return (
    <div className="bg-[#111827] border border-slate-800 p-4 rounded-lg flex items-center space-x-4">
      <div className={clsx("p-2 rounded", type === 'tasks' ? "bg-emerald-500/10 text-emerald-500" : "bg-sky-500/10 text-sky-500")}>
        <ClipboardList size={20} />
      </div>
      <div>
        <div className="text-xs text-slate-300 font-medium">{title}</div>
        <div className="text-[11px] text-slate-500">{count} {statusText}</div>
      </div>
      <div className="ml-auto text-xl font-bold text-white">{count}</div>
    </div>
  );
}
