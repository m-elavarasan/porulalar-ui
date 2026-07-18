import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Handshake, ArrowUpRight, ArrowDownRight, Pencil, Trash, Check } from 'lucide-react';
import { Borrow, Bank, Card } from '../types';
import { useDialog } from './DialogProvider';

interface BorrowPanelProps {
  userId: string;
  borrows: Borrow[];
  banks: Bank[];
  cards?: Card[];
  onRefreshData?: () => void;
}

export default function BorrowPanel({ userId, borrows, banks, cards, onRefreshData }: BorrowPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterTab, setFilterTab] = useState<'Active' | 'Settled' | 'All'>('Active');

  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'Credit' | 'Debit'>('Credit');
  const [linkedBankId, setLinkedBankId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Split Bill States
  const [showSplitForm, setShowSplitForm] = useState(false);
  const [splitAmount, setSplitAmount] = useState('');
  const [splitDescription, setSplitDescription] = useState('');
  const [splitFriends, setSplitFriends] = useState('');
  const [splitBankId, setSplitBankId] = useState('');

  const handleSplitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitAmount || !splitDescription || !splitFriends || !splitBankId) {
      await showAlert('Please fill all split bill fields.', 'Error', 'error');
      return;
    }

    const totalAmt = Number(splitAmount);
    if (isNaN(totalAmt) || totalAmt <= 0) {
      await showAlert('Please enter a valid amount.', 'Error', 'error');
      return;
    }

    const friendsList = splitFriends.split(',').map(name => name.trim()).filter(Boolean);
    if (friendsList.length === 0) {
      await showAlert('Please enter at least one friend name.', 'Error', 'error');
      return;
    }

    const totalPeople = friendsList.length + 1; // friends + you
    const shareSize = Math.round((totalAmt / totalPeople) * 100) / 100;

    try {
      const bank = banks.find(b => b.id === splitBankId);
      if (bank) {
        await porulalarStore.updateRecord('banks', bank.id, {
          currentBalance: (Number(bank.currentBalance) || 0) - totalAmt
        });
      }

      await porulalarStore.addRecord('expenses', {
        userId,
        date: new Date().toISOString().split('T')[0],
        category: 'Food & Dining',
        subCategory: 'Split Bill Share',
        amount: shareSize,
        paymentMethod: bank ? bank.bankName : 'UPI',
        description: `${splitDescription} (My Share)`,
        tags: ['Split Bill'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      for (const friend of friendsList) {
        await porulalarStore.addRecord('borrows', {
          userId,
          personName: friend,
          amount: shareSize,
          transactionType: 'Debit',
          linkedBankId: splitBankId,
          date: new Date().toISOString().split('T')[0],
          notes: `Split Bill: ${splitDescription}`,
          status: 'Active',
          amountSettled: 0,
          createdAt: new Date().toISOString()
        });
      }

      setSplitAmount('');
      setSplitDescription('');
      setSplitFriends('');
      setSplitBankId('');
      setShowSplitForm(false);
      
      if (onRefreshData) onRefreshData();
      await showAlert(`Bill of ₹${totalAmt.toLocaleString('en-IN')} split successfully! Your share: ₹${shareSize.toLocaleString('en-IN')}. Friends will show in Lent section.`, 'Split Successful', 'success');
    } catch (e) {
      console.error(e);
      await showAlert('Failed to split bill.', 'Error', 'error');
    }
  };

  const [editingBorrowId, setEditingBorrowId] = useState<string | null>(null);
  const [settleBorrowId, setSettleBorrowId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleSourceId, setSettleSourceId] = useState('');

  const resetForm = () => {
    setPersonName('');
    setAmount('');
    setTransactionType('Credit');
    setLinkedBankId('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setEditingBorrowId(null);
    setShowAddForm(false);
  };

  const handleEditBorrow = (b: Borrow) => {
    setEditingBorrowId(b.id);
    setPersonName(b.personName);
    setAmount(b.amount.toString());
    setTransactionType(b.transactionType);
    setLinkedBankId(b.linkedBankId);
    setDate(b.date);
    setNotes(b.notes || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBorrow = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this record?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('borrows', id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to delete.', 'Error', 'error');
    }
  };

  const handleAddBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount || !linkedBankId) {
      await showAlert('Please fill all required fields.', 'Error', 'error');
      return;
    }

    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      await showAlert('Please enter a valid amount.', 'Error', 'error');
      return;
    }

    try {
      if (!editingBorrowId) {
        const bank = banks.find(b => b.id === linkedBankId);
        if (bank) {
          // Debit (Lent) = subtract from bank. Credit (Borrowed) = add to bank.
          const adjAmount = transactionType === 'Credit' ? numAmt : -numAmt;
          await porulalarStore.updateRecord('banks', bank.id, {
            currentBalance: (Number(bank.currentBalance) || 0) + adjAmount
          });
        }
      }

      const borrowData = {
        userId,
        personName,
        amount: numAmt,
        transactionType,
        linkedBankId,
        date,
        notes,
      };

      if (editingBorrowId) {
        await porulalarStore.updateRecord('borrows', editingBorrowId, borrowData);
      } else {
        await porulalarStore.addRecord('borrows', {
          ...borrowData,
          status: 'Active',
          amountSettled: 0,
          createdAt: new Date().toISOString()
        });
      }

      resetForm();
      if (onRefreshData) onRefreshData();
      await showAlert(editingBorrowId ? 'Transaction updated!' : 'Transaction logged successfully!', 'Success', 'success');
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to save transaction.', 'Error', 'error');
    }
  };

  const handleSettleSubmit = async (b: Borrow) => {
    if (!settleAmount || !settleSourceId) {
      await showAlert('Please enter amount and select a source.', 'Error', 'error');
      return;
    }
    const amt = Number(settleAmount);
    const outstanding = b.amount - (b.amountSettled || 0);
    
    if (isNaN(amt) || amt <= 0 || amt > outstanding) {
      await showAlert('Please enter a valid amount up to the outstanding balance.', 'Error', 'error');
      return;
    }

    try {
      const bank = banks.find(bank => bank.id === settleSourceId);
      const card = cards?.find(c => c.id === settleSourceId);

      // If we borrowed (Credit), we are paying back (subtract from our bank/card).
      // If we lent (Debit), they are paying us back (add to our bank).
      if (bank) {
        const adjAmount = b.transactionType === 'Credit' ? -amt : amt;
        await porulalarStore.updateRecord('banks', bank.id, {
          currentBalance: increment(adjAmount)
        });
      } else if (card) {
        const adjAmount = b.transactionType === 'Credit' ? amt : -amt;
        await porulalarStore.updateRecord('cards', card.id, {
          currentOutstanding: increment(adjAmount)
        });
      }

      const newSettled = (b.amountSettled || 0) + amt;
      const status = newSettled >= b.amount ? 'Settled' : 'Active';

      await porulalarStore.updateRecord('borrows', b.id, {
        amountSettled: newSettled,
        status
      });

      setSettleBorrowId(null);
      setSettleAmount('');
      setSettleSourceId('');
      if (onRefreshData) onRefreshData();
      await showAlert('Payment logged successfully.', 'Success', 'success');
    } catch (err) {
      console.error(err);
      await showAlert('Failed to settle transaction.', 'Error', 'error');
    }
  };

  const initiateSettle = (b: Borrow) => {
    setSettleBorrowId(b.id);
    const outstanding = b.amount - (b.amountSettled || 0);
    setSettleAmount(outstanding.toString());
    setSettleSourceId(b.linkedBankId);
  };

  const filteredBorrows = filterTab === 'All'
    ? borrows
    : borrows.filter(b => b.status === filterTab);
  const youOwe = filteredBorrows.filter(b => b.transactionType === 'Credit');
  const owedToYou = filteredBorrows.filter(b => b.transactionType === 'Debit');

  const youOweTotal = filteredBorrows.filter(b => b.transactionType === 'Credit').reduce((sum, b) => sum + b.amount, 0);
  const owedToYouTotal = filteredBorrows.filter(b => b.transactionType === 'Debit').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Handshake className="text-indigo-600 h-6 w-6" /> Borrow & Lend
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track money you owe friends or money owed to you.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSplitForm(!showSplitForm); setShowAddForm(false); }}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all border border-indigo-100 flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            Split a Bill
          </button>
          <button
            onClick={() => { resetForm(); setShowAddForm(!showAddForm); setShowSplitForm(false); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> Log Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-rose-700 font-bold mb-1">
            <ArrowDownRight className="h-5 w-5" /> You Owe
          </div>
          <div className="text-2xl font-black text-rose-800">-₹{youOweTotal.toLocaleString('en-IN')}</div>
          <p className="text-xs text-rose-600/80 mt-1">Total money borrowed from others.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
            <ArrowUpRight className="h-5 w-5" /> Owed To You
          </div>
          <div className="text-2xl font-black text-emerald-800">₹{owedToYouTotal.toLocaleString('en-IN')}</div>
          <p className="text-xs text-emerald-600/80 mt-1">Total money you lent to others.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {(['Active', 'Settled', 'All'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              filterTab === tab
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab === 'All' ? 'All Records' : tab}
            <span className="ml-1 text-[10px] opacity-70">
              ({tab === 'All' ? borrows.length : borrows.filter(b => b.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {showSplitForm && (
        <form onSubmit={handleSplitBill} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-md space-y-4 animate-fade-in text-left">
          <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Split a Bill</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total Bill Amount (₹)</label>
              <input 
                type="number" 
                required 
                value={splitAmount} 
                onChange={e => setSplitAmount(e.target.value)} 
                placeholder="e.g. 3000" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bill Description</label>
              <input 
                type="text" 
                required 
                value={splitDescription} 
                onChange={e => setSplitDescription(e.target.value)} 
                placeholder="e.g. Dinner Party" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Paid From Account</label>
              <select 
                required 
                value={splitBankId} 
                onChange={e => setSplitBankId(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select Account</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Split With Friends (Comma-separated Names)</label>
              <input 
                type="text" 
                required 
                value={splitFriends} 
                onChange={e => setSplitFriends(e.target.value)} 
                placeholder="e.g. Alice, Bob, Charlie" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" 
              />
              <span className="text-[10px] text-slate-400 font-bold block mt-1">The bill will be split equally among you and all listed friends. It will create Lent records for them.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowSplitForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">Split Bill Now</button>
          </div>
        </form>
      )}

      {showAddForm && (
        <form onSubmit={handleAddBorrow} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{editingBorrowId ? 'Edit Transaction' : 'Log New Transaction'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Transaction Type</label>
              <select value={transactionType} onChange={e => setTransactionType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20">
                <option value="Credit">I Borrowed Money (Got Paid)</option>
                <option value="Debit">I Lent Money (Paid Someone)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Person's Name</label>
              <input type="text" required value={personName} onChange={e => setPersonName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
              <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Bank Account</label>
              <select required value={linkedBankId} onChange={e => setLinkedBankId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select Bank Account</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (Optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. For dinner" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">{editingBorrowId ? 'Update' : 'Save Transaction'}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-rose-500" /> You Owe (Borrowed)</h3>
          <div className="space-y-3">
            {youOwe.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">No active borrowings.</div>
            ) : (
              youOwe.map(b => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-800">{b.personName}</div>
                      <div className="text-right">
                        <div className="font-black text-rose-600">-₹{b.amount.toLocaleString('en-IN')}</div>
                        {b.amountSettled > 0 && <div className="text-[10px] text-emerald-600 font-bold">Paid: ₹{b.amountSettled.toLocaleString('en-IN')}</div>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                      {b.date}
                      {b.notes ? ` • ${b.notes}` : ''}
                      {b.status === 'Settled' && <span className="ml-2 text-emerald-600 font-semibold">• Settled</span>}
                    </div>
                  </div>
                  {b.status === 'Active' && settleBorrowId !== b.id && (
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-50">
                      <button onClick={() => initiateSettle(b)} className="flex-1 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-100">Settle / Pay</button>
                      <button onClick={() => handleEditBorrow(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteBorrow(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash className="h-4 w-4" /></button>
                    </div>
                  )}
                  {settleBorrowId === b.id && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payback Amount</label>
                        <input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} placeholder="Amount" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-rose-500/20 outline-hidden" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Account</label>
                        <select value={settleSourceId} onChange={e => setSettleSourceId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-rose-500/20 outline-hidden">
                          <option value="">Select Account</option>
                          <optgroup label="Banks">
                            {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.bankName} (Bal: ₹{(Number(bank.currentBalance) || 0).toLocaleString()})</option>)}
                          </optgroup>
                          {cards && cards.length > 0 && (
                            <optgroup label="Credit Cards">
                              {cards.map(card => <option key={card.id} value={card.id}>{card.cardName} (Out: ₹{(Number(card.currentOutstanding) || 0).toLocaleString()})</option>)}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSettleBorrowId(null)} className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer">Cancel</button>
                        <button onClick={() => handleSettleSubmit(b)} className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Confirm</button>
                      </div>
                    </div>
                  )}
                  {b.status === 'Settled' && (
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="flex-1 py-1.5 mt-auto text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100 text-center">Settled</div>
                      <button onClick={() => handleDeleteBorrow(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-emerald-500" /> Owed To You (Lent)</h3>
          <div className="space-y-3">
            {owedToYou.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">No active lendings.</div>
            ) : (
              owedToYou.map(b => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-800">{b.personName}</div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">₹{b.amount.toLocaleString('en-IN')}</div>
                        {b.amountSettled > 0 && <div className="text-[10px] text-emerald-600 font-bold">Received: ₹{b.amountSettled.toLocaleString('en-IN')}</div>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                      {b.date}
                      {b.notes ? ` • ${b.notes}` : ''}
                      {b.status === 'Settled' && <span className="ml-2 text-emerald-600 font-semibold">• Settled</span>}
                    </div>
                  </div>
                  {b.status === 'Active' && settleBorrowId !== b.id && (
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-50">
                      <button onClick={() => initiateSettle(b)} className="flex-1 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-100">Settle / Got Paid</button>
                      <button onClick={() => handleEditBorrow(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteBorrow(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash className="h-4 w-4" /></button>
                    </div>
                  )}
                  {settleBorrowId === b.id && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Received Amount</label>
                        <input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} placeholder="Amount" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-hidden" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Account</label>
                        <select value={settleSourceId} onChange={e => setSettleSourceId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-hidden">
                          <option value="">Select Account</option>
                          <optgroup label="Banks">
                            {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.bankName} (Bal: ₹{(Number(bank.currentBalance) || 0).toLocaleString()})</option>)}
                          </optgroup>
                          {cards && cards.length > 0 && (
                            <optgroup label="Credit Cards">
                              {cards.map(card => <option key={card.id} value={card.id}>{card.cardName} (Out: ₹{(Number(card.currentOutstanding) || 0).toLocaleString()})</option>)}
                            </optgroup>
                          )}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSettleBorrowId(null)} className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer">Cancel</button>
                        <button onClick={() => handleSettleSubmit(b)} className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Confirm</button>
                      </div>
                    </div>
                  )}
                  {b.status === 'Settled' && (
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="flex-1 py-1.5 mt-auto text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100 text-center">Settled</div>
                      <button onClick={() => handleDeleteBorrow(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
