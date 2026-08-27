import React, { useState, useEffect } from 'react';
import { cfoService } from '../../services/cfoService';
import { porulalarStore } from '../../lib/store';
import {
  Calculator,
  Percent,
  Layers,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Building2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  Sliders,
  Scale,
  Award
} from 'lucide-react';
import {
  ChitSimResult,
  ChitCompareResult,
  ChitLoanStrategyResult,
  LandSimResult,
  AffordabilityResult,
  MultiOptionCompareResult
} from '../../types';

export const CentralSimulatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'loan' | 'chit' | 'chit-compare' | 'chit-loan' | 'investment' | 'land' | 'affordability' | 'multi-option'
  >('loan');

  // Real Database Collections
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [userChits, setUserChits] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [selectedChitId, setSelectedChitId] = useState<string>('');

  // 1. Loan Prepayment State
  const [loanPrincipal, setLoanPrincipal] = useState<number>(840000);
  const [loanRate, setLoanRate] = useState<number>(12.4);
  const [loanTenure, setLoanTenure] = useState<number>(42);
  const [loanEMI, setLoanEMI] = useState<number>(22000);
  const [prepayAmount, setPrepayAmount] = useState<number>(100000);
  const [loanResult, setLoanResult] = useState<any | null>(null);

  // 2. Chit Calculator State
  const [chitValue, setChitValue] = useState<number>(500000);
  const [chitDuration, setChitDuration] = useState<number>(20);
  const [chitMonthly, setChitMonthly] = useState<number>(25000);
  const [chitDiscount, setChitDiscount] = useState<number>(80000);
  const [chitMonth, setChitMonth] = useState<number>(5);
  const [chitResult, setChitResult] = useState<ChitSimResult | null>(null);

  // 3. Chit Compare State
  const [compareResult, setCompareResult] = useState<ChitCompareResult | null>(null);

  // 4. Chit + Loan Strategy State
  const [clStrategyResult, setClStrategyResult] = useState<ChitLoanStrategyResult | null>(null);

  // 5. Investment State
  const [sipAmount, setSipAmount] = useState<number>(10000);
  const [sipReturn, setSipReturn] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(5);
  const [sipResult, setSipResult] = useState<any | null>(null);

  // 6. Land State
  const [landPrice, setLandPrice] = useState<number>(1000000);
  const [landRegCosts, setLandRegCosts] = useState<number>(70000);
  const [landYears, setLandYears] = useState<number>(5);
  const [landGrowth, setLandGrowth] = useState<number>(10);
  const [landRental, setLandRental] = useState<number>(36000);
  const [landResult, setLandResult] = useState<LandSimResult | null>(null);

  // 7. Affordability State
  const [affItem, setAffItem] = useState<string>('₹8L Car Purchase');
  const [affCost, setAffCost] = useState<number>(800000);
  const [affDown, setAffDown] = useState<number>(200000);
  const [affEMI, setAffEMI] = useState<number>(14500);
  const [affResult, setAffResult] = useState<AffordabilityResult | null>(null);

  // 8. Multi-Option Engine State
  const [multiCash, setMultiCash] = useState<number>(200000);
  const [multiResult, setMultiResult] = useState<MultiOptionCompareResult | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  // Load user's actual database records
  useEffect(() => {
    const loadRealUserData = async () => {
      try {
        const [loansList, chitsList, summaryData] = await Promise.all([
          porulalarStore.fetchCollection('loans'),
          porulalarStore.fetchCollection('chits'),
          cfoService.getCFOSummary()
        ]);

        if (loansList && loansList.length > 0) {
          setUserLoans(loansList);
          const first = loansList[0];
          setSelectedLoanId(first.id);
          setLoanPrincipal(first.principalOutstanding || first.loanAmount || 840000);
          setLoanRate(first.interestRate || 12.4);
          setLoanTenure(first.tenureMonths || first.remainingTenureMonths || 42);
          setLoanEMI(first.emiAmount || 22000);
        }

        if (chitsList && chitsList.length > 0) {
          setUserChits(chitsList);
          const firstChit = chitsList[0];
          setSelectedChitId(firstChit.id);
          setChitValue(firstChit.totalChitValue || 500000);
          setChitDuration(firstChit.durationMonths || 20);
          setChitMonthly(firstChit.monthlyContribution || 25000);
        }

        if (summaryData?.position?.cash) {
          setMultiCash(summaryData.position.cash);
        }
      } catch (e) {
        console.error('Failed to load user financial records into Central Simulator', e);
      }
    };

    loadRealUserData();
  }, []);

  const handleSelectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    const selected = userLoans.find((l) => l.id === loanId);
    if (selected) {
      setLoanPrincipal(selected.principalOutstanding || selected.loanAmount || 840000);
      setLoanRate(selected.interestRate || 12.4);
      setLoanTenure(selected.tenureMonths || selected.remainingTenureMonths || 42);
      setLoanEMI(selected.emiAmount || 22000);
    }
  };

  const handleSelectChit = (chitId: string) => {
    setSelectedChitId(chitId);
    const selected = userChits.find((c) => c.id === chitId);
    if (selected) {
      setChitValue(selected.totalChitValue || 500000);
      setChitDuration(selected.durationMonths || 20);
      setChitMonthly(selected.monthlyContribution || 25000);
    }
  };

  // Actions
  const runLoanSimulation = async () => {
    setLoading(true);
    try {
      const res = await cfoService.simulateLoanPrepayment({
        principalOutstanding: loanPrincipal,
        interestRate: loanRate,
        remainingTenureMonths: loanTenure,
        emiAmount: loanEMI,
        prepaymentAmount: prepayAmount,
        prepaymentType: 'REDUCE_TENURE'
      });
      setLoanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runChitSimulation = async () => {
    setLoading(true);
    try {
      const res = await cfoService.simulateChit({
        chitValue,
        durationMonths: chitDuration,
        monthlyContribution: chitMonthly,
        auctionDiscount: chitDiscount,
        commissionPct: 5,
        foremanCharges: 0,
        auctionMonth: chitMonth
      });
      setChitResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runChitComparison = async () => {
    setLoading(true);
    try {
      const res = await cfoService.compareChits({
        chits: [
          { chitValue: 500000, durationMonths: 20, monthlyContribution: 25000, auctionDiscount: 80000, commissionPct: 5, foremanCharges: 0, auctionMonth: 5 },
          { chitValue: 300000, durationMonths: 20, monthlyContribution: 15000, auctionDiscount: 45000, commissionPct: 5, foremanCharges: 0, auctionMonth: 5 },
          { chitValue: 1000000, durationMonths: 20, monthlyContribution: 50000, auctionDiscount: 140000, commissionPct: 5, foremanCharges: 0, auctionMonth: 5 }
        ]
      });
      setCompareResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runChitLoanStrategy = async () => {
    setLoading(true);
    try {
      const res = await cfoService.simulateChitLoanStrategy({
        loanOutstanding: loanPrincipal,
        loanInterestRate: loanRate,
        loanRemainingMonths: loanTenure,
        loanEmi: loanEMI,
        chitValue,
        chitDurationMonths: chitDuration,
        chitMonthlyPay: chitMonthly,
        chitAuctionDiscount: chitDiscount,
        chitAuctionMonth: chitMonth,
        currentEmergencyCash: 120000
      });
      setClStrategyResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runInvestmentSim = async () => {
    setLoading(true);
    try {
      const res = await cfoService.simulateInvestment({
        monthlyInvestment: sipAmount,
        expectedReturnRate: sipReturn,
        durationYears: sipYears,
        stepUpPercentage: 0
      });
      setSipResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runLandSim = async () => {
    setLoading(true);
    try {
      const res = await cfoService.simulateLand({
        purchasePrice: landPrice,
        registrationCosts: landRegCosts,
        holdingPeriodYears: landYears,
        expectedAppreciationPct: landGrowth,
        annualRentalIncome: landRental,
        annualMaintenance: 5000
      });
      setLandResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runAffordabilitySim = async () => {
    setLoading(true);
    try {
      const res = await cfoService.evaluateAffordability({
        itemName: affItem,
        purchaseCost: affCost,
        downPayment: affDown,
        newMonthlyEmi: affEMI,
        tenureMonths: 60,
        monthlyIncome: 77600,
        existingCommitments: 32000,
        essentialLiving: 15000,
        currentLiquidCash: 245000,
        emergencyBufferMonths: 3
      });
      setAffResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runMultiOptionCompare = async () => {
    setLoading(true);
    try {
      const res = await cfoService.compareMultiOptions({
        availableCash: multiCash,
        loanInterestRate: loanRate,
        loanBalance: loanPrincipal,
        expectedSipReturn: sipReturn
      });
      setMultiResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>CENTRAL FINANCIAL SIMULATOR</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            WHAT IF? — DECISION STUDIO
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulate loans, chits, land, investments & multi-option financial choices with exact calculations.
          </p>
        </div>
      </div>

      {/* Simulator Navigation Bento Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-slate-100 p-2 rounded-2xl">
        {[
          { id: 'loan', label: 'Loan Prepayment', icon: Calculator },
          { id: 'chit', label: 'Chit Calculator', icon: Percent },
          { id: 'chit-compare', label: 'Compare Chits', icon: Scale },
          { id: 'chit-loan', label: 'Chit + Loan', icon: Sparkles },
          { id: 'investment', label: 'Investment', icon: TrendingUp },
          { id: 'land', label: 'Land & Property', icon: Building2 },
          { id: 'affordability', label: 'Can I Afford It?', icon: ShieldAlert },
          { id: 'multi-option', label: 'CFO Engine', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 1. LOAN PREPAYMENT SIMULATOR ── */}
      {activeTab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Loan Parameters
            </h3>

            {userLoans.length > 0 && (
              <div>
                <label className="text-xs font-bold text-blue-600 block mb-1">Select from Your Active Loans</label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => handleSelectLoan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/50 text-slate-900 font-bold text-xs focus:outline-none"
                >
                  {userLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loanName} — ₹{(l.principalOutstanding || l.loanAmount)?.toLocaleString()} @ {l.interestRate}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Current Outstanding (₹)</label>
              <input
                type="number"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanRate}
                  onChange={(e) => setLoanRate(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Remaining Months</label>
                <input
                  type="number"
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Select Prepayment Amount</label>
              <div className="flex gap-2 mb-2">
                {[50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPrepayAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      prepayAmount === amt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹{amt / 1000}K
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={prepayAmount}
                onChange={(e) => setPrepayAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={runLoanSimulation}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {loading ? 'CALCULATING...' : 'SIMULATE PREPAYMENT'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">SIMULATION OUTCOME COMPARISON</h3>

            {loanResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">WITHOUT PREPAYMENT</span>
                    <p className="text-xl font-bold text-slate-900">Remaining Interest: ₹{loanResult.originalInterest?.toLocaleString()}</p>
                    <p className="text-xs text-slate-600">Closure: {loanResult.originalTenure} months remaining</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                      WITH ₹{prepayAmount.toLocaleString()} PREPAYMENT
                    </span>
                    <p className="text-xl font-bold text-emerald-900">Remaining Interest: ₹{loanResult.newInterest?.toLocaleString()}</p>
                    <p className="text-xs text-emerald-700 font-semibold">New Closure: {loanResult.newTenure} months remaining</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">TOTAL INTEREST SAVED</span>
                    <p className="text-3xl font-extrabold text-blue-900">₹{loanResult.interestSaved?.toLocaleString()}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1">TIME SAVED</span>
                    <p className="text-3xl font-extrabold text-indigo-900">{loanResult.tenureReduced} Months</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs leading-relaxed font-semibold">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold mb-1">CFO RECOMMENDATION</strong>
                    Prepaying ₹{prepayAmount.toLocaleString()} saves approximately ₹{loanResult.interestSaved?.toLocaleString()} in interest and shortens your debt horizon by {loanResult.tenureReduced} months. Ensure your emergency reserve remains at least 3x monthly obligations post prepayment.
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Calculator className="w-10 h-10 stroke-1" />
                <p className="text-xs font-semibold">Click "Simulate Prepayment" to see interest & tenure savings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. CHIT CALCULATOR ── */}
      {activeTab === 'chit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Percent className="w-5 h-5 text-pink-600" />
              Chit Parameters
            </h3>

            {userChits.length > 0 && (
              <div>
                <label className="text-xs font-bold text-pink-600 block mb-1">Select from Your Active Chits</label>
                <select
                  value={selectedChitId}
                  onChange={(e) => handleSelectChit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 bg-pink-50/50 text-slate-900 font-bold text-xs focus:outline-none"
                >
                  {userChits.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.chitName} — ₹{c.totalChitValue?.toLocaleString()} ({c.durationMonths}m)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Chit Value (₹)</label>
              <input
                type="number"
                value={chitValue}
                onChange={(e) => setChitValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Duration (Months)</label>
                <input
                  type="number"
                  value={chitDuration}
                  onChange={(e) => setChitDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Monthly Pay (₹)</label>
                <input
                  type="number"
                  value={chitMonthly}
                  onChange={(e) => setChitMonthly(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Auction Discount (₹)</label>
                <input
                  type="number"
                  value={chitDiscount}
                  onChange={(e) => setChitDiscount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Auction Month</label>
                <input
                  type="number"
                  value={chitMonth}
                  onChange={(e) => setChitMonth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
            <button
              onClick={runChitSimulation}
              className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {loading ? 'CALCULATING...' : 'EVALUATE CHIT'}
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">CHIT FINANCIAL EVALUATION</h3>

            {chitResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">TOTAL CONTRIBUTED</span>
                    <p className="text-lg font-bold text-slate-900">₹{chitResult.totalContributions.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800 block mb-1">PRIZE RECEIVED</span>
                    <p className="text-lg font-bold text-emerald-900">₹{chitResult.amountReceived.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-xs font-bold text-rose-800 block mb-1">FOREMAN COMM.</span>
                    <p className="text-lg font-bold text-rose-900">₹{chitResult.foremanCommission.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800 block mb-1">EFFECTIVE COST</span>
                    <p className="text-lg font-extrabold text-blue-900">{chitResult.effectiveAnnualCost}% p.a.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">CFO VERDICT</span>
                  <p className="text-sm font-semibold">{chitResult.cfoRecommendation}</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Percent className="w-10 h-10 stroke-1 text-pink-500" />
                <p className="text-xs font-semibold">Click "Evaluate Chit" to compute effective cost & cashflow schedule.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. CHIT COMPARISON TOOL ── */}
      {activeTab === 'chit-compare' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">CHIT COMPARISON MATRIX</h3>
              <p className="text-xs text-slate-500">Compare multiple chits side-by-side to find which is financially optimal.</p>
            </div>
            <button
              onClick={runChitComparison}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              RUN COMPARISON
            </button>
          </div>

          {compareResult ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">CHIT NAME</th>
                      <th className="p-4">MONTHLY</th>
                      <th className="p-4">TOTAL COST</th>
                      <th className="p-4">EXPECTED RECEIVE</th>
                      <th className="p-4">EFFECTIVE COST %</th>
                      <th className="p-4">BEST FOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold">
                    {compareResult.comparedChits.map((item, idx) => (
                      <tr key={idx} className={item.isRecommended ? 'bg-blue-50/50 font-bold' : ''}>
                        <td className="p-4 text-slate-900 flex items-center gap-2">
                          {item.chitName}
                          {item.isRecommended && <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px]">BEST</span>}
                        </td>
                        <td className="p-4">₹{item.monthlyContribution.toLocaleString()}</td>
                        <td className="p-4">₹{item.result.totalContributions.toLocaleString()}</td>
                        <td className="p-4 text-emerald-600">₹{item.result.amountReceived.toLocaleString()}</td>
                        <td className="p-4 text-blue-600">{item.result.effectiveAnnualCost}%</td>
                        <td className="p-4 text-slate-600">{item.bestFor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed font-semibold">
                <strong className="block text-sm font-bold mb-1">CFO ANALYSIS</strong>
                {compareResult.cfoAnalysis}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Scale className="w-10 h-10 stroke-1 text-blue-500" />
              <p className="text-xs font-semibold">Click "Run Comparison" to generate the multi-chit decision matrix.</p>
            </div>
          )}
        </div>
      )}

      {/* ── 4. CHIT + LOAN STRATEGY ── */}
      {activeTab === 'chit-loan' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">CHIT + LOAN STRATEGY SIMULATOR</h3>
              <p className="text-xs text-slate-500">Should I take a chit prize early and use proceeds to close my personal loan?</p>
            </div>
            <button
              onClick={runChitLoanStrategy}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              SIMULATE STRATEGY
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            {userLoans.length > 0 && (
              <div>
                <label className="text-xs font-bold text-indigo-900 block mb-1">Target Loan to Prepay</label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => handleSelectLoan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 font-bold text-xs focus:outline-none"
                >
                  {userLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loanName} — ₹{(l.principalOutstanding || l.loanAmount)?.toLocaleString()} @ {l.interestRate}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            {userChits.length > 0 && (
              <div>
                <label className="text-xs font-bold text-indigo-900 block mb-1">Source Chit Payout</label>
                <select
                  value={selectedChitId}
                  onChange={(e) => handleSelectChit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 font-bold text-xs focus:outline-none"
                >
                  {userChits.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.chitName} — ₹{c.totalChitValue?.toLocaleString()} ({c.durationMonths}m)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {clStrategyResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">SCENARIO A — CONTINUE LOAN ONLY</span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Remaining Interest:</span><span className="font-bold text-slate-900">₹{clStrategyResult.scenarioA.remainingInterest.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Monthly EMI Outflow:</span><span className="font-bold text-slate-900">₹{clStrategyResult.scenarioA.monthlyEMI.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Total Outflow:</span><span className="font-bold text-slate-900">₹{clStrategyResult.scenarioA.totalOutflow.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">SCENARIO B — TAKE CHIT & PREPAY LOAN</span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-emerald-800"><span>Chit Prize Received:</span><span className="font-bold text-emerald-900">₹{clStrategyResult.scenarioB.prizePayout.toLocaleString()}</span></div>
                  <div className="flex justify-between text-emerald-800"><span>Loan Interest Saved:</span><span className="font-bold text-emerald-900">₹{clStrategyResult.scenarioB.loanInterestSaved.toLocaleString()}</span></div>
                  <div className="flex justify-between text-emerald-800"><span>Net Financial Benefit:</span><span className="font-bold text-emerald-900">₹{clStrategyResult.scenarioB.netFinancialBenefit.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="md:col-span-2 p-5 rounded-2xl bg-indigo-900 text-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">STRATEGY RECOMMENDATION</span>
                <p className="text-sm font-semibold">{clStrategyResult.recommendation}</p>
                <p className="text-xs text-indigo-200 pt-2 border-t border-indigo-800">{clStrategyResult.riskAssessment}</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Sparkles className="w-10 h-10 stroke-1 text-indigo-500" />
              <p className="text-xs font-semibold">Click "Simulate Strategy" to evaluate taking chit proceeds to prepay high-rate debt.</p>
            </div>
          )}
        </div>
      )}

      {/* ── 5. INVESTMENT SIMULATOR ── */}
      {activeTab === 'investment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              SIP Investment Inputs
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Monthly Investment (₹)</label>
              <input
                type="number"
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Expected Return (% p.a.)</label>
                <input
                  type="number"
                  value={sipReturn}
                  onChange={(e) => setSipReturn(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Duration (Years)</label>
                <input
                  type="number"
                  value={sipYears}
                  onChange={(e) => setSipYears(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
            <button
              onClick={runInvestmentSim}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              SIMULATE GROWTH
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">COMPOUND WEALTH PROJECTION</h3>
            {sipResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">CONSERVATIVE ({sipReturn - 2}%)</span>
                    <p className="text-xl font-bold text-slate-900">₹{sipResult.conservative?.futureValue?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800 block mb-1">BASE SCENARIO ({sipReturn}%)</span>
                    <p className="text-2xl font-extrabold text-blue-900">₹{sipResult.base?.futureValue?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800 block mb-1">OPTIMISTIC ({sipReturn + 2}%)</span>
                    <p className="text-xl font-bold text-emerald-900">₹{sipResult.optimistic?.futureValue?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-semibold">
                  Total Invested: ₹{sipResult.base?.totalInvested?.toLocaleString()} | Estimated Wealth Gain: ₹{sipResult.base?.estimatedGains?.toLocaleString()} (Multiplier: {sipResult.base?.wealthMultiplier}x)
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <TrendingUp className="w-10 h-10 stroke-1 text-indigo-500" />
                <p className="text-xs font-semibold">Click "Simulate Growth" to view compound investment projections.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. LAND SIMULATOR ── */}
      {activeTab === 'land' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Land Investment Inputs
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                value={landPrice}
                onChange={(e) => setLandPrice(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Registration / Costs (₹)</label>
                <input
                  type="number"
                  value={landRegCosts}
                  onChange={(e) => setLandRegCosts(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Appreciation (% p.a.)</label>
                <input
                  type="number"
                  value={landGrowth}
                  onChange={(e) => setLandGrowth(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
            <button
              onClick={runLandSim}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              SIMULATE LAND ASSET
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">LAND ASSET OUTCOME</h3>
            {landResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">TOTAL CAPITAL</span>
                    <p className="text-lg font-bold text-slate-900">₹{landResult.totalCapitalInvested.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold text-emerald-800 block mb-1">PROJECTED VALUE</span>
                    <p className="text-lg font-bold text-emerald-900">₹{landResult.projectedFutureValue.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-xs font-bold text-blue-800 block mb-1">ANNUALIZED CAGR</span>
                    <p className="text-lg font-bold text-blue-900">{landResult.cagr}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-xs font-bold text-amber-800 block mb-1">TOTAL PROFIT</span>
                    <p className="text-lg font-bold text-amber-900">₹{landResult.totalProfit.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">BUY LAND VS INVEST IN EQUITY</span>
                  <p className="text-sm font-semibold">{landResult.compareVsEquity.verdict}</p>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Building2 className="w-10 h-10 stroke-1 text-emerald-500" />
                <p className="text-xs font-semibold">Click "Simulate Land Asset" to calculate appreciation & compare vs market index.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 7. AFFORDABILITY SIMULATOR ── */}
      {activeTab === 'affordability' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Decision Input
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Item / Commitment Name</label>
              <input
                type="text"
                value={affItem}
                onChange={(e) => setAffItem(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Total Cost (₹)</label>
                <input
                  type="number"
                  value={affCost}
                  onChange={(e) => setAffCost(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Down Payment (₹)</label>
                <input
                  type="number"
                  value={affDown}
                  onChange={(e) => setAffDown(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">New Monthly EMI / Commitment (₹)</label>
              <input
                type="number"
                value={affEMI}
                onChange={(e) => setAffEMI(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <button
              onClick={runAffordabilitySim}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              CAN I AFFORD THIS?
            </button>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">AFFORDABILITY VERDICT</h3>
            {affResult ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-200">
                  <div className={`p-4 rounded-2xl font-black text-xl uppercase ${
                    affResult.affordabilityStatus === 'YES'
                      ? 'bg-emerald-600 text-white'
                      : affResult.affordabilityStatus === 'BORDERLINE'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {affResult.affordabilityStatus}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{affItem}</h4>
                    <p className="text-xs text-slate-600">{affResult.rationale}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">REMAINING SURPLUS</span>
                    <p className="text-base font-bold text-slate-900">₹{affResult.postPurchaseSurplus.toLocaleString()}/mo</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">DEBT-TO-INCOME (DTI)</span>
                    <p className="text-base font-bold text-slate-900">{affResult.debtToIncomeRatio}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100">
                    <span className="text-slate-500 font-semibold block mb-1">RISK LEVEL</span>
                    <p className="text-base font-bold text-slate-900">{affResult.riskLevel}</p>
                  </div>
                </div>

                {affResult.keyWarnings?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <strong className="block font-bold">WARNINGS:</strong>
                    {affResult.keyWarnings.map((w, idx) => (
                      <p key={idx}>• {w}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <ShieldAlert className="w-10 h-10 stroke-1 text-rose-500" />
                <p className="text-xs font-semibold">Click "Can I Afford This?" to evaluate income, cash reserve & debt safety.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 8. MULTI-OPTION DECISION ENGINE ── */}
      {activeTab === 'multi-option' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">MULTI-OPTION DECISION ENGINE</h3>
              <p className="text-xs text-slate-500">What should I do with ₹{multiCash.toLocaleString()} available cash?</p>
            </div>
            <button
              onClick={runMultiOptionCompare}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              RUN MULTI-OPTION ENGINE
            </button>
          </div>

          {multiResult ? (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">EXECUTIVE BRIEF</span>
                <p className="text-base font-bold">{multiResult.executiveBrief}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {multiResult.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      opt.isRecommended
                        ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{opt.optionName}</h4>
                      {opt.isRecommended && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{opt.cfoJustification}</p>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div><span className="text-slate-400 block">5Y Benefit</span><strong className="text-slate-900">₹{opt.estimatedBenefit.toLocaleString()}</strong></div>
                      <div><span className="text-slate-400 block">Risk</span><strong className="text-slate-900">{opt.riskLevel}</strong></div>
                      <div><span className="text-slate-400 block">Liquidity</span><strong className="text-slate-900">{opt.liquidityImpact}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Award className="w-10 h-10 stroke-1 text-blue-600" />
              <p className="text-xs font-semibold">Click "Run Multi-Option Engine" to generate & rank optimal financial paths.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
