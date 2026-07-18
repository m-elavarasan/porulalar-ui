import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, AlertTriangle, Check, ShieldAlert, PiggyBank, Receipt, Percent, Edit3, AlertCircle, Sparkles, TrendingUp, Wallet, X, Grid, List } from 'lucide-react';
import { Expense, Budget, Bank, Card } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend } from 'recharts';
import { useDialog } from './DialogProvider';

interface ExpensePanelProps {
  userId: string;
  expenses: Expense[];
  budgets: Budget[];
  onRefreshData: () => void;
  categories?: string[];
  banks: Bank[];
  cards: Card[];

  // Pagination parameters
  page?: number;
  setPage?: (p: number) => void;
  totalExpenses?: number;
  limit?: number;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  filterCategory?: string;
  setFilterCategory?: (c: string) => void;
  startDateFilter?: string;
  setStartDateFilter?: (d: string) => void;
  endDateFilter?: string;
  setEndDateFilter?: (d: string) => void;
}

const CATEGORIES = [
  'Food',
  'Fuel',
  'Rent',
  'EMI',
  'Chit',
  'Insurance',
  'Investment',
  'Shopping',
  'Entertainment',
  'Medical',
  'Travel',
  'Utilities',
  'Other',
];

export default function ExpensePanel({
  userId,
  expenses,
  budgets,
  banks,
  cards,
  onRefreshData,
  categories,
  page = 1,
  setPage,
  totalExpenses = 0,
  limit = 20,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  filterCategory: propFilterCategory,
  setFilterCategory: propSetFilterCategory,
  startDateFilter: propStartDateFilter,
  setStartDateFilter: propSetStartDateFilter,
  endDateFilter: propEndDateFilter,
  setEndDateFilter: propSetEndDateFilter
}: ExpensePanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const activeCategories = categories || CATEGORIES;

  // Fallback local states if props are not provided
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localFilterCategory, setLocalFilterCategory] = useState('All');
  const [localStartDateFilter, setLocalStartDateFilter] = useState('');
  const [localEndDateFilter, setLocalEndDateFilter] = useState('');

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery || setLocalSearchQuery;

  const filterCategory = propFilterCategory !== undefined ? propFilterCategory : localFilterCategory;
  const setFilterCategory = propSetFilterCategory || setLocalFilterCategory;

  const startDateFilter = propStartDateFilter !== undefined ? propStartDateFilter : localStartDateFilter;
  const setStartDateFilter = propSetStartDateFilter || setLocalStartDateFilter;

  const endDateFilter = propEndDateFilter !== undefined ? propEndDateFilter : localEndDateFilter;
  const setEndDateFilter = propSetEndDateFilter || setLocalEndDateFilter;

  // Expense Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Food');
  const [subCategory, setSubCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentSourceId, setPaymentSourceId] = useState('Cash');
  const [description, setDescription] = useState('');

  // Budget Form State
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetViewMode, setBudgetViewMode] = useState<'grid' | 'table'>('grid');

  // Local state for toggles
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);

  const [selectedTrendCategory, setSelectedTrendCategory] = useState<string>('All');

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  // Render a custom progress bar with color-coded alerts
  const renderUsageBar = (percent: number) => {
    const cappedPercent = Math.min(percent, 100);
    const isOver = percent >= 100;
    const isNear = percent >= 80 && percent < 100;
    
    return (
      <div className="flex items-center gap-3 w-full min-w-[140px]" id="usage-bar-container">
        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOver ? 'bg-gradient-to-r from-rose-500 to-red-600' : isNear ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            }`}
            style={{ width: `${cappedPercent}%` }}
          />
        </div>
        <span className={`text-xs font-bold font-mono shrink-0 ${isOver ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-emerald-600'}`}>
          {percent.toFixed(0)}%
        </span>
      </div>
    );
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 whitespace-nowrap">
          <ShieldAlert className="h-3 w-3" />
          <span>Overrun</span>
        </span>
      );
    } else if (percent >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
          <AlertTriangle className="h-3 w-3" />
          <span>Nearing Limit</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
          <Check className="h-3 w-3" />
          <span>Safe</span>
        </span>
      );
    }
  };

  // Calculate actual spending per category for current month
  const getActualCategorySpend = (cat: string) => {
    return expenses
      .filter((e) => {
        const eDate = new Date(e.date);
        const eMonth = eDate.getMonth() + 1;
        const eYear = eDate.getFullYear();
        return e.category === cat && eMonth === currentMonth && eYear === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  // Calculate proactive projection based on average daily spending rate
  const getProactiveProjection = (limit: number, actual: number) => {
    if (limit <= 0) return null;
    const today = new Date();
    const currentDay = Math.max(1, today.getDate());
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyRate = actual / currentDay;
    const projectedSpend = dailyRate * totalDaysInMonth;
    const isOnTrackToExceed = projectedSpend > limit;
    const percentageOfLimit = (projectedSpend / limit) * 100;

    return {
      projectedSpend,
      isOnTrackToExceed,
      percentageOfLimit,
      dailyRate
    };
  };

  // Generate spending data for the last 6 months for selected category/all categories
  const getLast6MonthsSpendingData = () => {
    const today = new Date();
    const months = [];
    
    // Generate last 6 months list (chronological)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
    }

    return months.map((m) => {
      const dataPoint: any = { name: m.label };
      
      if (selectedTrendCategory === 'All') {
        // Sum up spent across all budgeted categories for that month
        let totalSpent = 0;
        budgets.forEach((b) => {
          const spent = expenses
            .filter((e) => {
              const eDate = new Date(e.date);
              const eMonth = eDate.getMonth() + 1;
              const eYear = eDate.getFullYear();
              return e.category === b.category && eMonth === m.month && eYear === m.year;
            })
            .reduce((sum, e) => sum + e.amount, 0);
          
          dataPoint[b.category] = spent;
          totalSpent += spent;
        });
        dataPoint['Spent'] = totalSpent;
        dataPoint['Limit'] = budgets.reduce((sum, b) => sum + b.limit, 0);
      } else {
        // Spent for selected category
        const spent = expenses
          .filter((e) => {
            const eDate = new Date(e.date);
            const eMonth = eDate.getMonth() + 1;
            const eYear = eDate.getFullYear();
            return e.category === selectedTrendCategory && eMonth === m.month && eYear === m.year;
          })
          .reduce((sum, e) => sum + e.amount, 0);
        
        dataPoint['Spent'] = spent;
        const matchingBudget = budgets.find((b) => b.category === selectedTrendCategory);
        dataPoint['Limit'] = matchingBudget ? matchingBudget.limit : 0;
      }
      return dataPoint;
    });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      await showAlert('Please enter a valid expense amount greater than 0.', 'Validation Error', 'error');
      return;
    }

    try {
      const nowStr = new Date().toISOString();
      const expenseAmount = Number(amount);

      let paymentMethodName = paymentSourceId;
      const selectedBank = banks.find(b => b.id === paymentSourceId);
      const selectedCard = cards.find(c => c.id === paymentSourceId);
      
      if (selectedBank) paymentMethodName = selectedBank.bankName;
      if (selectedCard) paymentMethodName = selectedCard.cardName;

      const expenseObj = {
        userId,
        date,
        category,
        subCategory: subCategory || 'General',
        amount: expenseAmount,
        paymentMethod: paymentMethodName,
        description: description || `${category} purchase`,
        tags: [],
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      await porulalarStore.addRecord('expenses', expenseObj);

      if (selectedBank) {
        await porulalarStore.updateRecord('banks', selectedBank.id, { currentBalance: increment(-expenseAmount) });
      }
      if (selectedCard) {
        await porulalarStore.updateRecord('cards', selectedCard.id, { currentOutstanding: increment(expenseAmount) });
      }

      // Clear form
      setAmount('');
      setSubCategory('');
      setDescription('');
      setShowAddExpense(false);
      onRefreshData();
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimit || isNaN(Number(budgetLimit)) || Number(budgetLimit) <= 0) {
      await showAlert('Please enter a valid budget limit greater than 0.', 'Validation Error', 'error');
      return;
    }

    try {
      if (editingBudgetId) {
        // Direct update of the budget being edited
        const docRef = editingBudgetId;
        await porulalarStore.updateRecord('budgets', docRef, { limit: Number(budgetLimit) });
        setEditingBudgetId(null);
      } else {
        // Check if budget for this category already exists in current month/year
        const existing = budgets.find(
          (b) => b.category === budgetCategory && b.month === currentMonth && b.year === currentYear
        );

        if (existing) {
          // Update existing limit
          const docRef = existing.id;
          await porulalarStore.updateRecord('budgets', docRef, { limit: Number(budgetLimit) });
        } else {
          // Create new budget doc
          await porulalarStore.addRecord('budgets', {
            userId,
            category: budgetCategory,
            limit: Number(budgetLimit),
            month: currentMonth,
            year: currentYear,
          });
        }
      }

      setBudgetLimit('');
      setShowAddBudget(false);
      onRefreshData();
    } catch (err) {
      console.error('Error setting budget:', err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this category budget?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('budgets', id);
      onRefreshData();
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  const handleEditBudgetClick = (b: Budget) => {
    setBudgetCategory(b.category);
    setBudgetLimit(b.limit.toString());
    setEditingBudgetId(b.id);
    setShowAddBudget(true);
  };

  const handleDeleteExpense = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this expense?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('expenses', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredExpenses = setPage ? expenses : expenses.filter((exp) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const catMatch = exp.category?.toLowerCase().includes(q) || false;
      const subMatch = exp.subCategory?.toLowerCase().includes(q) || false;
      const descMatch = exp.description?.toLowerCase().includes(q) || false;
      if (!catMatch && !subMatch && !descMatch) return false;
    }
    if (filterCategory !== 'All' && exp.category !== filterCategory) {
      return false;
    }
    if (startDateFilter && exp.date < startDateFilter) return false;
    if (endDateFilter && exp.date > endDateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          id="btn-add-expense"
        >
          <Plus className="h-4.5 w-4.5" /> Log Expense
        </button>
        <button
          onClick={() => setShowAddBudget(!showAddBudget)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          id="btn-add-budget"
        >
          <PiggyBank className="h-4.5 w-4.5" /> Define Budget
        </button>
      </div>

      {/* Add Expense Form */}
      {showAddExpense && (
        <form onSubmit={handleAddExpense} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <Receipt className="text-indigo-500 h-5 w-5" /> Log New Expense
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sub-Category</label>
              <input
                type="text"
                placeholder="e.g. Petrol, Groceries"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
              <select
                value={paymentSourceId}
                onChange={(e) => setPaymentSourceId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Auto-Debit">Auto-Debit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Car refueled at HP"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddExpense(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Save Transaction
            </button>
          </div>
        </form>
      )}

      {/* Define Budget Form */}
      {showAddBudget && (
        <form onSubmit={handleAddBudget} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <PiggyBank className="text-amber-500 h-5 w-5" /> {editingBudgetId ? 'Update Category Budget' : 'Set Category Budget'} (Current Month)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
                disabled={!!editingBudgetId}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly Limit (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 10000"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddBudget(false);
                setEditingBudgetId(null);
                setBudgetLimit('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {editingBudgetId ? 'Update Budget' : 'Set Budget'}
            </button>
          </div>
        </form>
      )}

      {/* Category Budget Center with Visual Progress and Alerts */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-5" id="budget-center-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-indigo-500" /> Category Budget Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed tracking of category thresholds compared to active budgets for {new Date().toLocaleString('default', { month: 'long' })} {currentYear}
            </p>
          </div>

          {budgets.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setBudgetViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  budgetViewMode === 'grid'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Card View"
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setBudgetViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  budgetViewMode === 'table'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <PiggyBank className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-semibold">No budgets defined yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Define Budget" above to start mapping monthly limits.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Budget Summary Stats Bar */}
            {(() => {
              const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
              const totalSpent = budgets.reduce((sum, b) => sum + getActualCategorySpend(b.category), 0);
              const overrunBudgets = budgets.filter((b) => getActualCategorySpend(b.category) >= b.limit).length;
              const warningBudgets = budgets.filter((b) => {
                const actual = getActualCategorySpend(b.category);
                return actual >= b.limit * 0.8 && actual < b.limit;
              }).length;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Budget Allocated</span>
                    <span className="text-base font-black font-mono text-slate-800">₹{totalLimit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Total Budget Spent</span>
                    <span className="text-base font-black font-mono text-slate-800">₹{totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Over-Limit Categories</span>
                    <span className={`text-base font-black font-mono flex items-center gap-1.5 ${overrunBudgets > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {overrunBudgets > 0 ? (
                        <>
                          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                          <span>{overrunBudgets}</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 shrink-0" />
                          <span>None</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Nearing-Limit Zones (80%+)</span>
                    <span className={`text-base font-black font-mono flex items-center gap-1.5 ${warningBudgets > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {warningBudgets > 0 ? (
                        <>
                          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                          <span>{warningBudgets}</span>
                        </>
                      ) : (
                        <span>None</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })()}

            {budgetViewMode === 'grid' ? (
              /* Grid Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {budgets.map((b) => {
                  const actual = getActualCategorySpend(b.category);
                  const percent = b.limit > 0 ? (actual / b.limit) * 100 : 0;
                  const remaining = b.limit - actual;
                  const isOver = remaining < 0;
                  const isNear = percent >= 80 && percent < 100;

                  return (
                    <div
                      key={b.id}
                      className={`rounded-2xl border p-4.5 transition-all shadow-3xs flex flex-col justify-between space-y-4 ${
                        isOver
                          ? 'border-rose-200 bg-rose-50/20 shadow-rose-100/50 hover:shadow-md'
                          : isNear
                          ? 'border-amber-200 bg-amber-50/10 shadow-amber-100/50 hover:shadow-md'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-xs'
                      }`}
                      id={`budget-card-${b.category}`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-xs font-black text-slate-800 block leading-tight">{b.category}</span>
                            <span className="text-[10px] text-slate-400">Monthly Cap limit</span>
                          </div>
                          {getStatusBadge(percent)}
                        </div>

                        {/* Limit vs Actual amounts */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Allocated Cap</span>
                            <span className="text-sm font-black font-mono text-slate-700">₹{b.limit.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Actual Spent</span>
                            <span className="text-sm font-black font-mono text-slate-900">₹{actual.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Progress Bar with detailed highlights */}
                        <div className="space-y-1 pt-1">
                          {renderUsageBar(percent)}
                          <div className="flex justify-between items-center text-[10px]">
                            {isOver ? (
                              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                <span>Exceeded by ₹{Math.abs(remaining).toLocaleString('en-IN')}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">
                                <span className="font-bold font-mono text-emerald-600">₹{remaining.toLocaleString('en-IN')}</span> remaining
                              </span>
                            )}
                          </div>

                          {/* Proactive Projection Badge */}
                          {(() => {
                            const proj = getProactiveProjection(b.limit, actual);
                            if (!proj) return null;
                            return (
                              <div className={`mt-2.5 p-2 rounded-xl text-[10px] flex items-center justify-between transition-all ${
                                isOver
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : proj.isOnTrackToExceed
                                  ? 'bg-amber-50 text-amber-800 border border-amber-100 animate-pulse'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              }`}>
                                <div className="flex items-center gap-1 font-bold">
                                  <TrendingUp className="h-3 w-3 text-indigo-500" />
                                  <span>Proactive Projection</span>
                                </div>
                                <span className="font-mono font-bold">
                                  {isOver
                                    ? 'Exceeded Limit'
                                    : proj.isOnTrackToExceed
                                    ? `Over Cap (Est. ₹${Math.round(proj.projectedSpend).toLocaleString('en-IN')})`
                                    : `On Track (Est. ₹${Math.round(proj.projectedSpend).toLocaleString('en-IN')})`
                                  }
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Edit / Delete Row */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100/60">
                        <button
                          type="button"
                          onClick={() => handleEditBudgetClick(b)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit limit"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(b.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove budget cap"
                        >
                          <Trash className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="budget-comparison-table">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4 rounded-l-xl">Category</th>
                      <th className="py-3 px-4">Budget Limit</th>
                      <th className="py-3 px-4">Actual Spent</th>
                      <th className="py-3 px-4">Remaining / Overrun</th>
                      <th className="py-3 px-4">Usage Progress</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) => {
                      const actual = getActualCategorySpend(b.category);
                      const percent = b.limit > 0 ? (actual / b.limit) * 100 : 0;
                      const remaining = b.limit - actual;
                      const isOver = remaining < 0;

                      return (
                        <tr key={b.id} className="text-sm hover:bg-slate-50/50 border-b border-slate-100/70 transition-all">
                          <td className="py-3.5 px-4 font-bold text-slate-700">{b.category}</td>
                          <td className="py-3.5 px-4 font-semibold font-mono text-slate-600">
                            ₹{b.limit.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-semibold font-mono text-slate-900">
                            ₹{actual.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold font-mono text-xs px-2.5 py-1 rounded-lg ${isOver ? 'bg-rose-50 text-rose-600 font-semibold' : 'bg-emerald-50 text-emerald-600 font-medium'}`}>
                              {isOver ? '-' : '+'}₹{Math.abs(remaining).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {renderUsageBar(percent)}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(percent)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditBudgetClick(b)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Budget Limit"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBudget(b.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Budget limit"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6-Month Category Spending Trend Chart */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4" id="6-month-budget-trend">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/60 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500 animate-pulse" /> 6-Month Spending Trends vs Limits
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical comparison of monthly spending against current caps</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Category:</span>
              <select
                value={selectedTrendCategory}
                onChange={(e) => setSelectedTrendCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
              >
                <option value="All">All Budgets (Combined)</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.category}>{b.category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getLast6MonthsSpendingData()} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {selectedTrendCategory === 'All' ? (
                  budgets.map((b, idx) => {
                    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#3b82f6', '#64748b'];
                    const color = colors[idx % colors.length];
                    return (
                      <Bar key={b.id} dataKey={b.category} stackId="spent" fill={color} />
                    );
                  })
                ) : (
                  <Bar dataKey="Spent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                )}
                <ReferenceLine 
                  y={
                    selectedTrendCategory === 'All' 
                      ? budgets.reduce((sum, b) => sum + b.limit, 0)
                      : (budgets.find(b => b.category === selectedTrendCategory)?.limit || 0)
                  } 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: 'Cap Limit', fill: '#ef4444', position: 'top', fontSize: 10, fontWeight: 'bold' }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expenses History List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-slate-800 text-base">Expense Records</h3>
          {(searchQuery || filterCategory !== 'All' || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('All');
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Search Keyword</label>
            <input
              type="text"
              placeholder="e.g. Fuel, Petrol, Rent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
            >
              <option value="All">All Categories</option>
              {activeCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden text-slate-600"
              />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Sub-Category</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400 italic">No expenses recorded yet. Use AI chat or click "Log Expense" above.</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400 italic">No expenses found matching the selected filters.</td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="text-sm hover:bg-slate-50/50 transition-all">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{exp.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{exp.subCategory}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs truncate max-w-xs">{exp.description}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete expense record"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {setPage && totalExpenses > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 px-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 cursor-pointer transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-semibold font-mono">
              Page {page} of {Math.max(1, Math.ceil(totalExpenses / limit))} ({totalExpenses} records)
            </span>
            <button
              onClick={() => setPage(Math.min(Math.ceil(totalExpenses / limit), page + 1))}
              disabled={page >= Math.ceil(totalExpenses / limit)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
