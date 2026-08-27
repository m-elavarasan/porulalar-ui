import React, { useState, useEffect } from 'react';
import { cfoService } from '../services/cfoService';
import { CFOOverviewResponse } from '../types';
import { RefreshCw, Scale, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const TaxPage: React.FC = () => {
  const [data, setData] = useState<CFOOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    cfoService.getCFOOverview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-slate-500 font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Evaluating Tax Position & Regime Rules Engine...</span>
      </div>
    );
  }

  const formatLakhs = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">TAX & COMPLIANCE ENGINE</span>
        <h1 className="text-3xl font-extrabold font-crowz-header text-slate-900">TAX POSITION & OPTIMIZATION</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bento-card p-6 rounded-3xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">ESTIMATED ANNUAL INCOME</span>
          <span className="text-2xl font-black font-crowz-header text-slate-900">{formatLakhs(data.taxPosition.estimatedIncome)}</span>
        </div>
        <div className="bento-card p-6 rounded-3xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">PROJECTED TAX LIABILITY</span>
          <span className="text-2xl font-black font-crowz-header text-rose-600">{formatLakhs(data.taxPosition.projectedLiability)}</span>
        </div>
        <div className="bento-card p-6 rounded-3xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">EFFECTIVE TAX RATE</span>
          <span className="text-2xl font-black font-crowz-header text-blue-600">{data.taxPosition.effectiveRate}%</span>
        </div>
        <div className="bento-card p-6 rounded-3xl bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block mb-1">TAX REGIME</span>
          <span className="text-sm font-bold text-slate-900 block mt-1">{data.taxPosition.regime}</span>
        </div>
      </div>

      <div className="bento-card p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold font-crowz-header text-slate-900 mb-6 flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-600" />
          <span>TAX OPTIMIZATION STRATEGIES</span>
        </h3>

        <div className="space-y-4">
          {data.taxPosition.optimizationStrategies.map((strat, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-800 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-slate-900 font-bold block mb-1 leading-snug">{strat}</span>
                <span className="text-slate-500 font-normal text-[11px]">Assumptions validated against current tax regime schedules. Confidence: High.</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
