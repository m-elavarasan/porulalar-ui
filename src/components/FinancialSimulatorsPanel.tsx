import React, { useState } from 'react';
import { v2Service } from '../services/v2Service';
import { LoanPrepaymentResult, SIPGrowthResult } from '../types';
import { Calculator, TrendingUp, Zap, Sparkles, RefreshCw, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const FinancialSimulatorsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PREPAYMENT' | 'SIP'>('PREPAYMENT');

  // Prepayment state
  const [prepayInputs, setPrepayInputs] = useState({
    principalOutstanding: 300000,
    interestRate: 10.5,
    remainingTenureMonths: 36,
    emiAmount: 9750,
    prepaymentAmount: 50000,
    prepaymentType: 'REDUCE_TENURE' as 'REDUCE_TENURE' | 'REDUCE_EMI'
  });
  const [prepayResult, setPrepayResult] = useState<LoanPrepaymentResult | null>(null);
  const [loadingPrepay, setLoadingPrepay] = useState(false);

  // SIP state
  const [sipInputs, setSipInputs] = useState({
    monthlyInvestment: 10000,
    expectedReturnRate: 12,
    durationYears: 10,
    stepUpPercentage: 10
  });
  const [sipResult, setSipResult] = useState<SIPGrowthResult | null>(null);
  const [loadingSIP, setLoadingSIP] = useState(false);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleSimulatePrepayment = async () => {
    setLoadingPrepay(true);
    try {
      const res = await v2Service.runLoanPrepaymentSimulator(prepayInputs);
      setPrepayResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrepay(false);
    }
  };

  const handleSimulateSIP = async () => {
    setLoadingSIP(true);
    try {
      const res = await v2Service.runSIPGrowthSimulator(sipInputs);
      setSipResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSIP(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Scenario & Projection Engine</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Simulate loan prepayments, interest savings, and step-up SIP wealth projections.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('PREPAYMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'PREPAYMENT'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Loan Prepayment
          </button>
          <button
            onClick={() => setActiveTab('SIP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'SIP'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> SIP Growth Calculator
          </button>
        </div>
      </div>

      {/* Tab 1: Loan Prepayment Simulator */}
      {activeTab === 'PREPAYMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Prepayment Inputs</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Principal Outstanding (₹)</label>
                <input
                  type="number"
                  value={prepayInputs.principalOutstanding}
                  onChange={(e) => setPrepayInputs({ ...prepayInputs, principalOutstanding: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={prepayInputs.interestRate}
                    onChange={(e) => setPrepayInputs({ ...prepayInputs, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Remaining Tenure (Months)</label>
                  <input
                    type="number"
                    value={prepayInputs.remainingTenureMonths}
                    onChange={(e) => setPrepayInputs({ ...prepayInputs, remainingTenureMonths: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Lump Sum Prepayment Amount (₹)</label>
                <input
                  type="number"
                  value={prepayInputs.prepaymentAmount}
                  onChange={(e) => setPrepayInputs({ ...prepayInputs, prepaymentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Goal Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPrepayInputs({ ...prepayInputs, prepaymentType: 'REDUCE_TENURE' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      prepayInputs.prepaymentType === 'REDUCE_TENURE'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Reduce Tenure (Max Savings)
                  </button>
                  <button
                    onClick={() => setPrepayInputs({ ...prepayInputs, prepaymentType: 'REDUCE_EMI' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      prepayInputs.prepaymentType === 'REDUCE_EMI'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Reduce Monthly EMI
                  </button>
                </div>
              </div>

              <button
                onClick={handleSimulatePrepayment}
                disabled={loadingPrepay}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs transition flex items-center justify-center gap-2 mt-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loadingPrepay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Calculate Savings
              </button>
            </div>
          </div>

          {/* Results Output */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Simulation Results</h3>

              {prepayResult ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80">
                    <span className="text-xs text-amber-700 uppercase tracking-wider font-bold block">Total Interest Saved</span>
                    <span className="text-3xl font-black text-amber-900">{formatINR(prepayResult.interestSaved)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium block">Tenure Reduced</span>
                      <span className="text-xl font-extrabold text-blue-600">{prepayResult.tenureReduced} Months</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium block">New Remaining Tenure</span>
                      <span className="text-xl font-extrabold text-slate-900">{prepayResult.newTenure} Months</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium block">Original Interest</span>
                      <span className="text-sm font-bold text-slate-700">{formatINR(prepayResult.originalInterest)}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium block">New Total Interest</span>
                      <span className="text-sm font-bold text-slate-700">{formatINR(prepayResult.newInterest)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Calculator className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Enter parameters and click Calculate to view interest savings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SIP Calculator */}
      {activeTab === 'SIP' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">SIP Step-Up Inputs</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Monthly Investment (₹)</label>
                <input
                  type="number"
                  value={sipInputs.monthlyInvestment}
                  onChange={(e) => setSipInputs({ ...sipInputs, monthlyInvestment: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Return (% p.a.)</label>
                  <input
                    type="number"
                    value={sipInputs.expectedReturnRate}
                    onChange={(e) => setSipInputs({ ...sipInputs, expectedReturnRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Years</label>
                  <input
                    type="number"
                    value={sipInputs.durationYears}
                    onChange={(e) => setSipInputs({ ...sipInputs, durationYears: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Step-Up %</label>
                  <input
                    type="number"
                    value={sipInputs.stepUpPercentage}
                    onChange={(e) => setSipInputs({ ...sipInputs, stepUpPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <button
                onClick={handleSimulateSIP}
                disabled={loadingSIP}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs transition flex items-center justify-center gap-2 mt-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loadingSIP ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Simulate Future Wealth
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">SIP Wealth Projection</h3>
              {sipResult ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                    <span className="text-xs text-emerald-700 uppercase tracking-wider font-bold block">Future Corpus Value</span>
                    <span className="text-3xl font-black text-emerald-900">{formatINR(sipResult.futureValue)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium block">Total Invested</span>
                      <span className="text-lg font-extrabold text-slate-900">{formatINR(sipResult.totalInvested)}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium block">Estimated Gains</span>
                      <span className="text-lg font-extrabold text-emerald-600">{formatINR(sipResult.estimatedGains)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Configure monthly SIP and annual step-up % to project wealth growth.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
