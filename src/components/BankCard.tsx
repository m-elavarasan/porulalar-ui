import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Building2, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { BankAccount } from '../types';

interface BankCardProps {
  bank: BankAccount;
  onTransfer?: (bank: BankAccount) => void;
  onEdit?: (bank: BankAccount) => void;
}

const BANK_LOGOS: Record<string, { bg: string; text: string; label: string }> = {
  HDFC: { bg: 'bg-blue-600', text: 'text-white', label: 'HDFC Bank' },
  ICICI: { bg: 'bg-orange-600', text: 'text-white', label: 'ICICI Bank' },
  SBI: { bg: 'bg-sky-600', text: 'text-white', label: 'State Bank of India' },
  AXIS: { bg: 'bg-rose-700', text: 'text-white', label: 'Axis Bank' },
  KOTAK: { bg: 'bg-red-600', text: 'text-white', label: 'Kotak Mahindra' },
  CANARA: { bg: 'bg-amber-600', text: 'text-white', label: 'Canara Bank' },
  FEDERAL: { bg: 'bg-indigo-700', text: 'text-white', label: 'Federal Bank' },
  IOB: { bg: 'bg-teal-700', text: 'text-white', label: 'Indian Overseas Bank' },
  INDIAN_BANK: { bg: 'bg-blue-800', text: 'text-white', label: 'Indian Bank' },
};

export const BankCard: React.FC<BankCardProps> = ({ bank, onTransfer, onEdit }) => {
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('porulalar_hide_balances') === 'true';
  });

  const toggleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem('porulalar_hide_balances', String(next));
  };

  // Determine bank branding
  const name = bank.bankName || (bank as any).name || 'Bank Account';
  const nameUpper = name.toUpperCase();
  let matchedKey = 'HDFC';
  if (nameUpper.includes('ICICI')) matchedKey = 'ICICI';
  else if (nameUpper.includes('SBI') || nameUpper.includes('STATE')) matchedKey = 'SBI';
  else if (nameUpper.includes('AXIS')) matchedKey = 'AXIS';
  else if (nameUpper.includes('KOTAK')) matchedKey = 'KOTAK';
  else if (nameUpper.includes('CANARA')) matchedKey = 'CANARA';
  else if (nameUpper.includes('FEDERAL')) matchedKey = 'FEDERAL';
  else if (nameUpper.includes('OVERSEAS') || nameUpper.includes('IOB')) matchedKey = 'IOB';
  else if (nameUpper.includes('INDIAN')) matchedKey = 'INDIAN_BANK';

  const brand = BANK_LOGOS[matchedKey] || BANK_LOGOS.HDFC;

  const maskedAccount = bank.accountNumber
    ? `•••• ${bank.accountNumber.slice(-4)}`
    : '•••• 4092';

  const currentBalance = bank.currentBalance ?? (bank as any).balance ?? 0;
  const availableBalance = (bank as any).availableBalance ?? currentBalance;

  return (
    <div className="saas-card p-5 hover-elevate transition-saas relative group overflow-hidden bg-white">
      {/* Soft gradient accent line on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${brand.bg} ${brand.text} flex items-center justify-center font-bold text-xs shadow-xs tracking-wider`}>
            {matchedKey.slice(0, 4)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug">{name}</h3>
            <p className="text-xs text-slate-500 font-mono">{maskedAccount} • {bank.accountType || 'Savings'}</p>
          </div>
        </div>

        <button
          onClick={toggleHide}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-saas"
          title={hideBalance ? "Show balance" : "Hide balance"}
        >
          {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Balances Grid */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100/80 mb-4 grid grid-cols-2 gap-3">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Current Balance</span>
          <p className="text-lg font-bold text-slate-900 tracking-tight">
            {hideBalance ? '••••••••' : `₹${currentBalance.toLocaleString('en-IN')}`}
          </p>
        </div>
        <div className="border-l border-slate-200/60 pl-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Available</span>
          <p className="text-sm font-semibold text-emerald-600 tracking-tight mt-0.5">
            {hideBalance ? '••••••••' : `₹${availableBalance.toLocaleString('en-IN')}`}
          </p>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
        <span>Updated: {bank.lastUpdated ? new Date(bank.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
        
        <div className="flex items-center gap-2">
          {onTransfer && (
            <button
              onClick={() => onTransfer(bank)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-saas flex items-center gap-1"
            >
              <ArrowUpRight size={12} />
              Transfer
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(bank)}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-saas"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
