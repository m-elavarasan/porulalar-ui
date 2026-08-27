import React from 'react';
import { Flame, Activity, Landmark, ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface BentoPillMetricCardsProps {
  totalBankBalance: number;
  netWorth: number;
  netWorthChangePct: number;
  monthlyExpenses: number;
  totalInvestments: number;
  onNavigate: (path: string) => void;
}

export const BentoPillMetricCards: React.FC<BentoPillMetricCardsProps> = ({
  totalBankBalance,
  netWorth,
  netWorthChangePct,
  monthlyExpenses,
  totalInvestments,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. Total Net Worth */}
      <div
        onClick={() => onNavigate('/dashboard')}
        className="bento-card p-5 rounded-3xl cursor-pointer bento-hover flex flex-col justify-between min-h-[145px] shadow-xs border border-slate-200/90 bg-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Total Net Worth
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₹{netWorth.toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
            <Flame className="w-5 h-5 fill-indigo-100 text-indigo-600" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
            <ArrowUpRight size={14} />
            {netWorthChangePct >= 0 ? '+' : ''}{netWorthChangePct.toFixed(1)}% this month
          </span>
          <span className="text-indigo-600 hover:text-indigo-700 text-[11px] font-extrabold">Portfolio →</span>
        </div>
      </div>

      {/* 2. Available Cash */}
      <div
        onClick={() => onNavigate('/banks')}
        className="bento-card p-5 rounded-3xl cursor-pointer bento-hover flex flex-col justify-between min-h-[145px] shadow-xs border border-slate-200/90 bg-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Available Cash
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₹{totalBankBalance.toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <Landmark className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
          <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px]">
            Instant Liquidity
          </span>
          <span className="text-blue-600 hover:text-blue-700 text-[11px] font-extrabold">View Banks →</span>
        </div>
      </div>

      {/* 3. Monthly Outflow */}
      <div
        onClick={() => onNavigate('/expenses')}
        className="bento-card p-5 rounded-3xl cursor-pointer bento-hover flex flex-col justify-between min-h-[145px] shadow-xs border border-slate-200/90 bg-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Monthly Outflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₹{monthlyExpenses.toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs shrink-0">
            <Activity className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px]">
            <ArrowDownLeft size={14} /> Auto-Ledger Sync
          </span>
          <span className="text-rose-600 hover:text-rose-700 text-[11px] font-extrabold">Expenses →</span>
        </div>
      </div>

      {/* 4. Active Investments */}
      <div
        onClick={() => onNavigate('/investments')}
        className="bento-card p-5 rounded-3xl cursor-pointer bento-hover flex flex-col justify-between min-h-[145px] shadow-xs border border-slate-200/90 bg-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Active Investments
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              ₹{totalInvestments.toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
            High Yield Portfolio
          </span>
          <span className="text-emerald-600 hover:text-emerald-700 text-[11px] font-extrabold">Portfolio →</span>
        </div>
      </div>
    </div>
  );
};
