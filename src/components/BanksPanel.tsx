import { porulalarStore, increment } from '../lib/store';
import React, { useState } from 'react';
import { Plus, Trash, CheckCircle, Landmark, WalletCards, Pencil, Building2, ArrowRightLeft } from 'lucide-react';
import { Bank } from '../types';
import { useDialog } from './DialogProvider';

interface BanksPanelProps {
  userId: string;
  banks: Bank[];
  onRefreshData?: () => void;
}

export default function BanksPanel({ userId, banks, onRefreshData }: BanksPanelProps) {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [showAddForm, setShowAddForm] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [accountNumber, setAccountNumber] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // Account Aggregator States
  const [showAaModal, setShowAaModal] = useState(false);
  const [aaStep, setAaStep] = useState<'input' | 'otp' | 'success'>('input');
  const [aaPhoneNumber, setAaPhoneNumber] = useState('');
  const [aaBankName, setAaBankName] = useState('HDFC Bank');
  const [aaConsentId, setAaConsentId] = useState('');
  const [aaOtp, setAaOtp] = useState('');
  const [isLinkingAa, setIsLinkingAa] = useState(false);

  const handleInitiateAAConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aaPhoneNumber) return;

    setIsLinkingAa(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = localStorage.getItem('porulalar_access_token');
      const res = await fetch(`${API_BASE}/api/integrations/aa/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bankName: aaBankName,
          phoneNumber: aaPhoneNumber
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAaConsentId(data.consentId);
        setAaStep('otp');
      } else {
        throw new Error('Failed to create consent request');
      }
    } catch (e) {
      showAlert('Failed to connect with Account Aggregator portal.', 'Connection Error', 'error');
    } finally {
      setIsLinkingAa(false);
    }
  };

  const handleVerifyAAOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aaOtp) return;

    setIsLinkingAa(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const token = localStorage.getItem('porulalar_access_token');
      const res = await fetch(`${API_BASE}/api/integrations/aa/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consentId: aaConsentId,
          bankName: aaBankName
        })
      });

      if (res.ok) {
        setAaStep('success');
        if (onRefreshData) onRefreshData();
      } else {
        throw new Error('Failed to fetch AA statements');
      }
    } catch (e) {
      showAlert('OTP Verification failed. Please try again.', 'Auth Error', 'error');
    } finally {
      setIsLinkingAa(false);
    }
  };

  const closeAaModal = () => {
    setShowAaModal(false);
    setAaStep('input');
    setAaPhoneNumber('');
    setAaOtp('');
  };

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const totalBalance = banks.reduce((sum, b) => sum + (Number(b.currentBalance) || 0), 0);

  const handleEditBank = (bank: Bank) => {
    setEditingBankId(bank.id);
    setBankName(bank.bankName);
    setAccountType(bank.accountType);
    setAccountNumber(bank.accountNumber || '');
    setCurrentBalance(bank.currentBalance.toString());
    setIsPrimary(bank.isPrimary);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setBankName('');
    setAccountType('Savings');
    setAccountNumber('');
    setCurrentBalance('');
    setIsPrimary(false);
    setEditingBankId(null);
    setShowAddForm(false);
  };

  const resetTransferForm = () => {
    setTransferFromId('');
    setTransferToId('');
    setTransferAmount('');
    setTransferNotes('');
    setShowTransferForm(false);
  };

  const handleTransferFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromId || !transferToId || !transferAmount) {
      await showAlert('Please fill all required fields.', 'Error', 'error');
      return;
    }
    if (transferFromId === transferToId) {
      await showAlert('Source and Destination banks must be different.', 'Error', 'error');
      return;
    }
    const amt = Number(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      await showAlert('Please enter a valid transfer amount.', 'Error', 'error');
      return;
    }

    const fromBank = banks.find(b => b.id === transferFromId);
    if (fromBank && fromBank.currentBalance < amt) {
      const confirm = await showConfirm(`Source bank has insufficient balance (₹${fromBank.currentBalance}). Do you want to proceed with the transfer anyway?`);
      if (!confirm) return;
    }

    try {
      // Update from bank
      await porulalarStore.updateRecord('banks', transferFromId, { currentBalance: increment(-amt) });
      // Update to bank
      await porulalarStore.updateRecord('banks', transferToId, { currentBalance: increment(amt) });
      // Log the transfer
      await porulalarStore.addRecord('bankTransfers', {
        userId,
        fromBankId: transferFromId,
        toBankId: transferToId,
        amount: amt,
        date: new Date().toISOString().split('T')[0],
        notes: transferNotes || '',
        createdAt: new Date().toISOString()
      });
      
      resetTransferForm();
      if (onRefreshData) onRefreshData();
      await showAlert('Transfer successful!', 'Success', 'info');
    } catch (err) {
      console.error(err);
      await showAlert('Failed to process transfer.', 'Error', 'error');
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountType || !currentBalance) {
      await showAlert('Please fill all required fields.', 'Error', 'error');
      return;
    }

    try {
      // If setting as primary, optionally unset others first (or leave it to manual management, but best to unset others)
      if (isPrimary) {
        const otherPrimaries = banks.filter(b => b.isPrimary && b.id !== editingBankId);
        for (const op of otherPrimaries) {
          await porulalarStore.updateRecord('banks', op.id, { isPrimary: false });
        }
      }

      const bankData = {
        userId,
        bankName,
        accountType,
        accountNumber,
        currentBalance: Number(currentBalance),
        isPrimary,
        createdAt: new Date().toISOString()
      };

      if (editingBankId) {
        await porulalarStore.updateRecord('banks', editingBankId, bankData);
      } else {
        await porulalarStore.addRecord('banks', bankData);
      }
      
      resetForm();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to save bank account.', 'Error', 'error');
    }
  };

  const handleDeleteBank = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this bank account?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('banks', id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to delete bank account.', 'Error', 'error');
    }
  };

  const handleQuickUpdateBalance = async (bank: Bank) => {
    const newBalanceStr = await showPrompt(`Enter new balance for ${bank.bankName} (Current: ₹${bank.currentBalance}):`, 'Update Balance', bank.currentBalance.toString());
    if (newBalanceStr === null) return;
    const newBalance = Number(newBalanceStr);
    if (isNaN(newBalance)) {
      await showAlert('Please enter a valid number.', 'Error', 'error');
      return;
    }
    
    try {
      await porulalarStore.updateRecord('banks', bank.id, { currentBalance: newBalance });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to update balance.', 'Error', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600 h-6 w-6" /> Bank Accounts
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage your bank accounts and monitor balances.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAaModal(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all border border-indigo-100 flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Building2 className="h-4.5 w-4.5" /> Link AA (Sahamati)
          </button>
          <button
            onClick={() => { resetTransferForm(); setShowTransferForm(!showTransferForm); setShowAddForm(false); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="h-4.5 w-4.5" /> Transfer
          </button>
          <button
            onClick={() => { resetForm(); setShowAddForm(!showAddForm); setShowTransferForm(false); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> Add Bank
          </button>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Cumulative Bank Balance</div>
        <div className="text-3xl font-black font-mono text-emerald-700">₹{totalBalance.toLocaleString('en-IN')}</div>
      </div>

      {showTransferForm && (
        <form onSubmit={handleTransferFunds} className="bg-white p-6 border border-emerald-200 rounded-3xl shadow-md space-y-4">
          <h2 className="text-sm font-bold text-emerald-800 mb-4 border-b border-emerald-50 pb-2 flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Internal Bank Transfer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">From Bank</label>
              <select required value={transferFromId} onChange={e => setTransferFromId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="">Select Source Bank</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">To Bank</label>
              <select required value={transferToId} onChange={e => setTransferToId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                <option value="">Select Destination Bank</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bankName} (Bal: ₹{(Number(b.currentBalance) || 0).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Transfer Amount (₹)</label>
              <input type="number" step="0.01" required value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="e.g. 5000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (Optional)</label>
              <input type="text" value={transferNotes} onChange={e => setTransferNotes(e.target.value)} placeholder="e.g. Monthly Savings" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <div className="flex items-center justify-end pt-2 gap-2">
            <button type="button" onClick={resetTransferForm} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-1.5"><ArrowRightLeft className="h-4 w-4" /> Execute Transfer</button>
          </div>
        </form>
      )}

      {showAddForm && (
        <form onSubmit={handleAddBank} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{editingBankId ? "Edit Bank Account" : "Add New Bank"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Name</label>
              <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Account Type</label>
              <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20">
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Salary">Salary</option>
                <option value="Fixed Deposit">Fixed Deposit</option>
                <option value="Overdraft">Overdraft</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Account Number (Last 4 digits)</label>
              <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="e.g. 1234" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Total (₹)</label>
              <input type="number" step="0.01" required value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} placeholder="e.g. 25000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-500/20" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPrimary" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              <label htmlFor="isPrimary" className="text-sm text-slate-700 font-medium cursor-pointer">Set as Primary Bank Account</label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">{editingBankId ? "Update Account" : "Save Account"}</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banks.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-10 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
            <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No bank accounts tracked</p>
          </div>
        ) : (
          banks.map(bank => (
            <div key={bank.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-base">{bank.bankName}</span>
                      {bank.isPrimary && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <WalletCards className="h-3.5 w-3.5" /> {bank.accountType} {bank.accountNumber && `• ${bank.accountNumber}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleEditBank(bank)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-all border border-slate-100 cursor-pointer"
                    title="Edit Bank"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteBank(bank.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                    title="Delete Bank"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-end">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black font-mono text-slate-800">
                    ₹{(Number(bank.currentBalance) || 0).toLocaleString('en-IN')}
                  </div>
                  <button 
                    onClick={() => handleQuickUpdateBalance(bank)}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Quick Update Balance"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Account Aggregator Consent Modal */}
      {showAaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 text-left">
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-3xs">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Sahamati Consent Portal</h3>
              <p className="text-xs text-slate-400 mt-1">Simulate linking bank accounts securely via India's Account Aggregator architecture.</p>
            </div>

            {aaStep === 'input' && (
              <form onSubmit={handleInitiateAAConsent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Select Bank</label>
                  <select 
                    value={aaBankName} 
                    onChange={e => setAaBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Aggregator Linked Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="e.g. 9999988888" 
                    value={aaPhoneNumber} 
                    onChange={e => setAaPhoneNumber(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={closeAaModal} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isLinkingAa} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer">{isLinkingAa ? 'Connecting...' : 'Request Consent'}</button>
                </div>
              </form>
            )}

            {aaStep === 'otp' && (
              <form onSubmit={handleVerifyAAOtp} className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-xs text-amber-700 font-medium">
                  OTP request sent to +91 {aaPhoneNumber}. Enter any 6-digit passcode to verify consent.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Enter OTP passcode</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6} 
                    placeholder="e.g. 123456" 
                    value={aaOtp} 
                    onChange={e => setAaOtp(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden tracking-widest text-center font-bold font-mono" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setAaStep('input')} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Back</button>
                  <button type="submit" disabled={isLinkingAa} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer">{isLinkingAa ? 'Verifying OTP...' : 'Approve Consent'}</button>
                </div>
              </form>
            )}

            {aaStep === 'success' && (
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Account Aggregator Linked!</h4>
                  <p className="text-xs text-slate-500 mt-1">Successfully fetched and linked your bank accounts and historical statements via Sahamati FIP gateways.</p>
                </div>
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={closeAaModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer">Got It</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
