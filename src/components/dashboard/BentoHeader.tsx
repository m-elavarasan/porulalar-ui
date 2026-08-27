import React from 'react';
import { Search, Bell, Plus } from 'lucide-react';

interface BentoHeaderProps {
  userName: string;
  onOpenQuickAction: () => void;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  onPeriodChange: (p: 'Weekly' | 'Monthly' | 'Yearly') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNotifications: () => void;
}

export const BentoHeader: React.FC<BentoHeaderProps> = ({
  userName,
  onOpenQuickAction,
  period,
  onPeriodChange,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 select-none">
      {/* Left Greeting */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/20 shrink-0">
          {userName[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hi, {userName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-300">
              Pro Member
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Effortlessly record and analyze your life & wealth.
          </p>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-0 lg:mx-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything..."
            className="w-full h-11 bg-white border border-slate-200/90 rounded-2xl pl-10 pr-12 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 shadow-xs"
          />
          <kbd className="absolute right-3.5 px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-400 font-bold rounded-lg pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(['Weekly', 'Monthly', 'Yearly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenNotifications}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 relative shadow-xs transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </button>

        <button
          onClick={onOpenQuickAction}
          className="px-4 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Plus size={16} />
          <span>New Entry</span>
        </button>
      </div>
    </div>
  );
};
