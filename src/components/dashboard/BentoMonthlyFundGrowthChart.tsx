import React, { useState } from 'react';
import { Download, TrendingUp, DollarSign, Layers } from 'lucide-react';

interface MonthlyDataItem {
  month: string;
  netWorth: number;
  invested: number;
  liquidCash: number;
  growthPct: number;
}

interface BentoMonthlyFundGrowthChartProps {
  barData?: Array<{ name: string; Income: number; Expenses: number }>;
}

export const BentoMonthlyFundGrowthChart: React.FC<BentoMonthlyFundGrowthChartProps> = () => {
  const [selectedView, setSelectedView] = useState<'Net Worth' | 'Liquid vs Invested' | 'Net Growth'>('Net Worth');
  const [activeMonth, setActiveMonth] = useState<string>('Jul');

  const monthlyData: MonthlyDataItem[] = [
    { month: 'Jan', netWorth: 1850000, invested: 1200000, liquidCash: 650000, growthPct: 3.2 },
    { month: 'Feb', netWorth: 1920000, invested: 1250000, liquidCash: 670000, growthPct: 3.8 },
    { month: 'Mar', netWorth: 2050000, invested: 1350000, liquidCash: 700000, growthPct: 6.7 },
    { month: 'Apr', netWorth: 2180000, invested: 1450000, liquidCash: 730000, growthPct: 6.3 },
    { month: 'May', netWorth: 2310000, invested: 1580000, liquidCash: 730000, growthPct: 5.9 },
    { month: 'Jun', netWorth: 2480000, invested: 1720000, liquidCash: 760000, growthPct: 7.3 },
    { month: 'Jul', netWorth: 2650000, invested: 1850000, liquidCash: 800000, growthPct: 6.8 },
    { month: 'Aug', netWorth: 2820000, invested: 1980000, liquidCash: 840000, growthPct: 6.4 },
  ];

  const maxVal = Math.max(...monthlyData.map((d) => d.netWorth), 1);
  const activeItem = monthlyData.find((d) => d.month === activeMonth) || monthlyData[6];

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-xs border border-slate-200/80">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Monthly Fund Growth & Capital Allocation</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                MoM Fund View
              </span>
            </h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Month-over-month wealth accumulation across liquid cash & investment portfolios
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(['Net Worth', 'Liquid vs Invested', 'Net Growth'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedView(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedView === v
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Monthly Bar Chart Visualizer */}
      <div className="pt-4">
        <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4">
          {monthlyData.map((item) => {
            const displayVal =
              selectedView === 'Net Worth'
                ? item.netWorth
                : selectedView === 'Liquid vs Invested'
                ? item.invested
                : item.growthPct * 300000;

            const heightPct = Math.max(15, Math.round((displayVal / maxVal) * 100));
            const isSelected = item.month === activeMonth;

            return (
              <div
                key={item.month}
                onClick={() => setActiveMonth(item.month)}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
              >
                {/* Dynamic Value Tooltip */}
                <div
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs -translate-y-1'
                      : 'opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-700'
                  }`}
                >
                  ₹{(displayVal / 100000).toFixed(1)}L
                </div>

                {/* Stacked / Rounded Bar */}
                <div className="w-full max-w-[44px] bg-slate-100 rounded-2xl h-full max-h-[170px] flex items-end p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-xl transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-blue-700 via-indigo-600 to-blue-500 shadow-md shadow-blue-500/30'
                        : 'bg-indigo-300/60 group-hover:bg-indigo-400/80'
                    }`}
                  />
                </div>

                {/* Month Label */}
                <div className="text-center">
                  <span
                    className={`text-xs font-bold block ${
                      isSelected ? 'text-blue-600 font-black' : 'text-slate-500'
                    }`}
                  >
                    {item.month}
                  </span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 transition-all ${
                      isSelected ? 'bg-blue-600 scale-125' : 'bg-transparent'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Month Metrics Banner */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Selected Month</span>
            <span className="font-black text-slate-900 text-sm">{activeItem.month} 2026</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Net Portfolio Value</span>
            <span className="font-black text-blue-600 text-sm">₹{(activeItem.netWorth / 100000).toFixed(2)} Lakhs</span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Liquid vs Invested Ratio</span>
            <span className="font-extrabold text-slate-700">
              ₹{(activeItem.liquidCash / 100000).toFixed(1)}L Liquid / ₹{(activeItem.invested / 100000).toFixed(1)}L Invested
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl self-start sm:self-auto">
          <TrendingUp size={14} /> +{activeItem.growthPct}% MoM Growth
        </span>
      </div>
    </div>
  );
};
