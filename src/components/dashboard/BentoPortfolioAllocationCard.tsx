import React, { useState } from 'react';
import { PieChart, TrendingUp, ShieldCheck, ChevronRight } from 'lucide-react';

export const BentoPortfolioAllocationCard: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<string>('Equity SIPs');

  const assetBreakdown = [
    { name: 'Equity SIPs & Mutual Funds', allocationPct: 45, value: '₹12.65L', color: 'bg-blue-600', returnPct: 14.8 },
    { name: 'Liquid Bank Reserves', allocationPct: 25, value: '₹7.05L', color: 'bg-teal-500', returnPct: 7.2 },
    { name: 'Real Estate & Assets', allocationPct: 20, value: '₹5.60L', color: 'bg-indigo-600', returnPct: 9.5 },
    { name: 'Fixed Income & Debt', allocationPct: 10, value: '₹2.80L', color: 'bg-purple-600', returnPct: 8.1 },
  ];

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-xs border border-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Portfolio Capital Allocation
          </h3>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200">
          Target Diversified
        </span>
      </div>

      {/* Main Allocation Progress Bar & Breakdown */}
      <div className="space-y-4">
        {/* Multi-segmented Allocation Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Asset Distribution</span>
            <span className="text-slate-900 font-extrabold">₹28.10 Lakhs Total</span>
          </div>

          <div className="w-full h-4 rounded-xl bg-slate-100 flex overflow-hidden p-0.5 space-x-0.5">
            {assetBreakdown.map((asset) => (
              <div
                key={asset.name}
                style={{ width: `${asset.allocationPct}%` }}
                className={`h-full ${asset.color} rounded-lg transition-all hover:opacity-90 cursor-pointer`}
                title={`${asset.name}: ${asset.allocationPct}%`}
              />
            ))}
          </div>
        </div>

        {/* Asset Items Grid */}
        <div className="space-y-2.5 pt-2">
          {assetBreakdown.map((asset) => (
            <div
              key={asset.name}
              onClick={() => setSelectedAsset(asset.name)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                selectedAsset === asset.name
                  ? 'bg-blue-50/60 border-blue-200 shadow-2xs font-extrabold'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-md ${asset.color}`} />
                <span className="font-bold text-slate-900 truncate max-w-[170px] sm:max-w-none">
                  {asset.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-extrabold text-slate-900">{asset.value}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  +{asset.returnPct}% YoY
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
