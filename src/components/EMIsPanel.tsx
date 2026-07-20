import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, Info, X, CheckCircle, ChevronDown, ChevronUp, Briefcase, CreditCard, Box, Calendar, Pencil, Landmark } from 'lucide-react';
import { EMI, Bank, Card } from '../types';
import { useDialog } from './DialogProvider';

interface EMIsPanelProps {
  userId: string;
  emis: EMI[];
  banks?: Bank[];
  cards?: Card[];
  onRefreshData?: () => void;
  accessToken?: string | null;
}

export default function EMIsPanel({ userId, emis, banks, cards, onRefreshData }: EMIsPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedEmiId, setExpandedEmiId] = useState<string | null>(null);

  const [itemName, setItemName] = useState('');
  const [financier, setFinancier] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [monthsPaid, setMonthsPaid] = useState('0');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState('');
  const [processingFee, setProcessingFee] = useState('');
  const [editingEmiId, setEditingEmiId] = useState<string | null>(null);
  const [autoPay, setAutoPay] = useState(false);
  const [autoPaySourceId, setAutoPaySourceId] = useState('');

  // Local state for 'pay 1 month' bank/card selection
  const [payEmiSourceIds, setPayEmiSourceIds] = useState<Record<string, string>>({});

  const activeEmis = emis.filter(e => e.status === 'Active');
  const completedEmis = emis.filter(e => e.status === 'Completed');

  const totalEmiMonthly = activeEmis.reduce((sum, e) => sum + e.emiAmount, 0);
  const totalOutstanding = activeEmis.reduce((sum, e) => sum + (e.emiAmount * Math.max(0, e.totalMonths - e.monthsPaid)), 0);

  
  const handleEditEmi = (emi: EMI) => {
    setEditingEmiId(emi.id);
    setItemName(emi.itemName);
    setFinancier(emi.financier);
    setTotalAmount(emi.totalAmount.toString());
    setEmiAmount(emi.emiAmount.toString());
    setTotalMonths(emi.totalMonths.toString());
    setMonthsPaid(emi.monthsPaid.toString());
    setStartDate(emi.startDate);
    setNextDueDate(emi.nextDueDate);
    setProcessingFee(emi.processingFee?.toString() || '');
    setAutoPay(emi.autoPay || false);
    setAutoPaySourceId(emi.autoPaySourceId || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddEmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !financier || !totalAmount || !emiAmount || !totalMonths) {
      await showAlert('Please fill all required fields.', 'Error', 'error');
      return;
    }

    try {
      const emiData = {
        userId,
        itemName,
        financier,
        totalAmount: Number(totalAmount),
        emiAmount: Number(emiAmount),
        totalMonths: Number(totalMonths),
        monthsPaid: Number(monthsPaid),
        startDate,
        nextDueDate: nextDueDate || startDate,
        status: 'Active',
        notes: '',
        autoPay,
        autoPaySourceId,
        processingFee: processingFee ? Number(processingFee) : 0,
        createdAt: new Date().toISOString()
      };
      if (editingEmiId) {
        await porulalarStore.updateRecord('emis', editingEmiId, {
          itemName, financier, totalAmount: Number(totalAmount),
          emiAmount: Number(emiAmount), totalMonths: Number(totalMonths),
          monthsPaid: Number(monthsPaid), startDate,
          nextDueDate: nextDueDate || startDate,
          autoPay,
          autoPaySourceId,
          processingFee: processingFee ? Number(processingFee) : 0,
        });
      } else {
        await porulalarStore.addRecord('emis', emiData);
      }
      
      setShowAddForm(false);
      setEditingEmiId(null);
      setItemName('');
      setFinancier('');
      setTotalAmount('');
      setEmiAmount('');
      setTotalMonths('');
      setMonthsPaid('0');
      setProcessingFee('');
      setEditingEmiId(null);
      setAutoPay(false);
      setAutoPaySourceId('');
      
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to add EMI.', 'Error', 'error');
    }
  };

  const handlePayEmi = async (emi: EMI) => {
    const sourceIdForEmi = payEmiSourceIds[emi.id] || emi.autoPaySourceId || '';
    const bank = sourceIdForEmi ? banks?.find(b => b.id === sourceIdForEmi) : null;
    const card = sourceIdForEmi ? cards?.find(c => c.id === sourceIdForEmi) : null;
    
    let sourceMsg = ' (no source deduction)';
    if (bank) sourceMsg = ` from ${bank.bankName}`;
    if (card) sourceMsg = ` via ${card.cardName}`;

    const confirmed = await showConfirm(`Mark 1 month paid for ${emi.itemName}? (₹${emi.emiAmount.toLocaleString('en-IN')})${sourceMsg}`);
    if (!confirmed) return;

    try {
      const newMonthsPaid = emi.monthsPaid + 1;
      
      // Calculate new due date (advance by 1 month)
      const currentDue = new Date(emi.nextDueDate || emi.startDate);
      currentDue.setMonth(currentDue.getMonth() + 1);
      const newNextDueDate = currentDue.toISOString().split('T')[0];
      
      const updates: any = { 
        monthsPaid: newMonthsPaid,
        nextDueDate: newNextDueDate
      };
      
      // Auto complete if tenure reached
      if (newMonthsPaid >= emi.totalMonths) {
        updates.status = 'Completed';
      }

      await porulalarStore.updateRecord('emis', emi.id, updates);

      // Deduct from bank or add to card if selected
      if (bank) {
        await porulalarStore.updateRecord('banks', bank.id, {
          currentBalance: increment(-emi.emiAmount)
        });
      }
      if (card) {
        await porulalarStore.updateRecord('cards', card.id, {
          currentOutstanding: increment(emi.emiAmount)
        });
      }

      // Add to expenses automatically
      await porulalarStore.addRecord('expenses', {
        userId,
        date: new Date().toISOString().split('T')[0],
        category: 'EMI',
        subCategory: emi.itemName,
        amount: emi.emiAmount,
        paymentMethod: bank ? bank.bankName : (card ? card.cardName : (emi.financier || 'Unknown')),
        description: `Monthly EMI payment for ${emi.itemName}`,
        tags: ['EMI'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await showAlert('EMI marked as paid and added to Expenses.', 'Success', 'success');
      setPayEmiSourceIds(prev => ({ ...prev, [emi.id]: '' }));
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to process EMI payment.', 'Error', 'error');
    }
  };

  const handleDeleteEmi = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this EMI record entirely?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('emis', id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to delete EMI.', 'Error', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Box className="h-6 w-6 text-indigo-500" /> My EMIs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track products, devices, and purchases on EMI.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? 'Cancel' : 'New EMI'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Monthly EMI Outgo</div>
          <div className="text-2xl font-black font-mono text-indigo-700">₹{totalEmiMonthly.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Total Outstanding</div>
          <div className="text-2xl font-black font-mono text-rose-700">₹{totalOutstanding.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddEmi} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{editingEmiId ? "Edit EMI" : "Add New EMI"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Item Name</label>
              <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. iPhone 15 Pro" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Financier / Card</label>
              <input type="text" required value={financier} onChange={e => setFinancier(e.target.value)} placeholder="e.g. HDFC Credit Card" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total Cost (₹)</label>
              <input type="number" step="0.01" required min="0" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="e.g. 135000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly EMI (₹)</label>
              <input type="number" step="0.01" required min="1" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="e.g. 15000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Processing Fee (₹)</label>
              <input type="number" step="0.01" min="0" value={processingFee} onChange={e => setProcessingFee(e.target.value)} placeholder="e.g. 500" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total Tenure (Months)</label>
              <input type="number" required min="1" value={totalMonths} onChange={e => setTotalMonths(e.target.value)} placeholder="e.g. 9" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Months Already Paid</label>
              <input type="number" required min="0" value={monthsPaid} onChange={e => setMonthsPaid(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Next Due Date</label>
              <input type="date" required value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-slate-100 gap-4">
            <div className="flex items-center gap-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoPayEmi" checked={autoPay} onChange={e => setAutoPay(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                <label htmlFor="autoPayEmi" className="text-sm text-slate-700 font-semibold cursor-pointer">Enable Auto Pay</label>
              </div>
              {autoPay && (
                <div className="flex-1">
                  <select
                    value={autoPaySourceId}
                    onChange={(e) => setAutoPaySourceId(e.target.value)}
                    required={autoPay}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Auto Pay Source --</option>
                    {banks && banks.length > 0 && (
                      <optgroup label="Bank Accounts">
                        {banks.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName}</option>
                        ))}
                      </optgroup>
                    )}
                    {cards && cards.length > 0 && (
                      <optgroup label="Credit Cards">
                        {cards.filter(c => c.cardType === 'Credit').map(c => (
                          <option key={c.id} value={c.id}>{c.cardName}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md whitespace-nowrap">{editingEmiId ? "Update EMI" : "Save EMI"}</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {emis.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
            <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No EMIs tracked</p>
          </div>
        ) : (
          emis.map(emi => {
            const isExpanded = expandedEmiId === emi.id;
            const progress = emi.totalMonths > 0 ? (emi.monthsPaid / emi.totalMonths) * 100 : 0;
            const outstanding = emi.emiAmount * Math.max(0, emi.totalMonths - emi.monthsPaid);

            return (
              <div key={emi.id} className={`bg-white rounded-2xl border ${emi.status === 'Completed' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200'} p-5 shadow-xs transition-all hover:shadow-md`}>
                <div 
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedEmiId(isExpanded ? null : emi.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${emi.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Box className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-lg">{emi.itemName}</span>
                        {emi.status === 'Completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Paid Off
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <CreditCard className="h-4 w-4" /> {emi.financier}
                      </div>
                      {emi.processingFee !== undefined && emi.processingFee > 0 && (
                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          Proc. Fee: ₹{emi.processingFee.toLocaleString('en-IN')}
                        </div>
                      )}
                      {emi.autoPay && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5 w-max">
                          <CheckCircle className="h-3 w-3" /> Auto Pay
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly EMI</div>
                      <div className="text-xl font-black font-mono text-slate-800">
                        ₹{emi.emiAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                    <span>{emi.monthsPaid} Months Paid</span>
                    <span>{emi.totalMonths} Total Months</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full ${emi.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    ></div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 pt-5 border-t border-slate-100 animate-fade-in space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Cost</div>
                        <div className="text-sm font-bold text-slate-700 font-mono">₹{emi.totalAmount.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</div>
                        <div className="text-sm font-bold text-rose-600 font-mono">₹{outstanding.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</div>
                        <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {emi.startDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Due</div>
                        <div className="text-sm font-bold text-indigo-600 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" /> {emi.nextDueDate}
                        </div>
                      </div>
                    </div>

                    {emi.status === 'Active' && ((banks && banks.length > 0) || (cards && cards.length > 0)) && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Source</label>
                        <select value={payEmiSourceIds[emi.id] || emi.autoPaySourceId || ''} onChange={e => setPayEmiSourceIds(prev => ({ ...prev, [emi.id]: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500">
                          <option value="">-- No source deduction --</option>
                          {banks && banks.length > 0 && (
                            <optgroup label="Bank Accounts (Auto-Deduct)">
                              {banks.map(b => (
                                <option key={b.id} value={b.id}>{b.bankName} (₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                              ))}
                            </optgroup>
                          )}
                          {cards && cards.length > 0 && (
                            <optgroup label="Credit Cards (Auto-Add to Bill)">
                              {cards.filter(c => c.cardType === 'Credit').map(c => (
                                <option key={c.id} value={c.id}>{c.cardName} (Limit: ₹{c.creditLimit?.toLocaleString()})</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {emi.status === 'Active' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePayEmi(emi); }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" /> Log Month Paid
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditEmi(emi); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Edit EMI"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteEmi(emi.id); }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete EMI"
                      >
                        <Trash className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
