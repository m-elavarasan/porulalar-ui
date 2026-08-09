import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { HeartPulse, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Clock, Award } from 'lucide-react';

export interface FinancialHealthData {
  score: number;
  rating: string;
  debtToIncomeRatio: number;
  emergencyFundRunwayMonths: number;
  savingsRatePercentage: number;
  assetToLiabilityRatio: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalLiquidBalance: number;
  totalAssets: number;
  totalLiabilities: number;
}

export function FinancialHealthCard() {
  const [data, setData] = useState<FinancialHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getFinancialHealth()
      .then((res) => {
        setData(res.data || res);
      })
      .catch((err) => console.error('Failed to load financial health score:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 animate-pulse flex items-center justify-center min-h-[160px]">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <HeartPulse className="w-4 h-4 animate-spin text-emerald-400" />
          Calculating Financial Health Score...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'good':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'fair':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Score Gauge */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-950 border-4 border-emerald-500/30 shadow-inner">
            <div className="text-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">{data.score}</span>
              <span className="block text-[10px] uppercase font-bold text-slate-400">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">Financial Wellness</h3>
            </div>
            <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRatingColor(data.rating)}`}>
              {data.rating} Status
            </span>
          </div>
        </div>

        {/* Right: Key Financial Ratios Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto flex-1">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Emergency
            </div>
            <p className="text-base font-bold text-white">{data.emergencyFundRunwayMonths} Mo</p>
            <span className="text-[10px] text-slate-500">Target: 3–6 mo</span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Savings Rate
            </div>
            <p className="text-base font-bold text-white">{data.savingsRatePercentage}%</p>
            <span className="text-[10px] text-slate-500">Monthly Net</span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> DTI Ratio
            </div>
            <p className="text-base font-bold text-white">{data.debtToIncomeRatio}%</p>
            <span className="text-[10px] text-slate-500">EMI / Income</span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Asset Cover
            </div>
            <p className="text-base font-bold text-white">{data.assetToLiabilityRatio}x</p>
            <span className="text-[10px] text-slate-500">Assets / Debt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
