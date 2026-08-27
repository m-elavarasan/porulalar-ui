import React, { useState } from 'react';
import { v2Service } from '../services/v2Service';
import {
  DebtVsInvestResult,
  PurchaseAffordabilityResult,
  IncomeChangeResult,
  FinancialSnapshot
} from '../types';
import {
  Sliders,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Percent,
  DollarSign,
  Scale
} from 'lucide-react';

interface DecisionEngineCardProps {
  snapshot?: FinancialSnapshot;
  prefillDebtVsInvest?: {
    surplusAmount?: number;
    loanInterestRate?: number;
    loanPrincipalLeft?: number;
  };
}

export const DecisionEngineCard: React.FC<DecisionEngineCardProps> = ({
  snapshot,
  prefillDebtVsInvest
}) => {
  const [activeTab, setActiveTab] = useState<'DEBT_VS_INVEST' | 'PURCHASE' | 'INCOME'>('DEBT_VS_INVEST');
  const [loading, setLoading] = useState(false);

  // ─── 1. Debt vs Invest State ───────────────────────────────────────────────
  const [surplusAmount, setSurplusAmount] = useState<number>(prefillDebtVsInvest?.surplusAmount || 200000);
  const [loanRate, setLoanRate] = useState<number>(prefillDebtVsInvest?.loanInterestRate || 11.5);
  const [loanPrincipal, setLoanPrincipal] = useState<number>(prefillDebtVsInvest?.loanPrincipalLeft || 500000);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [expectedReturn, setExpectedReturn] = useState<number>(12.0);
  const [debtVsInvestResult, setDebtVsInvestResult] = useState<DebtVsInvestResult | null>(null);

  // ─── 2. Purchase Affordability State ───────────────────────────────────────
  const [purchaseItem, setPurchaseItem] = useState('New Car');
  const [purchaseTotal, setPurchaseTotal] = useState(1000000);
  const [purchaseDownPayment, setPurchaseDownPayment] = useState(200000);
  const [purchaseTenure, setPurchaseTenure] = useState(60);
  const [purchaseRate, setPurchaseRate] = useState(9.5);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseAffordabilityResult | null>(null);

  // ─── 3. Income Change State ────────────────────────────────────────────────
  const [currentIncome, setCurrentIncome] = useState<number>(snapshot?.monthlyIncome || 120000);
  const [newIncome, setNewIncome] = useState<number>((snapshot?.monthlyIncome || 120000) * 1.2);
  const [investAllocPct, setInvestAllocPct] = useState<number>(70);
  const [incomeResult, setIncomeResult] = useState<IncomeChangeResult | null>(null);

  const handleSimulateDebtVsInvest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await v2Service.runDebtVsInvestSimulator({
        surplusAmount,
        loanInterestRate: loanRate,
        loanPrincipalLeft: loanPrincipal,
        remainingTenureYears: tenureYears,
        expectedReturnRate: expectedReturn
      });
      setDebtVsInvestResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePurchase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await v2Service.runPurchaseAffordabilitySimulator({
        itemName: purchaseItem,
        totalCost: purchaseTotal,
        downPayment: purchaseDownPayment,
        proposedTenureMonths: purchaseTenure,
        estimatedInterestRate: purchaseRate,
        currentLiquidCash: snapshot?.liquidCash || 400000,
        monthlyFreeCashFlow: snapshot?.monthlyFreeCashFlow || 40000,
        emergencyBufferReq: snapshot?.emergencyBufferRequired || 150000
      });
      setPurchaseResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateIncome = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await v2Service.runIncomeChangeSimulator({
        currentMonthlyIncome: currentIncome,
        newMonthlyIncome: newIncome,
        investAllocationPct: investAllocPct
      });
      setIncomeResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-card p-6 sm:p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Financial Decision Simulator</h2>
            <span className="text-xs text-slate-400 font-medium">Compare outcomes mathematically before executing</span>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('DEBT_VS_INVEST')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'DEBT_VS_INVEST' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Debt vs Invest
          </button>
          <button
            onClick={() => setActiveTab('PURCHASE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'PURCHASE' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Affordability
          </button>
          <button
            onClick={() => setActiveTab('INCOME')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'INCOME' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Income Boost
          </button>
        </div>
      </div>

      {/* ─── TAB 1: DEBT VS INVEST SIMULATION ───────────────────────────────── */}
      {activeTab === 'DEBT_VS_INVEST' && (
        <div className="space-y-6">
          <form onSubmit={handleSimulateDebtVsInvest} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Surplus Amount (₹)</label>
              <input
                type="number"
                value={surplusAmount}
                onChange={(e) => setSurplusAmount(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Loan Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Expected Market CAGR (%)</label>
              <input
                type="number"
                step="0.1"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={15} />
                <span>{loading ? 'Calculating...' : 'Run Scenario Comparison'}</span>
              </button>
            </div>
          </form>

          {debtVsInvestResult && (
            <div className="space-y-4 pt-4 border-t border-slate-800 animate-fadeIn">
              <div className="bg-blue-950/40 p-4 rounded-2xl border border-blue-800/40 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Deterministic Recommendation</span>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Optimal Path: {debtVsInvestResult.winnerOption}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {debtVsInvestResult.explainableVerdict}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Option A */}
                <div className={`p-4 rounded-2xl border ${debtVsInvestResult.winnerOption.includes('Prepayment') ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-800/60 border-slate-700'} space-y-2`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{debtVsInvestResult.OptionA_Prepay.name}</span>
                  <div className="text-xl font-black text-white">
                    ₹{debtVsInvestResult.OptionA_Prepay.EndingWealth.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">
                    +₹{debtVsInvestResult.OptionA_Prepay.InterestSaved.toLocaleString('en-IN')} Interest Saved
                  </div>
                  <p className="text-[11px] text-slate-400">{debtVsInvestResult.OptionA_Prepay.description}</p>
                </div>

                {/* Option B */}
                <div className={`p-4 rounded-2xl border ${debtVsInvestResult.winnerOption.includes('Equity') ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-800/60 border-slate-700'} space-y-2`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{debtVsInvestResult.OptionB_Invest.name}</span>
                  <div className="text-xl font-black text-white">
                    ₹{debtVsInvestResult.OptionB_Invest.EndingWealth.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-blue-400 font-semibold">
                    +₹{debtVsInvestResult.OptionB_Invest.InvestmentGains.toLocaleString('en-IN')} Market Gains
                  </div>
                  <p className="text-[11px] text-slate-400">{debtVsInvestResult.OptionB_Invest.description}</p>
                </div>

                {/* Option C */}
                <div className={`p-4 rounded-2xl border ${debtVsInvestResult.winnerOption.includes('Split') ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-800/60 border-slate-700'} space-y-2`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{debtVsInvestResult.OptionC_Split.name}</span>
                  <div className="text-xl font-black text-white">
                    ₹{debtVsInvestResult.OptionC_Split.EndingWealth.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-indigo-300 font-semibold">
                    Balanced Wealth & Risk
                  </div>
                  <p className="text-[11px] text-slate-400">{debtVsInvestResult.OptionC_Split.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: PURCHASE AFFORDABILITY SIMULATION ───────────────────────── */}
      {activeTab === 'PURCHASE' && (
        <div className="space-y-6">
          <form onSubmit={handleSimulatePurchase} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Item / Purpose</label>
              <input
                type="text"
                value={purchaseItem}
                onChange={(e) => setPurchaseItem(e.target.value)}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Total Cost (₹)</label>
              <input
                type="number"
                value={purchaseTotal}
                onChange={(e) => setPurchaseTotal(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Down Payment (₹)</label>
              <input
                type="number"
                value={purchaseDownPayment}
                onChange={(e) => setPurchaseDownPayment(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={15} />
                <span>{loading ? 'Evaluating...' : 'Evaluate Affordability'}</span>
              </button>
            </div>
          </form>

          {purchaseResult && (
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    purchaseResult.status === 'AFFORDABLE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : purchaseResult.status === 'STRETCHED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  }`}
                >
                  Verdict: {purchaseResult.status}
                </span>

                <span className="text-xs font-bold text-slate-300">
                  Est. Monthly EMI: <strong className="text-white">₹{purchaseResult.estimatedMonthlyEmi.toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{purchaseResult.explainableReason}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-700 text-slate-400">
                <div>
                  Post-Purchase Liquid Buffer:{' '}
                  <strong className="text-white">₹{purchaseResult.postPurchaseBuffer.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  Post-Purchase Free Cashflow:{' '}
                  <strong className="text-white">₹{purchaseResult.postPurchaseCashflow.toLocaleString('en-IN')}/mo</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: INCOME CHANGE SIMULATION ────────────────────────────────── */}
      {activeTab === 'INCOME' && (
        <div className="space-y-6">
          <form onSubmit={handleSimulateIncome} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Current Monthly Income (₹)</label>
              <input
                type="number"
                value={currentIncome}
                onChange={(e) => setCurrentIncome(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">New Monthly Income (₹)</label>
              <input
                type="number"
                value={newIncome}
                onChange={(e) => setNewIncome(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">% Allocated to Wealth SIP</label>
              <input
                type="number"
                value={investAllocPct}
                onChange={(e) => setInvestAllocPct(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={15} />
                <span>{loading ? 'Projecting...' : 'Project Wealth Acceleration'}</span>
              </button>
            </div>
          </form>

          {incomeResult && (
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">
                  +₹{incomeResult.monthlyIncrement.toLocaleString('en-IN')} Monthly Raise
                </span>
                <span className="text-slate-300">
                  10-Year Added Wealth: <strong className="text-emerald-400 text-sm font-extrabold">+₹{incomeResult.addedWealth10Yr.toLocaleString('en-IN')}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{incomeResult.explainableVerdict}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
