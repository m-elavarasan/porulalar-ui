import React from 'react';
import { MoreHorizontal, PieChart } from 'lucide-react';

interface BentoProfitRingCardProps {
  savingsRate?: number;
}

export const BentoProfitRingCard: React.FC<BentoProfitRingCardProps> = ({
  savingsRate = 64,
}) => {
  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PieChart size={18} className="text-blue-600" />
          <span>Cashflow & Net Profit Ring</span>
        </h3>
        <button className="text-slate-400 hover:text-slate-700">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center relative py-2">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-100" strokeWidth="4" strokeDasharray="2, 2" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-blue-600" strokeWidth="4" strokeDasharray="45, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-lime-400" strokeWidth="4" strokeDasharray="25, 100" strokeDashoffset="-50" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>

          <div className="absolute text-center space-y-0.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">{savingsRate}%</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">from yesterday</span>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-600 mt-2 text-center">
          Profit is <strong className="text-blue-600 font-extrabold">36% More</strong> than last week
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
          <span>Total Net Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <span>For Week</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-900" />
          <span>Average Outflow</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Profit Today</span>
        </div>
      </div>
    </div>
  );
};
