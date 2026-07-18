import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, CreditCard, Pencil } from 'lucide-react';
import { Card, Bank } from '../types';
import { useDialog } from './DialogProvider';

interface CardsPanelProps {
  userId: string;
  cards: Card[];
  banks: Bank[];
  onRefreshData?: () => void;
}

export default function CardsPanel({ userId, cards, banks, onRefreshData }: CardsPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const [showAddForm, setShowAddForm] = useState(false);

  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<'Credit' | 'Debit'>('Credit');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currentOutstanding, setCurrentOutstanding] = useState('');
  const [statementBalance, setStatementBalance] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'Blocked' | 'Closed'>('Active');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  
  const [autoPay, setAutoPay] = useState(false);
  const [autoPaySourceId, setAutoPaySourceId] = useState('');

  // Pay Bill state
  const [payingCardId, setPayingCardId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBankId, setPayBankId] = useState('');

  // Generate Bill state
  const [generatingBillCardId, setGeneratingBillCardId] = useState<string | null>(null);
  const [genBillAmount, setGenBillAmount] = useState('');
  const [genBillDueDate, setGenBillDueDate] = useState('');

  const handleEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setCardName(card.cardName);
    setCardType(card.cardType);
    setCardNumber(card.cardNumber);
    setExpiryDate(card.expiryDate);
    setBankName(card.bankName);
    setCreditLimit(card.creditLimit?.toString() || '');
    setCurrentOutstanding(card.currentOutstanding?.toString() || '');
    setStatementBalance(card.statementBalance?.toString() || '');
    setStatementDate(card.statementDate || '');
    setDueDate(card.dueDate || '');
    setStatus(card.status);
    setAutoPay(card.autoPay || false);
    setAutoPaySourceId(card.autoPaySourceId || '');
    setEditingCardId(card.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setCardName('');
    setCardType('Credit');
    setCardNumber('');
    setExpiryDate('');
    setBankName('');
    setCreditLimit('');
    setCurrentOutstanding('');
    setStatementBalance('');
    setStatementDate('');
    setDueDate('');
    setStatus('Active');
    setAutoPay(false);
    setAutoPaySourceId('');
    setEditingCardId(null);
    setShowAddForm(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !bankName) {
      await showAlert('Please fill all required fields.', 'Error', 'error');
      return;
    }

    try {
      const cardData = {
        userId,
        cardName,
        cardType,
        cardNumber,
        expiryDate,
        bankName,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        currentOutstanding: currentOutstanding ? Number(currentOutstanding) : undefined,
        statementBalance: statementBalance ? Number(statementBalance) : undefined,
        statementDate,
        dueDate,
        status,
        autoPay,
        autoPaySourceId,
        createdAt: new Date().toISOString()
      };

      if (editingCardId) {
        await porulalarStore.updateRecord('cards', editingCardId, cardData);
      } else {
        await porulalarStore.addRecord('cards', cardData);
      }
      
      resetForm();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to save card details.', 'Error', 'error');
    }
  };

  const handleDeleteCard = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this card?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('cards', id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to delete card.', 'Error', 'error');
    }
  };

  const handlePayBillSubmit = async (e: React.FormEvent, card: Card) => {
    e.preventDefault();
    const amountToPay = Number(payAmount);
    if (!amountToPay || amountToPay <= 0) {
      await showAlert('Please enter a valid amount.', 'Error', 'error');
      return;
    }
    if (!payBankId) {
      await showAlert('Please select a bank account to pay from.', 'Error', 'error');
      return;
    }
    
    const bank = banks.find(b => b.id === payBankId);
    if (!bank) {
      await showAlert('Bank not found.', 'Error', 'error');
      return;
    }

    try {
      // Deduct from bank
      await porulalarStore.updateRecord('banks', bank.id, {
        currentBalance: increment(-amountToPay)
      });
      // Deduct from card outstanding
      await porulalarStore.updateRecord('cards', card.id, {
        currentOutstanding: increment(-amountToPay)
      });

      // Log as expense
      await porulalarStore.addRecord('expenses', {
        userId,
        date: new Date().toISOString().split('T')[0],
        category: 'Credit Card',
        subCategory: card.cardName,
        amount: amountToPay,
        paymentMethod: bank.bankName,
        description: `Credit card bill payment for ${card.cardName}`,
        tags: ['CC Payment'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setPayingCardId(null);
      setPayAmount('');
      if (onRefreshData) onRefreshData();
      await showAlert(`Successfully paid ₹${amountToPay.toLocaleString('en-IN')} towards ${card.cardName} bill from ${bank.bankName}.`, 'Payment Successful', 'info');
    } catch (err) {
      console.error(err);
      await showAlert('Failed to process payment.', 'Error', 'error');
    }
  };

  const handleGenerateBillSubmit = async (e: React.FormEvent, card: Card) => {
    e.preventDefault();
    const amountToGen = Number(genBillAmount);
    if (!amountToGen || amountToGen < 0) {
      await showAlert('Please enter a valid bill amount.', 'Error', 'error');
      return;
    }
    if (!genBillDueDate) {
      await showAlert('Please enter a valid due date.', 'Error', 'error');
      return;
    }

    try {
      await porulalarStore.updateRecord('cards', card.id, {
        statementBalance: amountToGen,
        dueDate: genBillDueDate
      });
      
      setGeneratingBillCardId(null);
      setGenBillAmount('');
      setGenBillDueDate('');
      if (onRefreshData) onRefreshData();
      await showAlert(`Successfully generated bill of ₹${amountToGen.toLocaleString('en-IN')} for ${card.cardName}.`, 'Bill Generated', 'info');
    } catch (err) {
      console.error(err);
      await showAlert('Failed to generate bill.', 'Error', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <CreditCard className="text-indigo-600 h-6 w-6" /> Card Details
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage your credit and debit cards.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" /> Add Card
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCard} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{editingCardId ? "Edit Card" : "Add New Card"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Card Nickname</label>
              <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="e.g. Amazon ICICI" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
              <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. ICICI Bank" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Card Type</label>
              <select value={cardType} onChange={e => setCardType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20">
                <option value="Credit">Credit Card</option>
                <option value="Debit">Debit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Card Number (Last 4)</label>
              <input type="text" required maxLength={4} value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="e.g. 1234" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            
            {cardType === 'Credit' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Credit Limit (₹)</label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="e.g. 100000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Current Outstanding (₹)</label>
                  <input type="number" value={currentOutstanding} onChange={e => setCurrentOutstanding(e.target.value)} placeholder="e.g. 15000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Generated Bill Amount</label>
                  <input type="number" value={statementBalance} onChange={e => setStatementBalance(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Statement Date (Day)</label>
                  <input type="text" value={statementDate} onChange={e => setStatementDate(e.target.value)} placeholder="e.g. 15th" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
                </div>
                <div className="col-span-full mt-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="cardAutoPay"
                      checked={autoPay}
                      onChange={(e) => setAutoPay(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="cardAutoPay" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Enable Auto Pay (auto-deduct on Due Date)
                    </label>
                  </div>
                  {autoPay && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Bank Account for Auto Debit</label>
                      <select
                        value={autoPaySourceId}
                        onChange={(e) => setAutoPaySourceId(e.target.value)}
                        required={autoPay}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">-- Select Bank Account --</option>
                        {banks && banks.length > 0 && (
                          <optgroup label="Bank Accounts">
                            {banks.map(b => (
                              <option key={b.id} value={b.id}>{b.bankName}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry (MM/YY)</label>
              <input type="text" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="e.g. 12/28" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20">
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end pt-2 gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">{editingCardId ? "Update Card" : "Save Card"}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No cards tracked</p>
          </div>
        ) : (
          cards.map(card => (
            <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                 <button onClick={() => handleEditCard(card)} className="p-1.5 bg-white/90 text-slate-500 hover:text-indigo-600 rounded-md shadow-xs" title="Edit Card"><Pencil className="h-3.5 w-3.5" /></button>
                 <button onClick={() => handleDeleteCard(card.id)} className="p-1.5 bg-white/90 text-slate-500 hover:text-rose-600 rounded-md shadow-xs" title="Delete Card"><Trash className="h-3.5 w-3.5" /></button>
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${card.cardType === 'Credit' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {card.cardType}
                  </div>
                  {card.status !== 'Active' && (
                    <div className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-[9px] font-bold uppercase tracking-wider">
                      {card.status}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-lg font-black text-slate-800">{card.cardName}</div>
                <div className="text-sm text-slate-500">{card.bankName}</div>
              </div>
              
              <div className="text-xl font-mono text-slate-700 mb-4 tracking-widest">
                •••• •••• •••• {card.cardNumber}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {card.cardType === 'Credit' && card.currentOutstanding !== undefined && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Outstanding</div>
                    <div className="font-bold text-rose-600">₹{card.currentOutstanding.toLocaleString('en-IN')}</div>
                  </div>
                )}
                {card.cardType === 'Credit' && card.creditLimit !== undefined && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Limit</div>
                    <div className="font-bold text-slate-700">₹{card.creditLimit.toLocaleString('en-IN')}</div>
                  </div>
                )}
                {card.expiryDate && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Valid Thru</div>
                    <div className="font-bold text-slate-700">{card.expiryDate}</div>
                  </div>
                )}
                {card.cardType === 'Credit' && card.statementBalance !== undefined && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Generated Bill</div>
                    <div className="font-bold text-slate-700">₹{card.statementBalance.toLocaleString('en-IN')}</div>
                  </div>
                )}
                {card.cardType === 'Credit' && card.dueDate && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Due Date</div>
                    <div className="font-bold text-slate-700">{card.dueDate}</div>
                  </div>
                )}
              </div>

              {card.cardType === 'Credit' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  {payingCardId === card.id ? (
                    <form onSubmit={(e) => handlePayBillSubmit(e, card)} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount to Pay</label>
                        <input type="number" required value={payAmount} onChange={e => setPayAmount(e.target.value)} max={card.currentOutstanding} min="1" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pay From Bank</label>
                        <select required value={payBankId} onChange={e => setPayBankId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20">
                          <option value="">Select Bank Account</option>
                          {banks.map(b => (
                            <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setPayingCardId(null)} className="flex-1 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">Confirm</button>
                      </div>
                    </form>
                  ) : generatingBillCardId === card.id ? (
                    <form onSubmit={(e) => handleGenerateBillSubmit(e, card)} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Generated Bill Amount</label>
                        <input type="number" required value={genBillAmount} onChange={e => setGenBillAmount(e.target.value)} min="0" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                        <input type="date" required value={genBillDueDate} onChange={e => setGenBillDueDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setGeneratingBillCardId(null)} className="flex-1 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">Save Bill</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setGeneratingBillCardId(card.id); setGenBillAmount(card.statementBalance?.toString() || card.currentOutstanding?.toString() || ''); setGenBillDueDate(card.dueDate || ''); setPayingCardId(null); }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Gen. Bill
                      </button>
                      {(card.currentOutstanding || 0) > 0 && (
                        <button 
                          onClick={() => { setPayingCardId(card.id); setPayAmount(card.statementBalance?.toString() || card.currentOutstanding?.toString() || ''); setPayBankId(banks.find(b => b.isPrimary)?.id || banks[0]?.id || ''); setGeneratingBillCardId(null); }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          Pay Bill
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
