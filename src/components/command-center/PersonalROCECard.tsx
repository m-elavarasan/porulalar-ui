import React from 'react';
import { Percent, TrendingUp, Cpu, Building2, Wallet, ChevronRight } from 'lucide-react';
import { PersonalROCEBreakdown } from '../../types';

interface PersonalROCECardProps {
  roce: PersonalROCEBreakdown;
  onDrillDown?: () => void;
}

export const PersonalROCECard: React.FC<PersonalROCECardProps> = ({
  roce,
  onDrillDown,
}) => {
  const items = [
    { label: 'Financial Capital', pct: roce.financialCapitalPct, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Venture Capital', pct: roce.ventureCapitalPct, icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Physical Assets', pct: roce.physicalAssetsPct, icon: Building2, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Overall Portfolio', pct: roce.overallPortfolioPct, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="bento-card p-6 rounded-3xl mb-8 border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-saas">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            CAPITAL EFFICIENCY
          </span>
          <h3 className="text-xl font-bold font-crowz-header text-slate-900">
            PERSONAL ROCE
          </h3>
        </div>

        {onDrillDown && (
          <button
            onClick={onDrillDown}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-saas"
          >
            <span>Drill Down</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-saas"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${it.bg}`}>
                  <Icon className={`w-5 h-5 ${it.color}`} />
                </div>
                <span className="text-xs font-semibold text-slate-400">ROCE</span>
              </div>
              <span className="text-xs text-slate-500 font-medium block mb-1">{it.label}</span>
              <span className={`text-2xl font-black ${it.color}`}>{it.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
