import React, { useState } from 'react';
import { v2Service } from '../services/v2Service';
import { LoanPrepaymentResult, SIPGrowthResult } from '../types';
import { Calculator, TrendingUp, DollarSign, Clock, Zap, Award, Sparkles, RefreshCw } from 'lucide-react';

export const FinancialSimulatorsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PREPAYMENT' | 'SIP' | 'RETIREMENT' | 'CHIT_BID'>('PREPAYMENT');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Interactive Financial Simulators
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scenario & Projection Engine</h1>
          <p className="text-sm text-slate-400 mt-1">Simulate loan prepayments, compound SIP growth, retirement runway, and chit returns.</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('PREPAYMENT')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'PREPAYMENT'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" /> Loan Prepayment Simulator
        </button>
        <button
          onClick={() => setActiveTab('SIP')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === 'SIP'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> SIP Growth & Step-Up Calculator
        </button>
      </div>

      {/* Tab 1: Loan Prepayment Simulator */}
      {activeTab === 'PREPAYMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Prepayment Inputs</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Principal Outstanding (₹)</label>
                <input
                  type="number"
                  value={prepayInputs.principalOutstanding}
                  onChange={(e) => setPrepayInputs({ ...prepayInputs, principalOutstanding: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={prepayInputs.interestRate}
                    onChange={(e) => setPrepayInputs({ ...prepayInputs, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Remaining Tenure (Months)</label>
                  <input
                    type="number"
                    value={prepayInputs.remainingTenureMonths}
                    onChange={(e) => setPrepayInputs({ ...prepayInputs, remainingTenureMonths: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Lump Sum Prepayment Amount (₹)</label>
                <input
                  type="number"
                  value={prepayInputs.prepaymentAmount}
                  onChange={(e) => setPrepayInputs({ ...prepayInputs, prepaymentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Prepayment Goal Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPrepayInputs({ ...prepayInputs, prepaymentType: 'REDUCE_TENURE' })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      prepayInputs.prepaymentType === 'REDUCE_TENURE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Reduce Tenure (Save Max Interest)
                  </button>
                  <button
                    onClick={() => setPrepayInputs({ ...prepayInputs, prepaymentType: 'REDUCE_EMI' })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      prepayInputs.prepaymentType === 'REDUCE_EMI'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Reduce Monthly EMI
                  </button>
                </div>
              </div>

              <button
                onClick={handleSimulatePrepayment}
                disabled={loadingPrepay}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 text-sm transition flex items-center justify-center gap-2 mt-2"
              >
                {loadingPrepay ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Calculate Savings
              </button>
            </div>
          </div>

          {/* Results Output */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-4">Simulation Results</h3>

              {prepayResult ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold block">Total Interest Saved</span>
                    <span className="text-3xl font-extrabold text-amber-300">{formatINR(prepayResult.interestSaved)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">Tenure Reduced</span>
                      <span className="text-xl font-bold text-indigo-400">{prepayResult.tenureReduced} Months</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">New Remaining Tenure</span>
                      <span className="text-xl font-bold text-white">{prepayResult.newTenure} Months</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">Original Total Interest</span>
                      <span className="text-sm font-semibold text-slate-300">{formatINR(prepayResult.originalInterest)}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">New Total Interest</span>
                      <span className="text-sm font-semibold text-slate-300">{formatINR(prepayResult.newInterest)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Enter parameters and click Calculate to view interest and tenure reduction.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SIP Calculator */}
      {activeTab === 'SIP' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">SIP Step-Up Inputs</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Monthly Investment (₹)</label>
                <input
                  type="number"
                  value={sipInputs.monthlyInvestment}
                  onChange={(e) => setSipInputs({ ...sipInputs, monthlyInvestment: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Return Rate (% p.a.)</label>
                  <input
                    type="number"
                    value={sipInputs.expectedReturnRate}
                    onChange={(e) => setSipInputs({ ...sipInputs, expectedReturnRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Years</label>
                  <input
                    type="number"
                    value={sipInputs.durationYears}
                    onChange={(e) => setSipInputs({ ...sipInputs, durationYears: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Annual Step-Up %</label>
                  <input
                    type="number"
                    value={sipInputs.stepUpPercentage}
                    onChange={(e) => setSipInputs({ ...sipInputs, stepUpPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSimulateSIP}
                disabled={loadingSIP}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm transition flex items-center justify-center gap-2 mt-2"
              >
                {loadingSIP ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Simulate Future Wealth
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-4">SIP Wealth Projection</h3>
              {sipResult ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold block">Future Wealth Value</span>
                    <span className="text-3xl font-extrabold text-emerald-300">{formatINR(sipResult.futureValue)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">Total Invested</span>
                      <span className="text-lg font-bold text-white">{formatINR(sipResult.totalInvested)}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">Estimated Returns Gain</span>
                      <span className="text-lg font-bold text-emerald-400">{formatINR(sipResult.estimatedGains)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Configure monthly SIP and annual step-up % to project compound wealth growth.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
