import React from 'react';
import { CapitalAllocationItem } from '../../types';
import { PieChart, AlertTriangle } from 'lucide-react';

interface CapitalAllocationCardProps {
  allocation: CapitalAllocationItem[];
}

export const CapitalAllocationCard: React.FC<CapitalAllocationCardProps> = ({ allocation }) => {
  return (
    <div className="bento-card p-6 rounded-3xl mb-8 border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            CAPITAL ALLOCATION ENGINE
          </span>
          <h3 className="text-xl font-bold font-crowz-header text-slate-900">
            CURRENT VS TARGET ALLOCATION
          </h3>
        </div>
        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
          <PieChart className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        {allocation.map((item) => {
          const isDeviated = Math.abs(item.deviationPct) > 2.0;
          return (
            <div key={item.class} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-800">
                <span>{item.class}</span>
                <div className="flex items-center gap-3 text-slate-600">
                  <span>Current: <strong className="text-slate-900">{item.currentPct}%</strong></span>
                  <span>Target: <strong className="text-slate-500">{item.targetPct}%</strong></span>
                  <span className={`font-bold ${item.deviationPct > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                    ({item.deviationPct > 0 ? '+' : ''}{item.deviationPct}%)
                  </span>
                </div>
              </div>

              {/* Dual Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDeviated ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, item.currentPct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
