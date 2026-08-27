import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface DailyTrendItem {
  day: string;
  income: number;
  expenses: number;
  rate: number;
}

interface BentoMainChartWidgetProps {
  dailyTrend?: DailyTrendItem[];
  healthScore: number;
}

export const BentoMainChartWidget: React.FC<BentoMainChartWidgetProps> = ({
  dailyTrend = [
    { day: 'Mon', income: 5400, expenses: 1200, rate: 45 },
    { day: 'Tue', income: 0, expenses: 3200, rate: 60 },
    { day: 'Wed', income: 12000, expenses: 850, rate: 88 },
    { day: 'Thu', income: 0, expenses: 2400, rate: 55 },
    { day: 'Fri', income: 4500, expenses: 4100, rate: 72 },
    { day: 'Sat', income: 0, expenses: 5600, rate: 95 },
    { day: 'Sun', income: 0, expenses: 1900, rate: 40 },
  ],
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'Outflow' | 'Inflow' | 'Health'>('Outflow');
  const [activeDay, setActiveDay] = useState<string>('Wed');

  const maxExpense = Math.max(...dailyTrend.map((d) => d.expenses), 1);
  const maxIncome = Math.max(...dailyTrend.map((d) => d.income), 1);
  const avgExpense = Math.round(dailyTrend.reduce((sum, d) => sum + d.expenses, 0) / dailyTrend.length);

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm border border-slate-200/80">
      {/* Widget Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Financial Pulse & Daily Ledger</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </h2>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            July 12 – 19, 2026 • Real-time outflow & inflow activity
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(['Outflow', 'Inflow', 'Health'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedMetric === m
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Bar Chart Display */}
      <div className="pt-2">
        <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6">
          {dailyTrend.map((item) => {
            const val = selectedMetric === 'Outflow' ? item.expenses : item.income;
            const maxVal = selectedMetric === 'Outflow' ? maxExpense : maxIncome;
            const heightPct = Math.max(12, Math.round((val / maxVal) * 100));
            const isSelected = item.day === activeDay;

            return (
              <div
                key={item.day}
                onClick={() => setActiveDay(item.day)}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
              >
                <div
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs -translate-y-1'
                      : 'opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-700'
                  }`}
                >
                  ₹{val.toLocaleString('en-IN')}
                </div>

                <div className="w-full max-w-[42px] bg-slate-100 rounded-full h-full max-h-[160px] flex items-end p-1 relative overflow-hidden">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-rose-500 via-rose-400 to-pink-500 shadow-md shadow-rose-500/30'
                        : 'bg-rose-300/60 group-hover:bg-rose-400/80'
                    }`}
                  />
                </div>

                <div className="text-center">
                  <span
                    className={`text-xs font-bold block ${
                      isSelected ? 'text-rose-600 font-black' : 'text-slate-500'
                    }`}
                  >
                    {item.day}
                  </span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 transition-all ${
                      isSelected ? 'bg-rose-500 scale-125' : 'bg-transparent'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Rate Gradient Slider Indicator Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">
            Average daily outflow rate: <strong className="text-slate-900 font-extrabold">₹{avgExpense.toLocaleString('en-IN')} / day</strong>
          </span>
          <span className="font-extrabold text-slate-700 text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-full">
            Optimal Range (₹1,500 – ₹5,000)
          </span>
        </div>

        <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-yellow-400 to-rose-500 shadow-inner">
          <div
            style={{ left: `${Math.min(92, Math.max(8, (avgExpense / 6000) * 100))}%` }}
            className="absolute -top-2.5 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
          >
            <div className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md whitespace-nowrap flex items-center gap-1">
              <span>• Average</span>
            </div>
            <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
