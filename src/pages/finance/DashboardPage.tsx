import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import { dashboardService } from '../../services/dashboardService';
import {
  PiggyBank,
  Activity,
  Building2,
  X,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  PlusCircle,
  Clock,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BankCard } from '../../components/BankCard';
import { CreditCard3D } from '../../components/CreditCard3D';
import { InvestmentCard } from '../../components/InvestmentCard';
import { MetricCard } from '../../components/MetricCard';
import { QuickActionModal } from '../../components/QuickActionModal';
import { CashFlowEnginePanel } from '../../components/CashFlowEnginePanel';
import { v2Service, DecisionEngineResponse } from '../../services/v2Service';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [chits, setChits] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const isLoadingRef = useRef(false);

  const fetchDashboardData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      await porulalarStore.bootstrap();
      const data = await dashboardService.getStats();
      setStats(data);

      setLoans(porulalarStore.getCache('loans'));
      setChits(porulalarStore.getCache('chits'));
      setBudgets(porulalarStore.getCache('budgets'));
      setBanks(porulalarStore.getCache('banks'));
      setCards(porulalarStore.getCache('cards'));
      setExpenses(porulalarStore.getCache('expenses'));
      setInvestments(porulalarStore.getCache('investments'));
      setAssets(porulalarStore.getCache('assets'));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubExpenses = porulalarStore.subscribe('expenses', (data) => setExpenses(data));
    const unsubBanks = porulalarStore.subscribe('banks', (data) => setBanks(data));
    const unsubCards = porulalarStore.subscribe('cards', (data) => setCards(data));
    return () => {
      unsubExpenses();
      unsubBanks();
      unsubCards();
    };
  }, []);

  const netWorth = stats?.netWorth || 0;
  const netWorthChangePct = stats?.netWorthChangePct ?? 0;
  const totalBankBalance = banks.reduce((sum, b) => sum + (b.balance || b.currentBalance || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (i.currentValue || i.amount || 0), 0);
  const totalDebt = loans.reduce((sum, l) => sum + (l.principalOutstanding ?? l.borrowedAmount ?? 0), 0) +
                    cards.reduce((sum, c) => sum + (c.currentOutstanding || c.balance || 0), 0);
  
  const monthlyExpenses = stats?.expenses?.thisMonth || 0;
  const healthScore = stats?.healthScore || 85;
  const userName = user?.email?.split('@')[0] || 'User';

  const handleSelectQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'PAY_CC_BILL': navigate('/cards'); break;
      case 'PAY_EMI': navigate('/emis'); break;
      case 'RECORD_INCOME': navigate('/income'); break;
      case 'ADD_INVESTMENT': navigate('/investments'); break;
      case 'TRANSFER_MONEY': navigate('/banks'); break;
      case 'ADD_ASSET': navigate('/assets'); break;
      case 'ADD_CREDIT_CARD': navigate('/cards'); break;
      default: navigate('/cards');
    }
  };

  return (
    <div className="space-y-6 pb-24 select-none px-1">
      {/* ── NATIVE MOBILE APP EXPERIENCE (Visible only on mobile devices) ── */}
      <div className="block md:hidden space-y-4">
        {/* Native Compact Greeting & App Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userName[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm leading-tight">Welcome, {userName} 👋</h2>
              <span className="text-[10px] text-slate-500 font-medium">Porulalar Wealth App</span>
            </div>
          </div>

          <button
            onClick={() => setIsQuickActionOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs flex items-center gap-1"
          >
            <PlusCircle size={14} />
            <span>Action</span>
          </button>
        </div>

        {/* Native Mobile Hero Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Net Worth</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
              Score: {healthScore}/100 Excellent
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              ₹{netWorth.toLocaleString('en-IN')}<span className="text-lg text-slate-400 font-semibold">.00</span>
            </h1>
            {netWorthChangePct !== 0 && (
              <span className="text-xs font-semibold text-emerald-400 block mt-1">
                {netWorthChangePct >= 0 ? '+' : ''}{netWorthChangePct.toFixed(1)}% this month
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>Available Cash: <strong className="text-white">₹{totalBankBalance.toLocaleString('en-IN')}</strong></span>
            <span>Total Debt: <strong className="text-rose-300">₹{totalDebt.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Horizontal Swipeable Bank Accounts Carousel for Native Mobile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Bank Accounts</span>
            <button onClick={() => navigate('/banks')} className="text-[11px] font-semibold text-blue-600 font-sans">View All →</button>
          </div>

          <div className="flex overflow-x-auto gap-3.5 snap-x snap-mandatory scrollbar-none pb-2 pt-1 px-1">
            {banks.map((b) => (
              <div key={b.id || b.name} className="min-w-[280px] snap-center">
                <BankCard bank={b} onTransfer={() => navigate('/banks')} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DESKTOP DASHBOARD EXPERIENCE (Visible on tablet & desktop) ── */}
      <div className="hidden md:block space-y-6">
        {/* Top Hero Summary Card */}
        <div className="saas-card-lg p-6 lg:p-7 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-100/30 via-emerald-50/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Welcome back, <strong className="text-slate-900 capitalize font-bold">{userName}</strong> 👋
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Current Net Worth</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-sans mt-0.5">
                  ₹{netWorth.toLocaleString('en-IN')}<span className="text-xl text-slate-400 font-semibold">.00</span>
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                {netWorthChangePct !== 0 && (
                  <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg border ${netWorthChangePct >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' : 'text-rose-700 bg-rose-50 border-rose-200/60'}`}>
                    <TrendingUp size={14} /> {netWorthChangePct >= 0 ? '+' : ''}{netWorthChangePct.toFixed(1)}% this month
                  </span>
                )}
                <span className="text-slate-600 font-medium">
                  Liquid Cash: <strong className="text-slate-900 font-bold">₹{totalBankBalance.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            {/* Health Score Gauge & Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-4 lg:pt-0 lg:pl-6">
              <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-600"
                      strokeDasharray={`${healthScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-extrabold text-xs text-slate-900">{healthScore}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Financial Health</span>
                  <span className="text-xs font-extrabold text-emerald-700 block">Excellent</span>
                  <span className="text-[10px] text-slate-500">Top 5% financial stability</span>
                </div>
              </div>

              <button
                onClick={() => setIsQuickActionOpen(true)}
                className="px-4 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-saas flex items-center justify-center gap-2 shrink-0"
              >
                <PlusCircle size={16} />
                <span>Quick Action</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CASH FLOW OPERATING SYSTEM ENGINE ── */}
      <CashFlowEnginePanel />

      {/* ── METRICS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Liquid Cash"
          value={totalBankBalance}
          subtitle={`${banks.length} Bank Accounts`}
          icon={<Building2 size={18} />}
          onClick={() => navigate('/banks')}
        />
        <MetricCard
          title="Investments"
          value={totalInvestments}
          subtitle={`${investments.length} Active Investments`}
          icon={<Landmark size={18} />}
          onClick={() => navigate('/investments')}
        />
        <MetricCard
          title="Total Liabilities"
          value={totalDebt}
          subtitle={`${loans.length + cards.length} Active Liabilities`}
          icon={<ShieldAlert size={18} />}
          onClick={() => navigate('/loans')}
        />
        <MetricCard
          title="Monthly Outflow"
          value={monthlyExpenses}
          subtitle="Automated payment ledger"
          icon={<Activity size={18} />}
          onClick={() => navigate('/expenses')}
        />
      </div>

      {/* ── LINKED BANKS SECTION ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-600" />
            <span>Bank Accounts & Liquidity</span>
          </h2>
          <button onClick={() => navigate('/banks')} className="text-xs font-semibold text-blue-600 hover:underline">
            Manage ({banks.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.length === 0 ? (
            <div className="col-span-full saas-card p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-600">No bank accounts linked yet.</p>
              <button onClick={() => navigate('/banks')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-saas">
                Link Bank Account
              </button>
            </div>
          ) : (
            banks.slice(0, 3).map((b) => (
              <BankCard key={b.id || b.name} bank={b} onTransfer={() => navigate('/banks')} />
            ))
          )}
        </div>
      </div>

      {/* ── CREDIT CARDS SECTION ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-600" />
            <span>Credit Cards & Utilization</span>
          </h2>
          <button onClick={() => navigate('/cards')} className="text-xs font-semibold text-blue-600 hover:underline">
            View All ({cards.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.length === 0 ? (
            <div className="col-span-full saas-card p-6 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-600">No credit cards added.</p>
              <button onClick={() => navigate('/cards')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-saas">
                Add Credit Card
              </button>
            </div>
          ) : (
            cards.slice(0, 3).map((c) => (
              <CreditCard3D key={c.id || c.name} card={c} onPayBill={() => navigate('/cards')} />
            ))
          )}
        </div>
      </div>

      {/* ── AI INSIGHTS RECOMMENDATION CARDS ── */}
      <div className="saas-card p-5 sm:p-6 bg-slate-900 text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wide">Porulalar AI Advisor Insights</h3>
          </div>
          <button onClick={() => navigate('/ai')} className="text-xs font-semibold text-amber-300 hover:underline">
            Open AI Chat →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Credit Optimization</span>
            <p className="text-xs font-medium leading-relaxed">Credit utilization on Axis Magnus reached 42%. Pay outstanding before due date to keep your score in top tier.</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Wealth Acceleration</span>
            <p className="text-xs font-medium leading-relaxed">Increase Nifty 50 Index SIP to hit your ₹50L Retirement Goal 1.8 years earlier.</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">Interest Savings</span>
            <p className="text-xs font-medium leading-relaxed">Prepaying towards Personal Loan will save substantial interest over tenure.</p>
          </div>
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
