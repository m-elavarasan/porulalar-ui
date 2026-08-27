import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../App';
import { v2Service } from '../../services/v2Service';
import {
  WealthOverviewData,
  Recommendation,
  FinancialSnapshot,
  FinancialHealthReport,
  GoalProjectionSummary
} from '../../types';
import {
  PiggyBank,
  Activity,
  Building2,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  PlusCircle,
  Clock,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Scale,
  Zap,
  Target,
  RefreshCw,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WealthRecommendationsCard } from '../../components/WealthRecommendationsCard';
import { GoalProjectionCard } from '../../components/GoalProjectionCard';
import { DecisionEngineCard } from '../../components/DecisionEngineCard';
import { MetricCard } from '../../components/MetricCard';
import { QuickActionModal } from '../../components/QuickActionModal';
import AdminPage from '../admin/AdminPage';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleLower = (user?.role || '').toLowerCase();
  const isSuperAdmin = roleLower.includes('admin') || roleLower === 'superadmin' || user?.email === 'admin@porulalar.com';

  if (isSuperAdmin) {
    return <AdminPage />;
  }

  const [wealthData, setWealthData] = useState<WealthOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickAiInput, setQuickAiInput] = useState('');
  const [prefillSim, setPrefillSim] = useState<any>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await v2Service.getWealthOverview();
      setWealthData(data);
    } catch (err) {
      console.error('Failed to load wealth overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const snapshot: FinancialSnapshot = wealthData?.snapshot || {
    netWorth: 0,
    liquidCash: 0,
    investmentsValue: 0,
    assetsValue: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    activeLoansTotal: 0,
    activeCardsOutstanding: 0,
    activeEmisOutstanding: 0,
    monthlyIncome: 0,
    monthlyFixedObligations: 0,
    monthlyFreeCashFlow: 0,
    emergencyBufferRequired: 0,
    emergencyBufferActual: 0,
    investableCapital: 0,
    cashRunwayMonths: 0,
    debtToIncomeRatio: 0,
    savingsRatePercentage: 0,
    netWorthGrowthPct: 0
  };

  const health: FinancialHealthReport = wealthData?.health || {
    overallScore: 80,
    overallRating: 'Good',
    headline: 'Stable Financial Base',
    summaryDiagnosis: 'Your financial foundation is healthy with active opportunities for wealth acceleration.',
    dimensions: [],
    keyRiskCount: 0,
    keyOppCount: 0
  };

  const goalsSummary: GoalProjectionSummary = wealthData?.goals || {
    goals: [],
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    totalMonthlySip: 0,
    onTrackCount: 0,
    atRiskCount: 0,
    offTrackCount: 0,
    achievedCount: 0
  };

  const recommendations: Recommendation[] = wealthData?.recommendations || [];
  const userName = user?.email?.split('@')[0] || 'User';

  const handleSimulate = (rec: Recommendation) => {
    if (rec.type === 'DEBT_OPTIMIZATION') {
      setPrefillSim({
        surplusAmount: rec.impactAmount || 100000,
        loanInterestRate: 11.5,
        loanPrincipalLeft: snapshot.activeLoansTotal
      });
    }
    // Scroll smoothly to decision simulator
    const el = document.getElementById('decision-simulator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiInput.trim()) return;
    navigate(`/ai?q=${encodeURIComponent(quickAiInput)}`);
  };

  const handleSelectQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'RECORD_INCOME': navigate('/income'); break;
      case 'ADD_INVESTMENT': navigate('/investments'); break;
      case 'PAY_CC_BILL': navigate('/cards'); break;
      case 'PAY_EMI': navigate('/emis'); break;
      case 'TRANSFER_MONEY': navigate('/banks'); break;
      case 'ADD_ASSET': navigate('/assets'); break;
      default: navigate('/investments');
    }
  };

  return (
    <div className="space-y-6 pb-24 select-none px-1">
      {/* ── 1. WEALTH POSITION HERO HEADER ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden space-y-6 border border-slate-800">
        <div className="absolute -top-16 -right-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">
                Decision Engine Dashboard for <strong className="text-white capitalize font-bold">{userName}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                Wealth Engine Live
              </span>
            </div>

            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Net Worth</span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1">
                ₹{snapshot.netWorth.toLocaleString('en-IN')}<span className="text-xl text-slate-400 font-semibold">.00</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              {snapshot.netWorthGrowthPct !== 0 && (
                <span className={`inline-flex items-center gap-1 font-extrabold px-3 py-1 rounded-xl border ${
                  snapshot.netWorthGrowthPct >= 0 ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' : 'text-rose-300 bg-rose-500/15 border-rose-400/30'
                }`}>
                  <TrendingUp size={14} /> {snapshot.netWorthGrowthPct >= 0 ? '+' : ''}{snapshot.netWorthGrowthPct.toFixed(1)}% Velocity
                </span>
              )}
              <span className="text-slate-300">
                Investable Surplus: <strong className="text-emerald-400 font-extrabold">₹{snapshot.investableCapital.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-slate-300">
                Total Debt Drag: <strong className="text-rose-300 font-extrabold">₹{snapshot.totalLiabilities.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-slate-300">
                Runway: <strong className="text-sky-300 font-extrabold">{snapshot.cashRunwayMonths} Months</strong>
              </span>
            </div>
          </div>

          {/* Health Score Gauge & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-5 lg:pt-0 lg:pl-8">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 backdrop-blur-md">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={health.overallScore >= 75 ? 'text-emerald-400' : health.overallScore >= 50 ? 'text-amber-400' : 'text-rose-400'}
                    strokeDasharray={`${health.overallScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-black text-sm text-white">{health.overallScore}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Financial Health</span>
                <span className="text-xs font-black text-emerald-300 block">{health.overallRating} Grade</span>
                <span className="text-[10px] text-slate-400 font-medium">{health.headline}</span>
              </div>
            </div>

            <button
              onClick={() => setIsQuickActionOpen(true)}
              className="px-5 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <PlusCircle size={18} />
              <span>Quick Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. ASK PORULALAR COPILOT QUERY ENTRY BAR ── */}
      <div className="saas-card p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
          <Sparkles size={16} />
        </div>
        <form onSubmit={handleQuickAiSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={quickAiInput}
            onChange={(e) => setQuickAiInput(e.target.value)}
            placeholder="Ask Porulalar (e.g. 'Should I invest ₹50k or prepay my loan?', 'Why is my wealth growth slow?')..."
            className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-transparent focus:outline-hidden placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <span>Ask</span>
            <ArrowUpRight size={14} />
          </button>
        </form>
      </div>

      {/* ── 3. STRUCTURED WEALTH OPPORTUNITIES & RISKS ── */}
      <WealthRecommendationsCard
        recommendations={recommendations}
        onSimulate={handleSimulate}
        onRefresh={fetchOverview}
      />

      {/* ── 4. MULTI-DIMENSIONAL HEALTH DIAGNOSIS ── */}
      <div className="saas-card p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Financial Health Diagnosis</h2>
              <span className="text-[11px] text-slate-500 font-medium">{health.summaryDiagnosis}</span>
            </div>
          </div>
          <button onClick={fetchOverview} className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {health.dimensions.map((dim) => (
            <div key={dim.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">{dim.name}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  {dim.rating}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-snug pt-1">
                {dim.diagnosis}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. GOAL TRAJECTORY MATRIX ── */}
      <GoalProjectionCard summary={goalsSummary} />

      {/* ── 6. INTERACTIVE DECISION SIMULATOR ── */}
      <div id="decision-simulator-section">
        <DecisionEngineCard
          snapshot={snapshot}
          prefillDebtVsInvest={prefillSim}
        />
      </div>

      {/* ── 7. SUPPORTING DATA SOURCES SUMMARY ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Supporting Data Portfolios</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Liquid Cash"
            value={snapshot.liquidCash}
            subtitle="Checking & savings balance"
            icon={<Building2 size={18} />}
            onClick={() => navigate('/banks')}
          />
          <MetricCard
            title="Investments"
            value={snapshot.investmentsValue}
            subtitle="Mutual Funds, Stocks, SIPs"
            icon={<Landmark size={18} />}
            onClick={() => navigate('/investments')}
          />
          <MetricCard
            title="Total Debt"
            value={snapshot.totalLiabilities}
            subtitle="Loans, EMIs, & Credit Cards"
            icon={<ShieldAlert size={18} />}
            onClick={() => navigate('/loans')}
          />
          <MetricCard
            title="Monthly Obligations"
            value={snapshot.monthlyFixedObligations}
            subtitle="Committed monthly burn"
            icon={<Activity size={18} />}
            onClick={() => navigate('/expenses')}
          />
        </div>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />
    </div>
  );
}
