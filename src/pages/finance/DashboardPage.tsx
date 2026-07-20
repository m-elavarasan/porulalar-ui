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
  ArrowDownLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreditHealthCard } from '../../components/CreditHealthCard';
import { CardStack } from '../../components/CardStack';

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

  const [breakdownModal, setBreakdownModal] = useState<{
    title: string;
    items: { label: string; amount?: number; value?: string | number }[];
    total?: number;
  } | null>(null);

  const isLoadingRef = useRef(false);

  const fetchDashboardData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const data = await dashboardService.getStats();
      setStats(data);

      const [
        loansList,
        chitsList,
        budgetsList,
        banksList,
        cardsList,
        expensesList
      ] = await Promise.all([
        porulalarStore.fetchCollection('loans'),
        porulalarStore.fetchCollection('chits'),
        porulalarStore.fetchCollection('budgets'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards'),
        porulalarStore.fetchCollection('expenses')
      ]);

      setLoans(loansList);
      setChits(chitsList);
      setBudgets(budgetsList);
      setBanks(banksList);
      setCards(cardsList);
      setExpenses(expensesList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedFetchData = useMemo(() => debounce(fetchDashboardData, 100), []);

  useEffect(() => {
    fetchDashboardData();
    const unsubExpenses = porulalarStore.subscribe('expenses', debouncedFetchData);
    const unsubBanks = porulalarStore.subscribe('banks', debouncedFetchData);
    const unsubCards = porulalarStore.subscribe('cards', debouncedFetchData);
    return () => {
      unsubExpenses();
      unsubBanks();
      unsubCards();
    };
  }, []);

  const netWorth = stats?.netWorth || 0;
  const totalBankBalance = banks.reduce((sum, b) => sum + (b.currentBalance || 0), 0);
  const totalDebt = loans.reduce((sum, l) => sum + (l.principalOutstanding ?? l.borrowedAmount ?? 0), 0) +
                    cards.reduce((sum, c) => sum + (c.currentOutstanding || 0), 0);
  const monthlyExpenses = stats?.expenses?.thisMonth || 0;
  const savingsRate = stats?.savings?.savingsRate || 0;
  const projectedExpense = budgets.reduce((sum, b) => sum + (b.limit || 0), 0);
  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* TOP HERO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: Portfolio Balance Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-100 rounded-3xl p-6 border border-indigo-100/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Active Session</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Welcome, <span className="capitalize">{userName}</span> 👋
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Porulalar Wealth Supervisor</p>
              </div>
              <button
                onClick={() => navigate('/cards')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-50 cursor-pointer transition-all"
              >
                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                Cards
              </button>
            </div>

            <div className="my-5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Current Net Worth</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight font-mono mt-1">
                ₹{netWorth.toLocaleString('en-IN')}<span className="text-2xl font-bold text-slate-400">.00</span>
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-2">
                Liquid: <strong className="text-emerald-700 font-mono">₹{totalBankBalance.toLocaleString('en-IN')}</strong> • Debt: <strong className="text-rose-600 font-mono">₹{totalDebt.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Pill Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => navigate('/expenses')}
              className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 transition-all shadow-2xs cursor-pointer text-left"
            >
              <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Spend</div>
                <div className="text-[10px] text-slate-500 font-medium">Log Expense</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/income')}
              className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 transition-all shadow-2xs cursor-pointer text-left"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="h-4 w-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Deposit</div>
                <div className="text-[10px] text-slate-500 font-medium">Add Income</div>
              </div>
            </button>
          </div>
        </div>

        {/* CARD 2: Credit Health Card */}
        <CreditHealthCard
          score={785}
          maxScore={900}
          status="Excellent"
          netWorth={netWorth}
          savingsRate={savingsRate}
        />

        {/* CARD 3: Metallic Cards Carousel */}
        <CardStack
          cards={cards.map((c, i) => ({
            id: c.id || `card-${i}`,
            cardName: c.cardName || 'Credit Card',
            bankName: c.bankName || 'Bank',
            cardNumber: c.cardNumber || '•••• •••• •••• 8890',
            cardHolder: c.cardHolder || user?.email?.split('@')[0] || 'VIP Member',
            expiry: c.expiry || '08/28',
            balance: c.currentOutstanding || c.balance || 0,
            limit: c.creditLimit || 250000,
            type: (i % 2 === 0 ? 'platinum' : 'infinite') as any
          }))}
          onAddCard={() => navigate('/cards')}
        />
      </div>

      {/* CORE DASHBOARD GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRID 1: Budget Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-indigo-600" />
                Budget Overview
              </h3>
              <button
                onClick={() => navigate('/expenses')}
                className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
              >
                Manage Caps
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <p className="text-xs font-semibold">No active monthly budgets defined.</p>
                <button
                  onClick={() => navigate('/expenses')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Create Monthly Budget
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.slice(0, 4).map((b) => {
                  const spent = expenses
                    .filter((e) => e.category === b.category)
                    .reduce((sum, e) => sum + (e.amount || 0), 0);
                  const pct = Math.min(100, Math.round((spent / (b.limit || 1)) * 100));

                  return (
                    <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                        <span>{b.category}</span>
                        <span className="font-mono text-slate-600">₹{spent.toLocaleString()} / ₹{b.limit.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Projected Monthly Spend</span>
            <span className="font-mono font-black text-sm text-slate-900">₹{projectedExpense.toLocaleString()}</span>
          </div>
        </div>

        {/* GRID 2: Recent Transactions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Recent Transactions
              </h3>
              <button
                onClick={() => navigate('/expenses')}
                className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No recent transactions recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.slice(0, 4).map((e) => (
                  <div key={e.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{e.description || e.category}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{e.category} • {e.date}</span>
                    </div>
                    <span className="font-mono font-black text-rose-600 text-sm">-₹{e.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>This Month Spent:</span>
            <strong className="text-slate-900 font-mono text-sm font-black">₹{monthlyExpenses.toLocaleString()}</strong>
          </div>
        </div>

        {/* GRID 3: Linked Bank Accounts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Linked Bank Accounts
              </h3>
              <button
                onClick={() => navigate('/banks')}
                className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {banks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <p className="text-xs font-semibold">No bank accounts linked yet.</p>
                <button
                  onClick={() => navigate('/banks')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Link Bank Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {banks.slice(0, 4).map((b) => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-900">
                    <div>
                      <span className="font-bold block">{b.bankName}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{b.accountType}</span>
                    </div>
                    <span className="font-mono font-black text-sm text-slate-900">₹{b.currentBalance?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Total Liquid Capital:</span>
            <span className="font-mono font-black text-sm text-slate-900">₹{totalBankBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Breakdown Modal */}
      {breakdownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">{breakdownModal.title}</h3>
              <button onClick={() => setBreakdownModal(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {breakdownModal.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">{item.label}</span>
                  {item.amount !== undefined ? (
                    <span className={`font-mono font-bold ${item.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      ₹{item.amount.toLocaleString()}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">{item.value}</span>
                  )}
                </div>
              ))}
            </div>

            {breakdownModal.total !== undefined && (
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold text-sm">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-slate-900 font-black">₹{breakdownModal.total.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
