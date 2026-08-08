import React from 'react';
import { Investment } from '../types';
import { TrendingUp, TrendingDown, Coins, Landmark, LineChart, PieChart, ShieldCheck, Zap, Layers, PiggyBank } from 'lucide-react';

interface InvestmentCardProps {
  investment: Investment;
  onEdit?: (inv: Investment) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string; label: string }> = {
  STOCKS: { icon: LineChart, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', label: 'Stocks' },
  MUTUAL_FUNDS: { icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', label: 'Mutual Funds' },
  MUTUAL_FUND: { icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', label: 'Mutual Fund' },
  SIP: { icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100', label: 'SIP' },
  GOLD: { icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'Gold / Bullion' },
  FD: { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', label: 'Fixed Deposit' },
  RD: { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', label: 'Recurring Deposit' },
  PPF: { icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100', label: 'PPF' },
  EPF: { icon: ShieldCheck, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', label: 'EPF' },
  CHIT_INVESTMENT: { icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', label: 'Chit Fund' },
};

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ investment, onEdit }) => {
  const typeStr = investment.investmentType || (investment as any).type || 'STOCKS';
  const typeKey = typeStr.toUpperCase().replace(/\s+/g, '_');
  const config = TYPE_CONFIG[typeKey] || { icon: PiggyBank, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', label: typeStr };
  const IconComponent = config.icon;

  const name = investment.investmentName || (investment as any).name || 'Investment Asset';
  const currentVal = investment.currentValue ?? (investment as any).amount ?? 0;
  const investedVal = investment.investedAmount ?? (investment as any).investedValue ?? (investment as any).amount ?? 0;
  const returns = currentVal - investedVal;
  const isPositive = returns >= 0;
  const returnPercentage = investedVal > 0 ? ((returns / investedVal) * 100).toFixed(2) : '0.00';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs hover:shadow-md transition-all relative group flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${config.bg} ${config.color} border flex items-center justify-center shrink-0`}>
            <IconComponent size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-snug break-words">{name}</h3>
            <span className="text-[11px] text-slate-400 font-medium">{config.label} • {investment.platform || 'Direct'}</span>
          </div>
        </div>

        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
          isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' : 'bg-rose-50 text-rose-700 border border-rose-200/80'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{returnPercentage}%</span>
        </div>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100/80">
        <div>
          <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-0.5">Current Value</span>
          <p className="text-sm font-bold text-slate-900 tracking-tight font-mono">₹{currentVal.toLocaleString('en-IN')}</p>
        </div>
        <div className="border-l border-slate-200/60 pl-3">
          <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-0.5">Invested</span>
          <p className="text-xs font-semibold text-slate-600 tracking-tight mt-0.5 font-mono">₹{investedVal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span>Profit/Loss: <strong className={`font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{isPositive ? '+' : ''}₹{returns.toLocaleString('en-IN')}</strong></span>
        {onEdit && (
          <button 
            onClick={() => onEdit(investment)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer"
          >
            Manage
          </button>
        )}
      </div>
    </div>
  );
};
