import React from 'react';
import { Sparkles, Activity, ShieldCheck, Clock, Layers } from 'lucide-react';

interface CFOHeaderProps {
  userName?: string;
  updatedMinutesAgo?: number;
}

export const CFOHeader: React.FC<CFOHeaderProps> = ({
  userName = 'INVESTOR',
  updatedMinutesAgo = 12,
}) => {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl bg-slate-900 p-6 text-white shadow-xl border border-slate-800">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Personal CFO 2.0
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5" />
            Wealth Command Center
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-crowz-header text-white uppercase">
          GOOD EVENING, <span className="text-blue-400">{userName}</span>
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Model updated {updatedMinutesAgo} min ago</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Market data live</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Forecast current</span>
        </div>
      </div>
    </header>
  );
};
