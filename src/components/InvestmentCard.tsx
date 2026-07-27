import React from 'react';
import { Investment } from '../types';
import { TrendingUp, TrendingDown, Coins, Landmark, LineChart, PieChart, ShieldCheck, Zap } from 'lucide-react';

interface InvestmentCardProps {
  investment: Investment;
  onEdit?: (inv: Investment) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string; label: string }> = {
  STOCKS: { icon: LineChart, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', label: 'Stocks' },
  MUTUAL_FUNDS: { icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', label: 'Mutual Funds' },
  SIP: { icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100', label: 'SIP' },
  GOLD: { icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'Gold / Bullion' },
  FD: { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', label: 'Fixed Deposit' },
  PPF: { icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100', label: 'PPF' },
  EPF: { icon: ShieldCheck, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', label: 'EPF' },
  CRYPTO: { icon: Coins, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', label: 'Crypto' },
};

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ investment, onEdit }) => {
  const typeStr = investment.investmentType || (investment as any).type || 'STOCKS';
  const typeKey = typeStr.toUpperCase().replace(/\s+/g, '_');
  const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.STOCKS;
  const IconComponent = config.icon;

  const name = investment.investmentName || (investment as any).name || 'Investment';
  const currentVal = investment.currentValue ?? (investment as any).amount ?? 0;
  const investedVal = investment.investedAmount ?? (investment as any).investedValue ?? (investment as any).amount ?? 0;
  const returns = currentVal - investedVal;
  const isPositive = returns >= 0;
  const returnPercentage = investedVal > 0 ? ((returns / investedVal) * 100).toFixed(2) : '0.00';

  return (
    <div className="saas-card p-5 hover-elevate transition-saas bg-white relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} border flex items-center justify-center`}>
            <IconComponent size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-snug">{investment.name}</h3>
            <span className="text-xs text-slate-500 font-medium">{config.label}</span>
          </div>
        </div>

        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{returnPercentage}%</span>
        </div>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50/80 rounded-xl p-3 border border-slate-100/80 mb-3">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Current Value</span>
          <p className="text-base font-bold text-slate-900 tracking-tight">₹{currentVal.toLocaleString('en-IN')}</p>
        </div>
        <div className="border-l border-slate-200/60 pl-3">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Invested</span>
          <p className="text-sm font-semibold text-slate-600 tracking-tight mt-0.5">₹{investedVal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Total Profit/Loss: <strong className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>{isPositive ? '+' : ''}₹{Math.abs(returns).toLocaleString('en-IN')}</strong></span>
        {onEdit && (
          <button 
            onClick={() => onEdit(investment)}
            className="text-slate-400 hover:text-slate-700 font-medium transition-saas"
          >
            Manage
          </button>
        )}
      </div>
    </div>
  );
};
