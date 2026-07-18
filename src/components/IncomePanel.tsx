import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, ArrowDownLeft, Edit3, Check, X } from 'lucide-react';
import { Income, Bank } from '../types';
import { useDialog } from './DialogProvider';

interface IncomePanelProps {
  userId: string;
  income: Income[];
  onRefreshData: () => void;
  banks?: Bank[];

  // Pagination parameters
  page?: number;
  setPage?: (p: number) => void;
  totalIncome?: number;
  limit?: number;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  filterSource?: string;
  setFilterSource?: (s: string) => void;
  startDateFilter?: string;
  setStartDateFilter?: (d: string) => void;
  endDateFilter?: string;
  setEndDateFilter?: (d: string) => void;
}

const SOURCES = [
  'Salary',
  'Farm Income',
  'Milk Sales',
  'Chit Received',
  'Bonus',
  'Interest Income',
  'Other',
];

export default function IncomePanel({
  userId,
  income,
  banks,
  onRefreshData,
  page = 1,
  setPage,
  totalIncome = 0,
  limit = 20,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  filterSource: propFilterSource,
  setFilterSource: propSetFilterSource,
  startDateFilter: propStartDateFilter,
  setStartDateFilter: propSetStartDateFilter,
  endDateFilter: propEndDateFilter,
  setEndDateFilter: propSetEndDateFilter
}: IncomePanelProps) {
  const { showAlert, showConfirm } = useDialog();

  // Fallback local states if props are not provided
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localFilterSource, setLocalFilterSource] = useState('All');
  const [localStartDateFilter, setLocalStartDateFilter] = useState('');
  const [localEndDateFilter, setLocalEndDateFilter] = useState('');

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery || setLocalSearchQuery;

  const filterSource = propFilterSource !== undefined ? propFilterSource : localFilterSource;
  const setFilterSource = propSetFilterSource || setLocalFilterSource;

  const startDateFilter = propStartDateFilter !== undefined ? propStartDateFilter : localStartDateFilter;
  const setStartDateFilter = propSetStartDateFilter || setLocalStartDateFilter;

  const endDateFilter = propEndDateFilter !== undefined ? propEndDateFilter : localEndDateFilter;
  const setEndDateFilter = propSetEndDateFilter || setLocalEndDateFilter;

  // Add form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('Salary');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [linkedBankId, setLinkedBankId] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRecurring, setEditRecurring] = useState(false);
  const [editLinkedBankId, setEditLinkedBankId] = useState('');



  const getBankName = (id?: string) => {
    if (!id || !banks) return '';
    const bank = banks.find(b => b.id === id);
    return bank ? bank.bankName : '';
  };

  const updateBankBalance = async (bankId: string, delta: number) => {
    if (!bankId) return;
    await porulalarStore.updateRecord('banks', bankId, {
      currentBalance: increment(delta),
    });
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      await showAlert('Please enter a valid income amount greater than 0.', 'Validation Error', 'error');
      return;
    }

    const numAmt = Number(amount);

    try {
      await porulalarStore.addRecord('income', {
        userId,
        date,
        source,
        amount: numAmt,
        description: description || `${source} Income`,
        recurring,
        linkedBankId: linkedBankId || null,
        createdAt: new Date().toISOString(),
      });

      if (linkedBankId) {
        await updateBankBalance(linkedBankId, numAmt);
      }

      setAmount('');
      setDescription('');
      setRecurring(false);
      setLinkedBankId('');
      setShowAddForm(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (inc: Income) => {
    setEditingId(inc.id);
    setEditDate(inc.date);
    setEditSource(inc.source || 'Salary');
    setEditAmount(String(inc.amount));
    setEditDescription(inc.description || '');
    setEditRecurring(inc.recurring || false);
    setEditLinkedBankId(inc.linkedBankId || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (inc: Income) => {
    const numAmt = Number(editAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      await showAlert('Please enter a valid amount.', 'Validation Error', 'error');
      return;
    }
    try {
      await porulalarStore.updateRecord('income', inc.id, {
        date: editDate,
        source: editSource,
        amount: numAmt,
        description: editDescription || `${editSource} Income`,
        recurring: editRecurring,
        linkedBankId: editLinkedBankId || null,
        updatedAt: new Date().toISOString(),
      });

      const oldBank = inc.linkedBankId;
      const newBank = editLinkedBankId;
      const oldAmt = inc.amount;

      if (oldBank !== newBank) {
        if (oldBank) await updateBankBalance(oldBank, -oldAmt);
        if (newBank) await updateBankBalance(newBank, numAmt);
      } else if (oldBank && oldAmt !== numAmt) {
        await updateBankBalance(oldBank, numAmt - oldAmt);
      }

      setEditingId(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to update income record.', 'Error', 'error');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    const inc = income.find(i => i.id === id);
    const confirmed = await showConfirm('Are you sure you want to delete this income entry?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('income', id);
      if (inc?.linkedBankId) {
        await updateBankBalance(inc.linkedBankId, -inc.amount);
      }
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIncome = setPage ? income : income
    .filter((inc) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const sourceMatch = inc.source?.toLowerCase().includes(q) || false;
        const descMatch = inc.description?.toLowerCase().includes(q) || false;
        if (!sourceMatch && !descMatch) return false;
      }
      if (filterSource !== 'All' && inc.source !== filterSource) return false;
      if (startDateFilter && inc.date < startDateFilter) return false;
      if (endDateFilter && inc.date > endDateFilter) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500/30';

  const bankOptions = (currentId?: string) => (
    <>
      <option value="">-- Not settled --</option>
      {banks?.map(b => (
        <option key={b.id} value={b.id}>
          {b.bankName} (₹{(Number(b.currentBalance) || 0).toLocaleString('en-IN')})
        </option>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          id="btn-add-income"
        >
          <Plus className="h-4.5 w-4.5" /> Log Income
        </button>
      </div>

      {/* Add Income Form */}
      {showAddForm && (
        <form onSubmit={handleAddIncome} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <ArrowDownLeft className="text-emerald-500 h-5 w-5" /> Log New Income
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                {SOURCES.map((src) => <option key={src} value={src}>{src}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
              <input type="number" required placeholder="e.g. 75000" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
              <input type="text" placeholder="e.g. Monthly salary payout" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Settled To (Bank Account)</label>
              <select value={linkedBankId} onChange={(e) => setLinkedBankId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                {bankOptions()}
              </select>
            </div>
            <div className="flex items-center pt-6 pl-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)}
                  className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
                <span className="text-xs font-semibold text-slate-600">Recurring income source</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs">
              Save Income Record
            </button>
          </div>
        </form>
      )}

      {/* Income History List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-slate-800 text-base">Income Records</h3>
          {(searchQuery || filterSource !== 'All' || startDateFilter || endDateFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setFilterSource('All'); setStartDateFilter(''); setEndDateFilter(''); }}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer">
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Search Keyword</label>
            <input type="text" placeholder="e.g. Salary, Milk, Payout..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Source Category</label>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden">
              <option value="All">All Sources</option>
              {SOURCES.map((src) => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-600" />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-600" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Recurring</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Settled To</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {income.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400 italic">No income entries recorded yet.</td></tr>
              ) : filteredIncome.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-400 italic">No income found matching the selected filters.</td></tr>
              ) : (
                filteredIncome.map((inc) =>
                  editingId === inc.id ? (
                    // ── EDIT ROW ──
                    <tr key={inc.id} className="bg-emerald-50/60 text-sm">
                      <td className="py-2 px-3">
                        <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={inputCls} />
                      </td>
                      <td className="py-2 px-3">
                        <select value={editSource} onChange={e => setEditSource(e.target.value)} className={inputCls}>
                          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editRecurring} onChange={e => setEditRecurring(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                          <span className="text-xs text-slate-600">Yes</span>
                        </label>
                      </td>
                      <td className="py-2 px-3">
                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                          min="1" step="0.01" className={inputCls} />
                      </td>
                      <td className="py-2 px-3">
                        <select value={editLinkedBankId} onChange={e => setEditLinkedBankId(e.target.value)} className={inputCls}>
                          {bankOptions(editLinkedBankId)}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)}
                          placeholder="Description" className={inputCls} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleSaveEdit(inc)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors" title="Save">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={cancelEdit}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer transition-colors" title="Cancel">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // ── VIEW ROW ──
                    <tr key={inc.id} className="text-sm hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-500">{inc.date}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {inc.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {inc.recurring
                          ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-100/40 px-2 py-0.5 rounded-md">Yes</span>
                          : <span className="text-xs text-slate-400">No</span>}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                        + ₹{inc.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        {inc.linkedBankId && getBankName(inc.linkedBankId) ? (
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {getBankName(inc.linkedBankId)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-xs truncate max-w-xs">{inc.description}</td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(inc)}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer" title="Edit income record">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteIncome(inc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer" title="Delete income record">
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {setPage && totalIncome > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 px-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 cursor-pointer transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-semibold font-mono">
              Page {page} of {Math.max(1, Math.ceil(totalIncome / limit))} ({totalIncome} records)
            </span>
            <button
              onClick={() => setPage(Math.min(Math.ceil(totalIncome / limit), page + 1))}
              disabled={page >= Math.ceil(totalIncome / limit)}
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
