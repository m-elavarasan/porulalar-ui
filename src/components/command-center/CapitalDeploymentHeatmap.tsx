import React from 'react';
import { IdleCapitalAnalysis, AssetCommandItem } from '../../types';
import { Zap, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface CapitalDeploymentHeatmapProps {
  idle: IdleCapitalAnalysis;
  matrix: AssetCommandItem[];
  onExploreStrategy?: (strategy: string) => void;
}

export const CapitalDeploymentHeatmap: React.FC<CapitalDeploymentHeatmapProps> = ({
  idle,
  matrix,
  onExploreStrategy,
}) => {
  const formatLakhs = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
      {/* Capital Deployment Heatmap Grid */}
      <div className="lg:col-span-7 bento-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                PRODUCTIVITY MATRIX
              </span>
              <h3 className="text-xl font-bold font-crowz-header text-slate-900">
                CAPITAL DEPLOYMENT HEATMAP
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Live Productivity
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            Real-time capital productivity spectrum mapped across yield and operating return.
          </p>

          {/* Productivity Spectrum Grid */}
          <div className="space-y-4">
            {/* High Productivity */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  HIGH PRODUCTIVITY (&gt;15% ROCE)
                </span>
                <span className="text-xs font-bold text-emerald-700">Top Performers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matrix
                  .filter((a) => a.roce >= 15)
                  .map((a) => (
                    <div key={a.id} className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-semibold text-xs border border-emerald-200 shadow-2xs flex items-center gap-2">
                      <span>{a.assetName}</span>
                      <span className="font-extrabold text-emerald-600">{a.roce}%</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Medium Productivity */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  MEDIUM PRODUCTIVITY (8% – 15% ROCE)
                </span>
                <span className="text-xs font-bold text-blue-700">Stable Income</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matrix
                  .filter((a) => a.roce >= 8 && a.roce < 15)
                  .map((a) => (
                    <div key={a.id} className="px-3 py-1.5 rounded-xl bg-white text-blue-900 font-semibold text-xs border border-blue-200 shadow-2xs flex items-center gap-2">
                      <span>{a.assetName}</span>
                      <span className="font-extrabold text-blue-600">{a.roce}%</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Low Productivity / Idle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  LOW PRODUCTIVITY (&lt;8% ROCE) / IDLE CASH
                </span>
                <span className="text-xs font-bold text-slate-600">Reallocation Candidates</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matrix
                  .filter((a) => a.roce < 8)
                  .map((a) => (
                    <div key={a.id} className="px-3 py-1.5 rounded-xl bg-white text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-2">
                      <span>{a.assetName}</span>
                      <span className="font-bold text-slate-500">{a.roce}%</span>
                    </div>
                  ))}
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-semibold text-xs border border-amber-200 shadow-2xs flex items-center gap-2">
                  <span>Idle Cash Reserve</span>
                  <span className="font-bold text-amber-600">3.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Idle Capital Detector Card */}
      <div className="lg:col-span-5 bento-card p-6 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
                IDLE CAPITAL DETECTOR
              </span>
              <h3 className="text-xl font-bold font-crowz-header text-slate-900">
                SURPLUS CAPITAL
              </h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 mb-6">
            <span className="text-xs font-semibold text-slate-500 block mb-1">POTENTIAL DEPLOYABLE CAPITAL</span>
            <span className="text-3xl font-black font-crowz-header text-amber-600 block">
              {formatLakhs(idle.deployableIdleCapital)}
            </span>
            <span className="text-xs text-slate-600 mt-1 block">
              Capital identified above modeled 6-month reserve & obligations.
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 font-medium mb-6">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Available Liquid Cash</span>
              <span className="font-bold text-slate-900">{formatLakhs(idle.totalCash)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Required Liquidity Reserve</span>
              <span className="font-semibold text-slate-700">{formatLakhs(idle.requiredLiquidityReserve)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Expected 90-Day Obligations</span>
              <span className="font-semibold text-slate-700">{formatLakhs(idle.expected90DayObligations)}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
              DEPLOYMENT STRATEGIES
            </span>
            <div className="space-y-2">
              {idle.recommendedStrategies.map((strat, idx) => (
                <div
                  key={idx}
                  onClick={() => onExploreStrategy?.(strat)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer transition-saas group"
                >
                  <span className="leading-snug">{strat}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-saas shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
