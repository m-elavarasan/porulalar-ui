import React, { useState, useEffect } from 'react';
import { MonthlyCashFlowSummary } from '../types';
import { v2Service } from '../services/v2Service';
import {
  Wallet,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium">Evaluating Monthly Cash Flow Operating System...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="font-semibold">Unable to load Cash Flow Engine</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const getStabilityBadge = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (score >= 70) return { label: 'Strong', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (score >= 50) return { label: 'Moderate', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { label: 'Attention Needed', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  };

  const badge = getStabilityBadge(summary.financialStabilityScore);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Personal CFO Operating System
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
              {badge.label} ({summary.financialStabilityScore}/100)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monthly Cash Flow Engine</h1>
          <p className="text-sm text-slate-400 mt-1">High-value income allocation, fixed obligations, and safe liquidity runway.</p>
        </div>
        <button
          onClick={fetchSummary}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Recalculate
        </button>
      </div>

      {/* Top CFO Widgets Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Safe To Spend</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatINR(summary.safeToSpend)}</div>
          <p className="text-xs text-slate-400">After 30-day obligations & reserve buffer</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Money Required (7 Days)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatINR(summary.moneyRequiredNext7Days)}</div>
          <p className="text-xs text-amber-400/90 font-medium">Immediate upcoming dues queue</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cash Runway</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{summary.cashRunwayMonths} Months</div>
          <p className="text-xs text-slate-400">Based on liquid cash vs monthly burn</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Investment Capacity</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatINR(summary.investmentCapacity)}</div>
          <p className="text-xs text-slate-400">Available surplus beyond emergency reserve</p>
        </div>
      </div>

      {/* Primary Flow Sankey / Bar Container */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" /> Monthly Cash Pipeline Flow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Deterministic breakdown of Income vs Fixed Obligations</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Expected Monthly Surplus</span>
            <span className="text-lg font-bold text-emerald-400">{formatINR(summary.expectedSurplus)}</span>
          </div>
        </div>

        {/* Visual Pipeline Bar */}
        <div className="space-y-3">
          <div className="h-5 w-full bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
            <div
              style={{ width: `${Math.min(100, (summary.loanEmiObligations / (summary.totalMonthlyIncome || 1)) * 100)}%` }}
              className="bg-indigo-500 h-full rounded-l-full transition-all"
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
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Loans & EMIs</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Chit Contributions</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Equity SIPs</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Credit Card Dues</span>
          </div>
        </div>

        {/* Detailed Income vs Fixed Obligations Table Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          {/* Income Side */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Monthly Incomes</span>
              <span className="text-emerald-400 font-bold">{formatINR(summary.totalMonthlyIncome)}</span>
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Salary Income</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.salaryIncome)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Business Income</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.businessIncome)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Rental Income</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.rentalIncome)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Other Recurring Income</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.otherIncome)}</span>
              </div>
            </div>
          </div>

          {/* Obligations Side */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Fixed Obligations</span>
              <span className="text-rose-400 font-bold">{formatINR(summary.totalFixedObligations)}</span>
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Loan & Item EMIs</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.loanEmiObligations + summary.itemEmiObligations)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Chit Contributions</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.chitObligations)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Equity SIPs</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.sipObligations)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-slate-300">Credit Card Dues</span>
                <span className="text-sm font-semibold text-white">{formatINR(summary.creditCardDues)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
