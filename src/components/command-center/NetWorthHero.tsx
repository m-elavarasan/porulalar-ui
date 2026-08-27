import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { TrendingUp, DollarSign, Percent, ShieldCheck, Award, ArrowUpRight } from 'lucide-react';
import { NetWorthTrajectoryPoint } from '../../types';

interface NetWorthHeroProps {
  netWorth: number;
  netWorthYtdChange: number;
  netWorthYtdChangePct: number;
  netWorthCagr: number;
  portfolioRoce: number;
  investedCapital: number;
  liquidCapital: number;
  totalDebt: number;
  trajectory: NetWorthTrajectoryPoint[];
}

export const NetWorthHero: React.FC<NetWorthHeroProps> = ({
  netWorth,
  netWorthYtdChange,
  netWorthYtdChangePct,
  netWorthCagr,
  portfolioRoce,
  investedCapital,
  liquidCapital,
  totalDebt,
  trajectory,
}) => {
  const [horizon, setHorizon] = useState<'5Y' | '10Y' | '20Y'>('10Y');
  const [scenario, setScenario] = useState<'BASE' | 'DEFENSIVE' | 'AGGRESSIVE'>('BASE');

  const formatLakhs = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)}Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const filteredTrajectory = trajectory.filter((pt) => {
    if (!pt.isProjected) return true;
    if (horizon === '5Y') return pt.label === '5Y';
    if (horizon === '10Y') return pt.label === '5Y' || pt.label === '10Y';
    return true;
  });

  const scenarioKey = scenario.toLowerCase() as 'base' | 'defensive' | 'aggressive';

  return (
    <div className="bento-card-dark p-6 md:p-8 rounded-3xl mb-8 relative overflow-hidden shadow-2xl">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2 block">
            GLOBAL NET WORTH
          </span>
          <div className="flex items-baseline gap-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-crowz-header text-white tracking-tight">
              {formatLakhs(netWorth)}
            </h2>
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ArrowUpRight className="w-5 h-5" />
              <span>+{formatLakhs(netWorthYtdChange)} YTD</span>
              <span className="text-xs font-normal">({netWorthYtdChangePct}%)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            {(['5Y', '10Y', '20Y'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-saas ${
                  horizon === h
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            {(['BASE', 'DEFENSIVE', 'AGGRESSIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-saas ${
                  scenario === s
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full mb-8 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredTrajectory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorScenario" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '16px',
                color: '#FFF',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
              }}
              formatter={(val: any) => [formatLakhs(Number(val)), 'Net Worth']}
            />
            <Area
              type="monotone"
              dataKey={scenarioKey}
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScenario)"
              name={`${scenario} Scenario`}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorActual)"
              name="Actual Position"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6 border-t border-slate-800 relative z-10">
        <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium mb-1">
            Net Worth CAGR
          </span>
          <span className="text-lg font-extrabold text-blue-400">{netWorthCagr}%</span>
        </div>

        <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium mb-1">
            Portfolio ROCE
          </span>
          <span className="text-lg font-extrabold text-emerald-400">{portfolioRoce}%</span>
        </div>

        <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium mb-1">
            Invested Capital
          </span>
          <span className="text-lg font-extrabold text-white">{formatLakhs(investedCapital)}</span>
        </div>

        <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium mb-1">
            Liquid Capital
          </span>
          <span className="text-lg font-extrabold text-teal-300">{formatLakhs(liquidCapital)}</span>
        </div>

        <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium mb-1">
            Total Debt
          </span>
          <span className="text-lg font-extrabold text-rose-400">{formatLakhs(totalDebt)}</span>
        </div>
      </div>
    </div>
  );
};
