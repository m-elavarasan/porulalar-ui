import React, { useState, useEffect } from 'react';
import { Chit, ChitLoanComparisonResult } from '../types';
import { v2Service } from '../services/v2Service';
import { Sparkles, ArrowRight, CheckCircle2, HelpCircle, X, ShieldAlert, Award, TrendingUp } from 'lucide-react';

interface ChitIntelligenceModalProps {
  chit: Chit;
  onClose: () => void;
}

export const ChitIntelligenceModal: React.FC<ChitIntelligenceModalProps> = ({ chit, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [comparisons, setComparisons] = useState<ChitLoanComparisonResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntel = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await v2Service.getChitIntelligence(chit.id);
        setComparisons(res.comparisons || []);
      } catch (err: any) {
        setError(err.message || 'Failed to analyze chit decision');
      } finally {
        setLoading(false);
      }
    };
    fetchIntel();
  }, [chit.id]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Chit Intelligence Engine <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">v2 Decision AI</span>
              </h2>
              <p className="text-xs text-slate-400">Analyzing <span className="text-slate-200 font-semibold">{chit.chitName}</span> against active loan portfolios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Sparkles className="w-8 h-8 animate-spin text-amber-500 mb-3" />
              <p className="text-sm font-medium">Running Amortization & Chit Arbitrage Simulations...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm">
              {error}
            </div>
          ) : comparisons.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
              <Award className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-semibold text-slate-300">No Active High-Interest Loans Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Chit prize bidding optimization generates maximum financial arbitrage when used to extinguish loans with interest rates above 9%.
              </p>
            </div>
          ) : (
            comparisons.map((comp, idx) => {
              const isRecommended = comp.recommendation === 'TAKE_CHIT_NOW';
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all ${
                    isRecommended
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/40 shadow-lg'
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isRecommended
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isRecommended ? '★ TAKE CHIT THIS MONTH' : 'WAIT FOR LATER MONTHS'}
                        </span>
                        <span className="text-xs text-slate-400">Score: {comp.recommendationScore}/100</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">Target Loan: {comp.loanName} ({comp.loanInterestRate}% Rate)</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Expected Prize Payout</span>
                      <span className="text-xl font-bold text-amber-400">{formatINR(comp.prizePayout)}</span>
                    </div>
                  </div>

                  {/* Impact Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
                    <div>
                      <span className="text-xs text-slate-400 block">Interest Saved</span>
                      <span className="text-base font-bold text-emerald-400">{formatINR(comp.interestSaved)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Tenure Reduced</span>
                      <span className="text-base font-bold text-indigo-400">{comp.tenureMonthsReduced} Months</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Net Financial Benefit</span>
                      <span className="text-base font-bold text-amber-400">{formatINR(comp.netFinancialBenefit)}</span>
                    </div>
                  </div>

                  {/* Reasoning Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explainable Financial Reasoning</h4>
                    <div className="space-y-1.5">
                      {comp.reasoning.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
