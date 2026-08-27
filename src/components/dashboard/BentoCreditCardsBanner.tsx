import React, { useState } from 'react';
import { CreditCard, Zap } from 'lucide-react';

interface BentoCreditCardsBannerProps {
  onNavigate: (path: string) => void;
}

export const BentoCreditCardsBanner: React.FC<BentoCreditCardsBannerProps> = ({ onNavigate }) => {
  const [selectedCard, setSelectedCard] = useState<string>('c1');

  const cardItems = [
    {
      id: 'c1',
      name: 'Axis Magnus CC',
      subtitle: 'Credit Shield • Limit 40%',
      utilizationPct: 40,
      limitLabel: '₹1,40,000 / ₹3.5L',
      color: 'bg-indigo-600',
      badge: 'Active Shield',
      chargeTime: '10 days to due date',
    },
    {
      id: 'c2',
      name: 'HDFC Savings Vault',
      subtitle: 'Liquid Reserve',
      utilizationPct: 80,
      limitLabel: '₹2,80,000 Available',
      color: 'bg-blue-600',
      badge: 'High Reserve',
      chargeTime: 'Instant Cash',
    },
    {
      id: 'c3',
      name: 'Zerodha SIP Fund',
      subtitle: 'Equity Growth',
      utilizationPct: 92,
      limitLabel: '₹5,40,000 Target',
      color: 'bg-emerald-600',
      badge: 'Auto-Invest',
      chargeTime: 'Executes 1st of Month',
    },
  ];

  return (
    <div className="bento-card bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 px-3 py-0.5 rounded-full">
              Financial Instruments & Credit Shield
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Credit Limits & Capital Vault Instruments
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Real-time tracking of active credit card limits, liquidity reserves, and automated SIP portfolios.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/cards')}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto shrink-0"
        >
          <Zap size={16} />
          <span>Manage Vaults & Cards</span>
        </button>
      </div>

      {/* Credit Cards / Vaults Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cardItems.map((c) => {
          const isSelected = c.id === selectedCard;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCard(c.id)}
              className={`p-5 rounded-2xl transition-all cursor-pointer select-none flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-blue-50/50 border-2 border-blue-600 shadow-xs'
                  : 'bg-slate-50/70 border border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl ${c.color} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}>
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{c.name}</h4>
                    <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">{c.subtitle}</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                    ✓
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-slate-600">{c.limitLabel}</span>
                  <span className="text-slate-900 font-black">{c.utilizationPct}%</span>
                </div>

                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${c.utilizationPct}%` }}
                    className={`h-full rounded-full transition-all ${
                      c.utilizationPct > 80 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
