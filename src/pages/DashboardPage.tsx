import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import {
  Grid,
  Layers,
  TrendingUp,
  DollarSign,
  CreditCard,
  Handshake,
  Wallet,
  Calendar,
  Clock,
  PiggyBank,
  Plus,
  ChevronRight,
  Activity,
  Sparkles,
  User,
  Bot,
  AlertTriangle,
  AlertCircle,
  X,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Dashboard Stats States
  const [stats, setStats] = useState<any>(null);
  const [netWorthSnapshots, setNetWorthSnapshots] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [emis, setEmis] = useState<any[]>([]);
  const [chits, setChits] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);

  // Breakdown Modal state
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/dashboard/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }

      // Fetch small collections for local calculations and details
      const [
        loansList,
        emisList,
        chitsList,
        budgetsList,
        borrowsList,
        banksList,
        cardsList,
        investmentsList,
        assetsList,
        snapshots,
        expensesList,
        incomeList
      ] = await Promise.all([
        porulalarStore.fetchCollection('loans'),
        porulalarStore.fetchCollection('emis'),
        porulalarStore.fetchCollection('chits'),
        porulalarStore.fetchCollection('budgets'),
        porulalarStore.fetchCollection('borrows'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards'),
        porulalarStore.fetchCollection('investments'),
        porulalarStore.fetchCollection('assets'),
        porulalarStore.fetchCollection('netWorthSnapshots'),
        porulalarStore.fetchCollection('expenses'),
        porulalarStore.fetchCollection('income')
      ]);

      setLoans(loansList);
      setEmis(emisList);
      setChits(chitsList);
      setBudgets(budgetsList);
      setBorrows(borrowsList);
      setBanks(banksList);
      setCards(cardsList);
      setInvestments(investmentsList);
      setAssets(assetsList);
      setNetWorthSnapshots(snapshots);
      setExpenses(expensesList);
      setIncome(incomeList);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedFetchDashboardData = useMemo(() => {
    return debounce(fetchDashboardData, 100);
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to changes so that if user updates something, dashboard auto-refreshes
    const unsubLoans = porulalarStore.subscribe('loans', debouncedFetchDashboardData);
    const unsubEmis = porulalarStore.subscribe('emis', debouncedFetchDashboardData);
    const unsubChits = porulalarStore.subscribe('chits', debouncedFetchDashboardData);
    const unsubExpenses = porulalarStore.subscribe('expenses', debouncedFetchDashboardData);
    const unsubIncome = porulalarStore.subscribe('income', debouncedFetchDashboardData);
    const unsubBanks = porulalarStore.subscribe('banks', debouncedFetchDashboardData);
    const unsubCards = porulalarStore.subscribe('cards', debouncedFetchDashboardData);

    return () => {
      unsubLoans();
      unsubEmis();
      unsubChits();
      unsubExpenses();
      unsubIncome();
      unsubBanks();
      unsubCards();
    };
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Helper checks
  const isDueThisMonthOrBefore = (dateString?: string) => {
    if (!dateString) return true;
    const d = new Date(dateString);
    if (d.getFullYear() < currentYear) return true;
    if (d.getFullYear() === currentYear && d.getMonth() + 1 <= currentMonth) return true;
    return false;
  };

  const isCreditCardSource = (sourceId?: string, financierName?: string) => {
    if (sourceId && cards.some((c) => c.id === sourceId && c.cardType === 'Credit')) return true;
    if (financierName && cards.some((c) => c.cardType === 'Credit' && financierName.toLowerCase().includes(c.cardName.toLowerCase()))) return true;
    if (financierName && financierName.toLowerCase().includes('card')) return true;
    return false;
  };

  // ── Bento values calculations ─────────────────────────────────────
  const bankBalance = stats?.bankBalance || 0;
  const investmentsValue = stats?.investmentsValue || 0;
  const assetsValue = stats?.assetsValue || 0;
  const liabilitiesValue = stats?.liabilities || 0;
  const netWorth = stats?.netWorth || 0;
  const monthlyIncome = stats?.income?.thisMonth || 0;
  const monthlyExpenses = stats?.expenses?.thisMonth || 0;
  const savingsRate = stats?.savings?.savingsRate || 0;

  const totalAssetsValue = assets.reduce((sum, a) => sum + (a.currentEstimatedValue || a.purchaseValue), 0);
  const totalInvestmentsValue = investments.reduce((sum, i) => sum + (i.currentValue || i.investedAmount), 0);
  const totalBankBalance = banks.reduce((sum, b) => sum + b.currentBalance, 0);

  let chitAssets = 0;
  let chitLiabilities = 0;
  chits.filter((c) => c.status === 'Active').forEach((c) => {
    const sharePct = c.isShared && c.mySharePercentage ? c.mySharePercentage / 100 : 1;
    if (c.prizeTaken) {
      chitLiabilities += c.installmentsRemaining * c.monthlyContribution * sharePct;
    } else {
      chitAssets += c.totalChitValue * sharePct - c.monthlyContribution * sharePct;
    }
  });

  const totalEMIOutstanding = emis
    .filter((e) => e.status === 'Active')
    .reduce((sum, e) => {
      const totalEmiMonths = e.totalEMIs || e.totalMonths || 0;
      const paid = e.paidEMIs || e.monthsPaid || 0;
      const remaining = Math.max(0, totalEmiMonths - paid);
      return sum + remaining * e.emiAmount;
    }, 0);

  const cashAndBankTotal = assets
    .filter((a) => a.assetType === 'Bank Balance' || a.assetType === 'Cash')
    .reduce((sum, a) => sum + a.currentEstimatedValue, 0) + totalBankBalance;

  const totalCCOutstanding = cards.reduce((sum, c) => sum + (c.currentOutstanding || 0), 0);
  const totalBorrowedOutstanding = borrows.filter((b) => b.transactionType === 'Credit' && b.status === 'Active').reduce((sum, b) => sum + b.amount, 0);
  const totalLentValue = borrows.filter((b) => b.transactionType === 'Debit' && b.status === 'Active').reduce((sum, b) => sum + b.amount, 0);
  const totalLiabilitiesValue = loans
    .filter((l) => l.status === 'Active')
    .reduce((sum, l) => sum + (l.principalOutstanding ?? l.borrowedAmount), 0) +
    totalCCOutstanding +
    totalBorrowedOutstanding +
    totalEMIOutstanding +
    chitLiabilities;

  const projectedCurrentMonthExpense =
    loans.filter((l) => l.status === 'Active' && isDueThisMonthOrBefore(l.nextDueDate) && !isCreditCardSource(l.autoPaySourceId, l.lenderName)).reduce((sum, l) => sum + l.emiAmount, 0) +
    emis.filter((e) => e.status === 'Active' && isDueThisMonthOrBefore(e.nextDueDate) && !isCreditCardSource(e.autoPaySourceId, e.financier || e.lenderName)).reduce((sum, e) => sum + e.emiAmount, 0) +
    chits.filter((c) => c.status === 'Active' && isDueThisMonthOrBefore(c.nextDueDate) && !isCreditCardSource(c.autoPaySourceId)).reduce((sum, c) => {
      const sharePct = c.isShared && c.mySharePercentage ? c.mySharePercentage / 100 : 1;
      return sum + c.monthlyContribution * sharePct;
    }, 0) +
    investments.filter((i) => !isCreditCardSource(i.autoPaySourceId)).reduce((sum, i) => sum + (i.monthlyContribution || 0), 0) +
    budgets.reduce((sum, b) => sum + b.limit, 0);

  // Financial Health Score calculation
  const getHealthScore = () => {
    let score = 100;
    const activeLoans = loans.filter((l) => l.status === 'Active');
    const totalBorrowed = activeLoans.reduce((sum, l) => sum + (l.principalOutstanding ?? l.borrowedAmount), 0);
    const dtiRatio = monthlyIncome > 0 ? (totalBorrowed / (monthlyIncome * 12)) * 100 : 0;
    if (dtiRatio > 50) score -= 25;
    else if (dtiRatio > 30) score -= 15;

    const overdueEMIs = activeLoans.filter((l) => l.nextDueDate && new Date(l.nextDueDate).getTime() < new Date().getTime());
    if (overdueEMIs.length > 0) score -= overdueEMIs.length * 10;

    const limitOverruns = budgets.filter((b) => {
      const actual = expenses
        .filter((e) => {
          const eDate = new Date(e.date);
          return e.category === b.category && eDate.getMonth() + 1 === currentMonth && eDate.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      return actual >= b.limit;
    });
    score -= limitOverruns.length * 8;

    if (savingsRate < 10) score -= 20;
    else if (savingsRate < 20) score -= 10;

    return Math.max(10, Math.min(score, 100));
  };

  const healthScore = getHealthScore();

  // Smart Insights Engine
  const getSmartInsights = () => {
    const list: Array<{ type: 'warn' | 'success' | 'info'; text: string }> = [];
    const today = new Date();

    loans.forEach((l) => {
      if (l.status === 'Active' && l.nextDueDate) {
        const diffDays = Math.ceil((new Date(l.nextDueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          list.push({
            type: 'warn',
            text: `EMI payment of ₹${l.emiAmount.toLocaleString('en-IN')} for your ${l.loanName} is due in ${diffDays} days (${l.nextDueDate})!`,
          });
        }
      }
    });

    chits.forEach((c) => {
      if (c.status === 'Active' && c.nextDueDate) {
        const diffDays = Math.ceil((new Date(c.nextDueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          list.push({
            type: 'warn',
            text: `Chit Contribution of ₹${c.monthlyContribution.toLocaleString('en-IN')} for ${c.chitName} is due in ${diffDays} days (${c.nextDueDate})!`,
          });
        }
      }
    });

    budgets.forEach((b) => {
      const actual = expenses
        .filter((e) => {
          const eDate = new Date(e.date);
          return e.category === b.category && eDate.getMonth() + 1 === currentMonth && eDate.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      if (actual >= b.limit) {
        list.push({
          type: 'warn',
          text: `Critical! You have exceeded your defined monthly budget of ₹${b.limit.toLocaleString('en-IN')} for ${b.category} (Spent ₹${actual.toLocaleString('en-IN')})!`,
        });
      } else if (actual >= b.limit * 0.8) {
        list.push({
          type: 'info',
          text: `Warning: You have consumed ${((actual / b.limit) * 100).toFixed(0)}% of your budget for ${b.category} (Spent ₹${actual.toLocaleString('en-IN')} out of ₹${b.limit.toLocaleString('en-IN')}).`,
        });
      }
    });

    if (savingsRate < 20 && monthlyIncome > 0) {
      list.push({
        type: 'warn',
        text: `Your monthly savings rate is currently ${savingsRate.toFixed(1)}%, which is below the safe target of 20%. Consider minimizing discretionary expenses.`,
      });
    } else if (savingsRate >= 35) {
      list.push({
        type: 'success',
        text: `Awesome! Outstanding savings rate of ${savingsRate.toFixed(1)}% this month. Keep it up!`,
      });
    }

    if (cashAndBankTotal > totalLiabilitiesValue * 0.3 && totalLiabilitiesValue > 0) {
      list.push({
        type: 'info',
        text: `Prepayment Opportunity: Your liquid capital is robust. Paying off part of your outstanding loans can save significant interest!`,
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'info',
        text: 'All financial markers are currently healthy! Continue logging transactions to maintain forecast depth.',
      });
    }

    return list;
  };

  const insights = getSmartInsights();

  // Recharts trend formatting
  const getNetWorthChartData = () => {
    return netWorthSnapshots.map((data) => {
      const [y, m] = data.monthYear.split('-');
      const dateLabel = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
      return {
        name: dateLabel,
        'Net Worth': data.netWorth,
        Assets: data.assetsValue + data.investmentsValue,
        Liabilities: data.liabilitiesValue,
      };
    });
  };

  const netWorthData = getNetWorthChartData();
  const pieData = stats?.pieData || [];
  const barData = stats?.barData || [];
  const COLORS = ['#0ea5e9', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#4b5563', '#4f46e5', '#0891b2', '#2563eb', '#16a34a', '#ca8a04'];

  const nextMonthEMIs = emis.filter((e) => e.status === 'Active').reduce((sum, e) => sum + e.emiAmount, 0);
  const nextMonthChits = chits.filter((c) => c.status === 'Active').reduce((sum, c) => {
    const sharePct = c.isShared && c.mySharePercentage ? c.mySharePercentage / 100 : 1;
    return sum + c.monthlyContribution * sharePct;
  }, 0);
  const nextMonthSIPs = investments.reduce((sum, i) => sum + (i.monthlyContribution || 0), 0);
  const estimatedNextMonthNeeds = nextMonthEMIs + nextMonthChits + nextMonthSIPs + 15000;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Financial Health Score Alert Row */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 font-black text-lg shadow-3xs font-mono">
            {healthScore}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-500" /> Financial Health Score
            </h2>
            <p className="text-xs text-slate-500 max-w-md">
              {healthScore >= 80
                ? 'Excellent financial control. High savings rate and compliance with category budget limits.'
                : healthScore >= 60
                ? 'Good financial performance. Ensure to pay off outstanding debt prepayments and control shopping.'
                : 'Action required: Debt ratio is high or your budgets have experienced multiple overruns.'}
            </p>
          </div>
        </div>

        <div className="text-center font-mono md:text-right">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Savings Rate</span>
          <span className="text-2xl font-black text-emerald-600">{savingsRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Core Scorecard Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Portfolios Counts */}
        <div
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            const items = [
              ...emis.filter((e) => e.status === 'Active').map((e) => ({ label: `EMI: ${e.itemName}`, value: 'Active' })),
              ...chits.filter((c) => c.status === 'Active').map((c) => ({ label: `Chit: ${c.chitName}`, value: 'Active' })),
              ...cards.filter((c) => c.cardType === 'Credit').map((c) => ({ label: `CC: ${c.cardName}`, value: 'Active' })),
              ...loans.filter((l) => l.status === 'Active').map((l) => ({ label: `Loan: ${l.loanName}`, value: 'Active' })),
              ...investments.map((i) => ({ label: `Wealth: ${i.investmentName}`, value: 'Active' })),
            ];
            setBreakdownModal({ title: 'Active Portfolios Breakdown', items });
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Portfolios</span>
            <Layers className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">EMIs</span>
                <span className="text-lg font-black text-slate-700">{emis.filter((e) => e.status === 'Active').length}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Chits</span>
                <span className="text-lg font-black text-slate-700">{chits.filter((c) => c.status === 'Active').length}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">CCs</span>
                <span className="text-lg font-black text-slate-700">{cards.filter((c) => c.cardType === 'Credit').length}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Loans</span>
                <span className="text-lg font-black text-slate-700">{loans.filter((l) => l.status === 'Active').length}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Wealth</span>
                <span className="text-lg font-black text-slate-700">{investments.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projected Expense */}
        <div
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            const items = [
              ...loans.filter((l) => l.status === 'Active' && isDueThisMonthOrBefore(l.nextDueDate) && !isCreditCardSource(l.autoPaySourceId, l.lenderName)).map((l) => ({ label: `Loan EMI: ${l.lenderName}`, amount: l.emiAmount })),
              ...emis.filter((e) => e.status === 'Active' && isDueThisMonthOrBefore(e.nextDueDate) && !isCreditCardSource(e.autoPaySourceId, e.financier || e.lenderName)).map((e) => ({ label: `EMI: ${e.itemName || e.financier}`, amount: e.emiAmount })),
              ...chits.filter((c) => c.status === 'Active' && isDueThisMonthOrBefore(c.nextDueDate) && !isCreditCardSource(c.autoPaySourceId)).map((c) => {
                const sharePct = c.isShared && c.mySharePercentage ? c.mySharePercentage / 100 : 1;
                return { label: `Chit: ${c.chitName}`, amount: c.monthlyContribution * sharePct };
              }),
              ...investments.filter((i) => !isCreditCardSource(i.autoPaySourceId)).map((i) => ({ label: `SIP: ${i.investmentName}`, amount: i.monthlyContribution || 0 })),
              ...budgets.map((b) => ({ label: `Budget: ${b.category}`, amount: b.limit })),
            ];
            setBreakdownModal({
              title: `Projected Expense`,
              items,
              total: projectedCurrentMonthExpense,
            });
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected Expense</span>
            <TrendingUp className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-rose-500 leading-tight">
              ₹{projectedCurrentMonthExpense.toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">EMIs, Chits, Auto Pay, Loans, and other known expenses.</p>
          </div>
        </div>

        {/* Current Net Worth */}
        <div
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between space-y-3 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setBreakdownModal({
              title: 'Net Worth Breakdown',
              items: [
                { label: 'Total Assets Value', amount: totalAssetsValue },
                { label: 'Total Investments', amount: totalInvestmentsValue },
                { label: 'Bank Balances', amount: totalBankBalance },
                { label: 'Money Owed to You', amount: totalLentValue },
                { label: 'Chit Assets', amount: chitAssets },
                { label: 'Total Liabilities', amount: -totalLiabilitiesValue },
              ],
              total: netWorth,
            });
          }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Net Worth</span>
            <Wallet className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900 leading-tight">
              ₹{netWorth.toLocaleString('en-IN')}
            </span>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Assets: ₹{(totalAssetsValue + totalInvestmentsValue + totalBankBalance + totalLentValue + chitAssets).toLocaleString('en-IN')}</span>
              <span>Debt: ₹{totalLiabilitiesValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast & Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Dues / Payments Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" /> Upcoming Payments (Next 15 Days)
          </h3>

          <div className="space-y-3">
            {(() => {
              const todayTime = new Date().getTime();
              const isUpcoming = (dateStr?: string) => {
                if (!dateStr) return false;
                const d = new Date(dateStr).getTime();
                const diffDays = Math.ceil((d - todayTime) / (1000 * 60 * 60 * 24));
                return diffDays <= 15;
              };

              const upcomingItems: Array<{ id: string; name: string; date: string; amount: number; type: string }> = [];

              loans.filter((l) => l.status === 'Active' && isUpcoming(l.nextDueDate) && !isCreditCardSource(l.autoPaySourceId, l.lenderName)).forEach((l) => {
                upcomingItems.push({ id: l.id, name: l.loanName, date: l.nextDueDate, amount: l.emiAmount, type: 'EMI Payment' });
              });
              emis.filter((e) => e.status === 'Active' && isUpcoming(e.nextDueDate) && !isCreditCardSource(e.autoPaySourceId, e.financier || e.lenderName)).forEach((e) => {
                upcomingItems.push({ id: e.id, name: e.itemName, date: e.nextDueDate, amount: e.emiAmount, type: 'EMI Payment' });
              });
              chits.filter((c) => c.status === 'Active' && isUpcoming(c.nextDueDate) && !isCreditCardSource(c.autoPaySourceId)).forEach((c) => {
                upcomingItems.push({ id: c.id, name: c.chitName, date: c.nextDueDate, amount: c.monthlyContribution, type: 'Chit Contribution' });
              });

              upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              if (upcomingItems.length === 0) {
                return <p className="text-sm text-slate-400 italic py-4 text-center">No upcoming fixed payments tracked.</p>;
              }

              return upcomingItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.type}: {item.name}</span>
                    <span className="text-[10px] text-slate-400 block">Due Date: {item.date}</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Future Cash Flow Projector */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
            <Clock className="h-4.5 w-4.5 text-amber-500" /> AI Cash Flow Projection (Next Month)
          </h3>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-4 font-mono text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Estimated Incomes</span>
                <span className="font-bold text-emerald-600 text-sm">₹{monthlyIncome.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Committed Liabilities</span>
                <span className="font-bold text-rose-500 text-sm">₹{(nextMonthEMIs + nextMonthChits + nextMonthSIPs).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 leading-relaxed bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-slate-700">
              <div className="font-semibold text-amber-800 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Smart Forecast:
              </div>
              <p>
                Based on current habits, you will need approximately <span className="font-bold font-mono">₹{estimatedNextMonthNeeds.toLocaleString('en-IN')}</span> next month to cover EMIs, chit contributions, SIP investments, and general cost of living.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Budgets Widget */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100/60 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
              <PiggyBank className="h-4.5 w-4.5 text-indigo-600 animate-pulse" /> Monthly Budget & Cap Thresholds
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status of current month spending limits against active budgets</p>
          </div>
          <button
            onClick={() => navigate('/expenses')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Manage Budgets</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
            <PiggyBank className="h-10 w-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">No active monthly budgets defined.</p>
              <p className="text-[10px] text-slate-400">Map custom caps to prevent excessive overruns.</p>
            </div>
            <button
              onClick={() => navigate('/expenses')}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Set Up Your First Budget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const actual = expenses
                .filter((e) => {
                  const eDate = new Date(e.date);
                  return e.category === b.category && eDate.getMonth() + 1 === currentMonth && eDate.getFullYear() === currentYear;
                })
                .reduce((sum, e) => sum + e.amount, 0);

              const percent = b.limit > 0 ? (actual / b.limit) * 100 : 0;
              const cappedPercent = Math.min(percent, 100);
              const remaining = b.limit - actual;
              const isOver = remaining < 0;
              const isNear = percent >= 80 && percent < 100;

              return (
                <div
                  key={b.id}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                    isOver
                      ? 'border-rose-100 bg-rose-50/10 shadow-3xs hover:shadow-xs'
                      : isNear
                      ? 'border-amber-100 bg-amber-50/10 shadow-3xs hover:shadow-xs'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-3xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{b.category}</span>
                      {isOver ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          Overrun
                        </span>
                      ) : isNear ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          Nearing Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Safe
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-sm font-black text-slate-800">
                        ₹{actual.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        of ₹{b.limit.toLocaleString('en-IN')} limit
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/40 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver
                              ? 'bg-gradient-to-r from-rose-500 to-red-600'
                              : isNear
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          }`}
                          style={{ width: `${cappedPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                        <span className={isOver ? 'text-rose-600 font-bold font-mono' : isNear ? 'text-amber-600 font-bold font-mono' : 'text-emerald-600 font-mono'}>
                          {percent.toFixed(0)}% Used
                        </span>
                        {isOver ? (
                          <span className="text-rose-500 font-semibold">Exceeded by ₹{Math.abs(remaining).toLocaleString('en-IN')}</span>
                        ) : (
                          <span>₹{remaining.toLocaleString('en-IN')} Left</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recharts Net Worth & Comparisons */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <Wallet className="h-4.5 w-4.5 text-indigo-600" /> 12-Month Net Worth Trend
        </h3>
        <div className="h-72">
          {netWorthData.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center pt-24">Loading chart data...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Line type="monotone" dataKey="Net Worth" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Assets" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Liabilities" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Pie & Cashflow Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-indigo-500" /> Monthly Expense Breakdown
          </h3>
          <div className="h-72 flex flex-col sm:flex-row items-center">
            <div className="flex-1 h-full w-full">
              {pieData.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center pt-28">No expenses logged this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                      {pieData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto w-full sm:w-44 text-xs space-y-2 mt-4 sm:mt-0 pl-0 sm:pl-4 border-l border-transparent sm:border-slate-100">
              {pieData.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600 truncate font-semibold">{entry.name}</span>
                  </div>
                  <span className="font-bold font-mono text-slate-800">₹{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-indigo-500" /> Income vs Expenses (Last 6 Months)
          </h3>
          <div className="h-72">
            {barData.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center pt-28">Loading chart data...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Smart Insights Drawer Block */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4" id="smart-insights-section">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> AI Smart Advisory Insights
        </h3>
        <div className="space-y-3.5">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3.5 shadow-2xs hover:shadow-xs transition-shadow ${
                insight.type === 'warn'
                  ? 'border-rose-100 bg-rose-50/20 text-rose-800'
                  : insight.type === 'success'
                  ? 'border-emerald-100 bg-emerald-50/20 text-emerald-800'
                  : 'border-indigo-100 bg-indigo-50/20 text-indigo-800'
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center ${
                  insight.type === 'warn' ? 'bg-rose-100 text-rose-600' : insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {insight.type === 'warn' ? <AlertTriangle className="h-3.5 w-3.5" /> : insight.type === 'success' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>
              <p className="font-medium pt-0.5">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown Details Modal */}
      {breakdownModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setBreakdownModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">{breakdownModal.title}</h3>
              <button onClick={() => setBreakdownModal(null)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {breakdownModal.items.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4 italic">No items found.</p>
              ) : (
                breakdownModal.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {item.amount !== undefined ? `₹${item.amount.toLocaleString('en-IN')}` : item.value}
                    </span>
                  </div>
                ))
              )}
            </div>
            {breakdownModal.total !== undefined && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">Total</span>
                <span className="font-black text-slate-900 text-lg font-mono">
                  ₹{breakdownModal.total.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
