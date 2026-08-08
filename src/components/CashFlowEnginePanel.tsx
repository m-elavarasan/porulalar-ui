import React, { useState, useEffect } from 'react';
import { MonthlyCashFlowSummary } from '../types';
import { v2Service } from '../services/v2Service';
import {
  Wallet,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Calendar,
  AlertTriangle,
  RefreshCw,
  PieChart
} from 'lucide-react';

export const CashFlowEnginePanel: React.FC = () => {
  const [summary, setSummary] = useState<MonthlyCashFlowSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await v2Service.getCashFlowSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cash flow engine stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-semibold">Evaluating Monthly Cash Flow Operating System...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
        <div>
          <p className="font-bold text-xs">Unable to load Cash Flow Engine</p>
          <p className="text-xs opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const getStabilityBadge = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 70) return { label: 'Strong', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (score >= 50) return { label: 'Moderate', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Attention Needed', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const badge = getStabilityBadge(summary.financialStabilityScore);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-600" /> Personal CFO Operating System
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.color}`}>
              {badge.label} ({summary.financialStabilityScore}/100)
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Monthly Cash Flow Engine</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">High-value income allocation, fixed obligations, and safe liquidity runway.</p>
        </div>
        <button
          onClick={fetchSummary}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recalculate
        </button>
      </div>

      {/* Top CFO Widgets Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Safe To Spend</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(summary.safeToSpend)}</div>
          <p className="text-[10px] text-slate-500 font-medium">After 30-day obligations & reserve buffer</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Required (7 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(summary.moneyRequiredNext7Days)}</div>
          <p className="text-[10px] text-amber-600 font-semibold">Immediate upcoming dues queue</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cash Runway</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.cashRunwayMonths} Months</div>
          <p className="text-[10px] text-slate-500 font-medium">Based on liquid cash vs monthly burn</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Investment Surplus</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(summary.investmentCapacity)}</div>
          <p className="text-[10px] text-slate-500 font-medium">Surplus beyond emergency reserve</p>
        </div>
      </div>

      {/* Primary Flow Sankey / Bar Container */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <PieChart className="w-4 h-4 text-blue-600" /> Monthly Cash Pipeline Flow
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Deterministic breakdown of Income vs Fixed Obligations</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Expected Surplus</span>
            <span className="text-base font-black text-emerald-600">{formatINR(summary.expectedSurplus)}</span>
          </div>
        </div>

        {/* Visual Pipeline Bar */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-200/60">
            <div
              style={{ width: `${Math.min(100, (summary.loanEmiObligations / (summary.totalMonthlyIncome || 1)) * 100)}%` }}
              className="bg-blue-600 h-full rounded-l-full transition-all"
              title="Loans & EMIs"
            />
            <div
              style={{ width: `${Math.min(100, (summary.chitObligations / (summary.totalMonthlyIncome || 1)) * 100)}%` }}
              className="bg-amber-500 h-full transition-all"
              title="Chit Funds"
            />
            <div
              style={{ width: `${Math.min(100, (summary.sipObligations / (summary.totalMonthlyIncome || 1)) * 100)}%` }}
              className="bg-emerald-500 h-full transition-all"
              title="SIP Investments"
            />
            <div
              style={{ width: `${Math.min(100, (summary.creditCardDues / (summary.totalMonthlyIncome || 1)) * 100)}%` }}
              className="bg-rose-500 h-full transition-all"
              title="Credit Card Bills"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Loans & EMIs</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Chit Contributions</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Equity SIPs</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Credit Card Dues</span>
          </div>
        </div>
      </div>
    </div>
  );
};
