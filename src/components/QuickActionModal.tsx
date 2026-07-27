import React from 'react';
import { X, CreditCard, TrendingUp, Landmark, Shield, ArrowRightLeft, PlusCircle } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionType: string) => void;
}

const ACTION_OPTIONS = [
  { id: 'PAY_CC_BILL', title: 'Pay Credit Card Bill', desc: 'Settle outstanding credit card statement', icon: CreditCard, color: 'bg-indigo-600 text-white' },
  { id: 'PAY_EMI', title: 'Pay EMI Installment', desc: 'Record scheduled loan/installment payment', icon: PlusCircle, color: 'bg-violet-600 text-white' },
  { id: 'RECORD_INCOME', title: 'Record Income', desc: 'Log salary, interest, or dividends', icon: TrendingUp, color: 'bg-emerald-600 text-white' },
  { id: 'ADD_INVESTMENT', title: 'Add Investment', desc: 'Stocks, mutual funds, gold, SIPs', icon: Landmark, color: 'bg-blue-600 text-white' },
  { id: 'TRANSFER_MONEY', title: 'Transfer Funds', desc: 'Move money between bank accounts', icon: ArrowRightLeft, color: 'bg-sky-600 text-white' },
  { id: 'ADD_ASSET', title: 'Add Asset', desc: 'Real estate, vehicle, or physical asset', icon: Shield, color: 'bg-teal-600 text-white' },
  { id: 'ADD_CREDIT_CARD', title: 'Add Credit Card', desc: 'Track card limits, rewards & bills', icon: CreditCard, color: 'bg-amber-600 text-white' },
];

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, onSelectAction }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">System Financial Actions</h2>
            <p className="text-xs text-slate-500">Perform verified system payments or register wealth items.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-saas"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {ACTION_OPTIONS.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-saas group"
              >
                <div className={`w-9 h-9 rounded-xl ${act.color} flex items-center justify-center shrink-0 shadow-xs`}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-saas">{act.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
