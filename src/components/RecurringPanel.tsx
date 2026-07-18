import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, Clock, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { RecurringTransaction } from '../types';
import { useDialog } from './DialogProvider';

interface RecurringPanelProps {
  userId: string;
  recurringTransactions: RecurringTransaction[];
  onRefreshData: () => void;
  categories?: string[];
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

export default function RecurringPanel({ userId, recurringTransactions, onRefreshData, categories }: RecurringPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const activeCategories = categories || CATEGORIES;
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [sourceOrSubCategory, setSourceOrSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !nextDueDate) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      await showAlert('Please enter a valid amount greater than 0.', 'Validation Error', 'error');
      return;
    }

    try {
      await porulalarStore.addRecord('recurringTransactions', {
        userId,
        type,
        schedule,
        amount: Number(amount),
        category: type === 'expense' ? category : (category || 'Salary'),
        sourceOrSubCategory: sourceOrSubCategory || 'Auto',
        description: description || `Auto recurring ${type}`,
        nextDueDate,
        lastProcessedDate: null,
        active: true,
      });

      // Clear Form
      setAmount('');
      setSourceOrSubCategory('');
      setDescription('');
      setShowAddForm(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (rec: RecurringTransaction) => {
    try {
      const docRef = rec.id;
      await porulalarStore.updateRecord('recurringTransactions', rec.id, { active: !rec.active });
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this recurring setup?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('recurringTransactions', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-indigo-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Automated Schedule Broker</h4>
            <p className="text-xs text-slate-500">
              The scheduler triggers automatically on application boot, checking due schedules and processing transactions safely.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          id="btn-add-recurring"
        >
          <Plus className="h-4 w-4" /> Setup Autopay Schedule
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddRecurring} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <Clock className="text-indigo-500 h-5 w-5" /> Schedule New Recurring Transaction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Transaction Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value as 'expense' | 'income';
                  setType(val);
                  setCategory(val === 'expense' ? 'Rent' : 'Salary');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
              >
                <option value="expense">Expense (Auto-Debit)</option>
                <option value="income">Income (Auto-Credit)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Frequency Schedule</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Next Occurrence Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {type === 'expense' ? 'Expense Category' : 'Income Source'}
              </label>
              {type === 'expense' ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
                >
                  {activeCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
                >
                  <option value="Salary">Salary</option>
                  <option value="Farm Income">Farm Income</option>
                  <option value="Milk Sales">Milk Sales</option>
                  <option value="Interest Income">Interest Income</option>
                  <option value="Other">Other</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {type === 'expense' ? 'Sub-Category' : 'Sub-Source'}
              </label>
              <input
                type="text"
                placeholder={type === 'expense' ? 'e.g. House Rent, Broadband' : 'e.g. Primary, Secondary'}
                value={sourceOrSubCategory}
                onChange={(e) => setSourceOrSubCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Automatically charged rent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Add Autopay Schedule
            </button>
          </div>
        </form>
      )}

      {/* List of schedules */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
        <h3 className="font-bold text-slate-800 text-base mb-4">Recurring Schedules Ledger</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringTransactions.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 italic">No recurring schedules set up yet. Setup subscriptions or monthly incomes above.</div>
          ) : (
            recurringTransactions.map((rec) => (
              <div key={rec.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-md ${
                      rec.type === 'expense' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {rec.type} &bull; {rec.schedule}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm mt-1.5">{rec.description}</h4>
                    <span className="text-[11px] text-slate-400">
                      {rec.category} &bull; {rec.sourceOrSubCategory}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(rec)}
                      className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        rec.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {rec.active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteRecurring(rec.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Amount</span>
                    <span className="font-bold text-slate-800">₹{rec.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[9px] uppercase">Next Occurrence</span>
                    <span className="font-bold text-slate-700 flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3 text-indigo-500" /> {rec.nextDueDate}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
