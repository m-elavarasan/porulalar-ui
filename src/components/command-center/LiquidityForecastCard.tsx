import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { ShieldAlert, Droplets, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { LiquidityCommand, RollingCashflowMonth } from '../../types';

interface LiquidityForecastCardProps {
  liquidity: LiquidityCommand;
  cashflow: RollingCashflowMonth[];
}

export const LiquidityForecastCard: React.FC<LiquidityForecastCardProps> = ({
  liquidity,
  cashflow,
}) => {
  const formatLakhs = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="bento-card p-6 rounded-3xl mb-8 border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            LIQUIDITY COMMAND CENTER
          </span>
          <h3 className="text-xl font-bold font-crowz-header text-slate-900">
            6-MONTH ROLLING LIQUIDITY FORECAST
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span>Coverage: {liquidity.liquidityCoveragePct}%</span>
          </div>
        </div>
      </div>

      {liquidity.liquidityWarningMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 mb-6 flex items-start gap-3 text-xs text-rose-800 font-medium">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-900 font-bold text-sm mb-0.5">LIQUIDITY RISK DETECTED</strong>
            <p>{liquidity.liquidityWarningMessage}</p>
          </div>
        </div>
      )}

      {/* 6-Month Rolling Bar Chart */}
      <div className="h-60 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashflow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => `${(val / 100000).toFixed(0)}L`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '14px',
                color: '#FFF',
              }}
              formatter={(val: any) => [formatLakhs(Number(val)), 'Closing Cash']}
            />
            <ReferenceLine y={liquidity.requiredReserve} stroke="#F43F5E" strokeDasharray="4 4" label={{ value: 'Min Reserve', fill: '#F43F5E', fontSize: 10 }} />
            <Bar dataKey="closingCash" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Closing Cash Balance" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500 text-[11px] block mb-1 font-medium">AVAILABLE CASH</span>
          <span className="text-base font-bold text-slate-900">{formatLakhs(liquidity.availableCash)}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500 text-[11px] block mb-1 font-medium">REQUIRED RESERVE</span>
          <span className="text-base font-bold text-slate-900">{formatLakhs(liquidity.requiredReserve)}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500 text-[11px] block mb-1 font-medium">DEPLOYABLE CAPITAL</span>
          <span className="text-base font-bold text-emerald-600">{formatLakhs(liquidity.deployableCapital)}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-slate-500 text-[11px] block mb-1 font-medium">NEXT 90-DAY NEED</span>
          <span className="text-base font-bold text-slate-900">{formatLakhs(liquidity.next90DayObligations)}</span>
        </div>
      </div>
    </div>
  );
};
