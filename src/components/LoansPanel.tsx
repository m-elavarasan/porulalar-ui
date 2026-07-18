import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, Calendar, CalendarPlus, ShieldAlert, Award, Calculator, Info, Pencil } from 'lucide-react';
import { Loan, Bank, Card } from '../types';
import { createCalendarReminder } from '../lib/googleServices';
import { useDialog } from './DialogProvider';

interface LoansPanelProps {
  userId: string;
  loans: Loan[];
  banks: Bank[];
  cards?: Card[];
  accessToken: string | null;
  onRefreshData: () => void;
}

const LOAN_TYPES = ['Personal Loan', 'Education Loan', 'Home Loan', 'Vehicle Loan', 'Gold Loan', 'Other'];

export default function LoansPanel({ userId, loans, banks, cards, accessToken, onRefreshData }: LoansPanelProps) {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [loanName, setLoanName] = useState('');
  const [loanType, setLoanType] = useState('Personal Loan');
  const [lenderName, setLenderName] = useState('');
  const [borrowedAmount, setBorrowedAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanEndDate, setLoanEndDate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoPay, setAutoPay] = useState(false);
  const [autoPaySourceId, setAutoPaySourceId] = useState('');

  const [linkedBankId, setLinkedBankId] = useState('');
  const [transactionType, setTransactionType] = useState<'Credit' | 'Debit'>('Credit');

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [syncingStates, setSyncingStates] = useState<{ [id: string]: boolean }>({});
  const [prepaySourceIds, setPrepaySourceIds] = useState<{ [id: string]: string }>({});

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName || !borrowedAmount || !interestRate || !tenureMonths || !emiAmount) return;

    try {
      const nowStr = new Date().toISOString();
      const principal = Number(borrowedAmount);
      const tenure = Number(tenureMonths);
      const emi = Number(emiAmount);
      const rate = Number(interestRate);

      if (isNaN(principal) || principal <= 0 || isNaN(tenure) || tenure <= 0 || isNaN(emi) || emi <= 0 || isNaN(rate) || rate < 0) {
        await showAlert('Please enter valid numeric values for all fields.', 'Validation Error', 'error');
        return;
      }

      // Simple AI/Financial estimations:
      const totalAmtPayable = emi * tenure;
      const totalIntPayable = Math.max(0, totalAmtPayable - principal);

      const payload = {
        userId,
        loanName,
        loanType,
        lenderName: lenderName || 'Unspecified',
        borrowedAmount: principal,
        interestRate: rate,
        loanStartDate,
        loanEndDate: loanEndDate || new Date(new Date(loanStartDate).setMonth(new Date(loanStartDate).getMonth() + tenure)).toISOString().split('T')[0],
        tenureMonths: tenure,
        emiAmount: emi,
        totalInterestPayable: totalIntPayable,
        totalAmountPayable: totalAmtPayable,
        remainingEMIs: tenure,
        nextDueDate: nextDueDate || new Date(new Date(loanStartDate).setMonth(new Date(loanStartDate).getMonth() + 1)).toISOString().split('T')[0],
        notes,
        autoPay,
        autoPaySourceId,
      };

      if (editingLoanId) {
        await porulalarStore.updateRecord('loans', editingLoanId, payload);
      } else {
        await porulalarStore.addRecord('loans', {
          ...payload,
          amountPaidTillDate: 0,
          principalOutstanding: principal,
          prepayments: 0,
          status: 'Active',
          createdAt: nowStr
        });
      }

      if (!editingLoanId && linkedBankId && principal > 0) {
        const bank = banks.find(b => b.id === linkedBankId);
        if (bank) {
          const adjAmount = transactionType === 'Credit' ? principal : -principal;
          await porulalarStore.updateRecord('banks', bank.id, {
            currentBalance: (Number(bank.currentBalance) || 0) + adjAmount
          });
        }
      }

      resetForm();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setLoanName('');
    setLenderName('');
    setBorrowedAmount('');
    setInterestRate('');
    setTenureMonths('');
    setEmiAmount('');
    setNextDueDate('');
    setNotes('');
    setLinkedBankId('');
    setTransactionType('Credit');
    setAutoPay(false);
    setAutoPaySourceId('');
    setEditingLoanId(null);
    setShowAddForm(false);
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoanId(loan.id);
    setLoanName(loan.loanName);
    setLoanType(loan.loanType);
    setLenderName(loan.lenderName);
    setBorrowedAmount(loan.borrowedAmount.toString());
    setInterestRate(loan.interestRate.toString());
    setLoanStartDate(loan.loanStartDate);
    setLoanEndDate(loan.loanEndDate || '');
    setTenureMonths(loan.tenureMonths.toString());
    setEmiAmount(loan.emiAmount.toString());
    setNextDueDate(loan.nextDueDate || '');
    setNotes(loan.notes || '');
    setAutoPay(loan.autoPay || false);
    setAutoPaySourceId(loan.autoPaySourceId || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLoan = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this loan record?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('loans', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogPrepayment = async (loan: Loan) => {
    const sourceIdForLoan = prepaySourceIds[loan.id] || loan.autoPaySourceId || '';
    const bank = sourceIdForLoan ? banks.find(b => b.id === sourceIdForLoan) : null;
    const card = sourceIdForLoan ? cards?.find(c => c.id === sourceIdForLoan) : null;
    
    let sourceMsg = ' (no source deduction)';
    if (bank) sourceMsg = ` from ${bank.bankName}`;
    if (card) sourceMsg = ` via ${card.cardName}`;

    const amt = await showPrompt(`Enter amount to pay for ${loan.loanName} (Regular EMI is ₹${loan.emiAmount.toLocaleString('en-IN')})${sourceMsg}:`);
    if (!amt || isNaN(Number(amt))) return;
    const paidAmount = Number(amt);

    const confirmed = await showConfirm(`Confirm payment of ₹${paidAmount.toLocaleString('en-IN')} for ${loan.loanName}?`);
    if (!confirmed) return;

    try {
      const loanRef = loan.id;
      const updatedPaid = (loan.amountPaidTillDate || 0) + paidAmount;
      const updatedOutstanding = Math.max(0, (loan.principalOutstanding || loan.borrowedAmount) - paidAmount);
      const approxEmiNeeded = loan.emiAmount > 0 ? Math.ceil(updatedOutstanding / loan.emiAmount) : 0;

      await porulalarStore.updateRecord('loans', loan.id, {
        amountPaidTillDate: updatedPaid,
        principalOutstanding: updatedOutstanding,
        remainingEMIs: approxEmiNeeded,
      });

      if (bank) {
        await porulalarStore.updateRecord('banks', bank.id, {
          currentBalance: increment(-paidAmount)
        });
      }
      if (card) {
        await porulalarStore.updateRecord('cards', card.id, {
          currentOutstanding: increment(paidAmount)
        });
      }

      await porulalarStore.addRecord('expenses', {
        userId,
        date: new Date().toISOString().split('T')[0],
        category: 'EMI',
        subCategory: loan.loanName,
        amount: paidAmount,
        paymentMethod: bank ? bank.bankName : (card ? card.cardName : 'Bank Transfer'),
        description: `EMI payment for ${loan.loanName}`,
        tags: ['Loan EMI'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await showAlert(`Success! Logged prepayment. You saved approximately ₹${(paidAmount * (loan.interestRate / 100) * (approxEmiNeeded / 12)).toFixed(0)} in interest!`, 'Prepayment Logged', 'success');
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToCalendar = async (loan: Loan) => {
    if (!accessToken) {
      await showAlert('Please authenticate first to enable Google Calendar integrations!', 'Authentication Required', 'warning');
      return;
    }

    setSyncingStates((prev) => ({ ...prev, [loan.id]: true }));
    try {
      const summary = `EMI Due: ${loan.loanName}`;
      const description = `Monthly EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} for your ${loan.loanType} with ${loan.lenderName} is due. Principal remaining: ₹${loan.principalOutstanding.toLocaleString('en-IN')}`;
      
      const res = await createCalendarReminder(accessToken, summary, description, loan.nextDueDate);
      if (res.success) {
        await showAlert(`Successfully synced EMI reminders to Google Calendar for ${loan.nextDueDate}! Reminders set at 7 days, 3 days, 1 day, and on the due date.`, 'Sync Successful', 'success');
      } else {
        await showAlert('Failed to sync: ' + res.error, 'Sync Failed', 'error');
      }
    } catch (err: any) {
      await showAlert('Sync failed: ' + err.message, 'Sync Failed', 'error');
    } finally {
      setSyncingStates((prev) => ({ ...prev, [loan.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex justify-end">
        <button
          onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          id="btn-add-loan"
        >
          <Plus className="h-4.5 w-4.5" /> Add Active Loan
        </button>
      </div>

      {/* Add Loan Form */}
      {showAddForm && (
        <form onSubmit={handleAddLoan} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <Calculator className="text-indigo-500 h-5 w-5" /> {editingLoanId ? "Edit Loan Account" : "Track New Loan Account"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Loan Name</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Home Loan"
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              >
                {LOAN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Lender / Bank</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, SBI"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Borrowed Principal (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 1500000"
                value={borrowedAmount}
                onChange={(e) => setBorrowedAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Interest Rate (% p.a.)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 8.4"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tenure (Months)</label>
              <input
                type="number"
                required
                placeholder="e.g. 120"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly EMI (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 18500"
                value={emiAmount}
                onChange={(e) => setEmiAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={loanStartDate}
                onChange={(e) => setLoanStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Next EMI Due Date</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
              <input
                type="text"
                placeholder="Any special remarks"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="mt-2 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Auto Pay Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoPay"
                  checked={autoPay}
                  onChange={(e) => setAutoPay(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="autoPay" className="text-xs font-semibold text-slate-700">
                  Enable Auto Pay (auto-deduct on Due Date)
                </label>
              </div>
              {autoPay && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Bank for Auto Debit</label>
                  <select
                    value={autoPaySourceId}
                    onChange={(e) => setAutoPaySourceId(e.target.value)}
                    required={autoPay}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Choose Source --</option>
                    <optgroup label="Banks">
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                      ))}
                    </optgroup>
                    {cards && cards.length > 0 && (
                      <optgroup label="Credit Cards">
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>{c.cardName} (Out: ₹{(Number(c.currentOutstanding) || 0).toLocaleString()})</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          {!editingLoanId && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 mb-3">Linked Bank Account (Initial Receipt/Payment)</div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Bank</label>
                  <select value={linkedBankId} onChange={(e) => setLinkedBankId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500/20">
                    <option value="">-- No Bank Linked --</option>
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                {linkedBankId && (
                  <div className="flex gap-2 pb-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={transactionType === 'Credit'} onChange={() => setTransactionType('Credit')} className="text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-xs font-semibold text-slate-600">Credit to Bank</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={transactionType === 'Debit'} onChange={() => setTransactionType('Debit')} className="text-rose-600 focus:ring-rose-500" />
                      <span className="text-xs font-semibold text-slate-600">Debit from Bank</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-2 gap-3">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md cursor-pointer">
              {editingLoanId ? "Update Loan" : "Save Loan"}
            </button>
          </div>
        </form>
      )}

      {/* Loan Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 italic">
            No active loan accounts found. Track loans here to forecast liabilities and calculate net worth.
          </div>
        ) : (
          loans.map((loan) => {
            const outstanding = loan.principalOutstanding ?? loan.borrowedAmount;
            const progress = ((loan.borrowedAmount - outstanding) / loan.borrowedAmount) * 100;
            const approxRemainingInterest = (outstanding * (loan.interestRate / 100) * (loan.remainingEMIs / 12));

            return (
              <div key={loan.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col space-y-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {loan.loanType}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{loan.loanName}</h3>
                    <p className="text-xs text-slate-400">Lender: <span className="text-slate-600 font-medium">{loan.lenderName}</span></p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLogPrepayment(loan)}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all cursor-pointer"
                      title="Log Prepayment"
                    >
                      Prepay
                    </button>
                    <button
                      onClick={() => handleSyncToCalendar(loan)}
                      disabled={syncingStates[loan.id]}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-all border border-slate-100 cursor-pointer"
                      title="Sync EMI to Google Calendar"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditLoan(loan)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Edit loan"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLoan(loan.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete loan"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Bank/Card selection for prepayment */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deduct prepayment from Source</label>
                  <select value={prepaySourceIds[loan.id] || loan.autoPaySourceId || ''} onChange={e => setPrepaySourceIds(prev => ({ ...prev, [loan.id]: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">-- No source deduction --</option>
                    {banks && banks.length > 0 && (
                      <optgroup label="Banks">
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} (₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                        ))}
                      </optgroup>
                    )}
                    {cards && cards.length > 0 && (
                      <optgroup label="Credit Cards">
                        {cards.filter(c => c.cardType === 'Credit').map(c => (
                          <option key={c.id} value={c.id}>{c.cardName} (₹{(Number(c.currentOutstanding) || 0).toLocaleString()})</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Progress bar of loan repayment */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Repayment Progress</span>
                    <span className="font-bold text-slate-700">{progress.toFixed(1)}% Paid</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Core metrics grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Borrowed Amount</span>
                    <span className="font-bold text-slate-800 text-sm">₹{loan.borrowedAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Outstanding Principal</span>
                    <span className="font-bold text-rose-600 text-sm">₹{outstanding.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Interest Rate</span>
                    <span className="font-bold text-slate-700">{loan.interestRate}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Monthly EMI</span>
                    <span className="font-bold text-slate-800">₹{loan.emiAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Remaining EMIs</span>
                    <span className="font-bold text-slate-700">{loan.remainingEMIs} Months</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Estimated Remaining Interest</span>
                    <span className="font-bold text-amber-600">₹{approxRemainingInterest.toFixed(0)}</span>
                  </div>
                </div>

                {/* Next due notification bar */}
                <div className="flex items-center gap-2 text-xs bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-slate-600">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <div>
                    Next EMI Due on <span className="font-bold text-slate-800">{loan.nextDueDate}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {loan.autoPay && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      Auto Pay Active
                    </div>
                  )}
                  {loan.prepayments > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                      <Award className="h-3.5 w-3.5 shrink-0" />
                      Prepayments logged: ₹{loan.prepayments.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
