import React, { useState } from 'react';
import { TrendingUp, ChevronDown, Sparkles } from 'lucide-react';

interface PointData {
  month: string;
  value: number;
  label: string;
  x: number;
  y: number;
  growth: string;
}

export const BentoAnalyticsLineCard: React.FC = () => {
  const [activePointIdx, setActivePointIdx] = useState<number>(3);
  const [timeframe, setTimeframe] = useState<'6 Months' | '12 Months'>('6 Months');

  const points: PointData[] = [
    { month: 'Jan', value: 18.5, label: '₹18.5L', x: 20, y: 85, growth: '+3.2%' },
    { month: 'Feb', value: 19.2, label: '₹19.2L', x: 80, y: 75, growth: '+3.8%' },
    { month: 'Mar', value: 20.5, label: '₹20.5L', x: 140, y: 60, growth: '+6.7%' },
    { month: 'Apr', value: 21.8, label: '₹21.8L', x: 200, y: 48, growth: '+6.3%' },
    { month: 'May', value: 23.1, label: '₹23.1L', x: 260, y: 38, growth: '+5.9%' },
    { month: 'Jun', value: 24.8, label: '₹24.8L', x: 320, y: 28, growth: '+7.3%' },
    { month: 'Jul', value: 26.5, label: '₹26.5L', x: 380, y: 18, growth: '+6.8%' },
  ];

  const activePoint = points[activePointIdx];

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-xs border border-slate-200/80">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Wealth Growth & Trend Curve
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeframe(timeframe === '6 Months' ? '12 Months' : '6 Months')}
            className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>{timeframe}</span>
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards Row */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
          <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Selected Month Value</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-black text-slate-900 text-base">{activePoint.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
              {activePoint.growth}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">CAGR Annual Return</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-black text-slate-900 text-base">14.2% p.a.</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
              Optimal
            </span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Line Chart */}
      <div className="relative pt-4">
        {/* Floating Tooltip Callout */}
        <div
          style={{ left: `${(activePoint.x / 400) * 100}%` }}
          className="absolute -top-3 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 transition-all duration-300 pointer-events-none z-10 whitespace-nowrap"
        >
          <span>{activePoint.month}: {activePoint.label}</span>
        </div>

        <svg className="w-full h-36 overflow-visible" viewBox="0 0 400 110">
          <defs>
            <linearGradient id="areaGradInteractive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="95" x2="400" y2="95" stroke="#f1f5f9" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path
            d="M 20,85 Q 80,75 140,60 T 260,38 L 320,28 L 380,18 L 380,105 L 20,105 Z"
            fill="url(#areaGradInteractive)"
          />

          {/* Curve Line */}
          <path
            d="M 20,85 Q 80,75 140,60 T 260,38 L 320,28 L 380,18"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive Clickable Nodes */}
          {points.map((pt, idx) => {
            const isSelected = idx === activePointIdx;
            return (
              <g key={pt.month} onClick={() => setActivePointIdx(idx)} className="cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 7 : 4}
                  className={`transition-all ${
                    isSelected ? 'fill-blue-600 stroke-white stroke-2' : 'fill-blue-400 hover:fill-blue-600'
                  }`}
                />
              </g>
            );
          })}
        </svg>

        {/* X-Axis Month Selectors */}
        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 pt-2 border-t border-slate-100">
          {points.map((pt, idx) => (
            <button
              key={pt.month}
              onClick={() => setActivePointIdx(idx)}
              className={`transition-all cursor-pointer ${
                idx === activePointIdx ? 'text-blue-600 font-black scale-110' : 'hover:text-slate-700'
              }`}
            >
              {pt.month}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
