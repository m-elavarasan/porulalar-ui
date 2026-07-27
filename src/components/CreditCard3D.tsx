import React, { useState } from 'react';
import { CreditCard as CardType } from '../types';
import { ShieldCheck, Sparkles, CreditCardIcon, RefreshCw, Calendar, Award } from 'lucide-react';

interface CreditCard3DProps {
  card: CardType;
  onPayBill?: (card: CardType) => void;
  onEdit?: (card: CardType) => void;
}

interface BrandStyle {
  bgGradient: string;
  textColor: string;
  subtextColor: string;
  accentBg: string;
  networkLogo: string;
  issuerName: string;
}

const BRAND_STYLES: Record<string, BrandStyle> = {
  HDFC: {
    bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
    textColor: 'text-white',
    subtextColor: 'text-indigo-200',
    accentBg: 'bg-indigo-500/20 border-indigo-400/30',
    networkLogo: 'VISA',
    issuerName: 'HDFC Regalia Gold',
  },
  ICICI: {
    bgGradient: 'from-amber-900 via-stone-900 to-slate-950',
    textColor: 'text-white',
    subtextColor: 'text-amber-200',
    accentBg: 'bg-amber-500/20 border-amber-400/30',
    networkLogo: 'Mastercard',
    issuerName: 'ICICI Amazon Pay',
  },
  AXIS: {
    bgGradient: 'from-rose-950 via-red-950 to-slate-950',
    textColor: 'text-white',
    subtextColor: 'text-rose-200',
    accentBg: 'bg-rose-500/20 border-rose-400/30',
    networkLogo: 'RuPay',
    issuerName: 'Axis Magnus',
  },
  SBI: {
    bgGradient: 'from-sky-950 via-blue-950 to-slate-950',
    textColor: 'text-white',
    subtextColor: 'text-sky-200',
    accentBg: 'bg-sky-500/20 border-sky-400/30',
    networkLogo: 'VISA',
    issuerName: 'SBI Card Elite',
  },
  IDFC: {
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    textColor: 'text-white',
    subtextColor: 'text-emerald-200',
    accentBg: 'bg-emerald-500/20 border-emerald-400/30',
    networkLogo: 'Amex',
    issuerName: 'IDFC FIRST Wealth',
  },
};

export const CreditCard3D: React.FC<CreditCard3DProps> = ({ card, onPayBill }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Match brand
  const name = card.cardName || (card as any).name || 'Card';
  const bank = card.bankName || 'Bank';
  const nameUpper = (name + ' ' + bank).toUpperCase();
  let brandKey = 'HDFC';
  if (nameUpper.includes('ICICI') || nameUpper.includes('AMAZON')) brandKey = 'ICICI';
  else if (nameUpper.includes('AXIS') || nameUpper.includes('MAGNUS')) brandKey = 'AXIS';
  else if (nameUpper.includes('SBI') || nameUpper.includes('ELITE')) brandKey = 'SBI';
  else if (nameUpper.includes('IDFC') || nameUpper.includes('WEALTH')) brandKey = 'IDFC';

  const style = BRAND_STYLES[brandKey] || BRAND_STYLES.HDFC;

  const totalLimit = card.creditLimit || (card as any).limit || 0;
  const currentOutstanding = card.currentOutstanding ?? (card as any).balance ?? 0;
  const availableLimit = Math.max(0, totalLimit - currentOutstanding);
  const utilization = totalLimit > 0 ? Math.min(100, Math.round((currentOutstanding / totalLimit) * 100)) : 0;

  const numberStr = card.cardNumber || (card as any).number || '••••';
  const maskedNumber = `•••• •••• •••• ${numberStr.slice(-4)}`;

  return (
    <div className="perspective-1000 w-full h-[270px] cursor-pointer group select-none" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* ═══ FRONT OF CARD ═══ */}
        <div className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${style.bgGradient} p-6 text-white shadow-xl border border-white/15 flex flex-col justify-between backface-hidden overflow-hidden`}>
          {/* Ambient Glow */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Top: Chip + Bank + Card Name | Network Logo */}
          <div className="flex items-start justify-between z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-6 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 rounded border border-amber-100/50 shadow-inner flex items-center justify-center">
                  <div className="w-4 h-3 border-x border-amber-700/40" />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-white/60">
                  {bank}
                </span>
              </div>
              <h4 className="font-extrabold text-sm tracking-wide text-white drop-shadow-sm leading-tight pl-0.5">
                {name}
              </h4>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[11px] font-black tracking-widest px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 uppercase">
                {style.networkLogo}
              </span>
              <span className="text-[10px] text-white/40 group-hover:text-white/80 transition-colors">Flip ↺</span>
            </div>
          </div>

          {/* Middle: Card Number + Expiry */}
          <div className="z-10 py-2">
            <p className="font-mono text-base sm:text-lg tracking-[0.22em] text-white/90 font-medium">
              {maskedNumber}
            </p>
            {card.expiryDate && (
              <span className="text-[10px] font-mono text-white/50 block mt-1">
                VALID THRU: {card.expiryDate}
              </span>
            )}
          </div>

          {/* Bottom: Outstanding + Limit/Utilization */}
          <div className="z-10 pt-3 border-t border-white/15 flex items-end justify-between text-xs">
            <div>
              <span className="text-[10px] text-white/50 uppercase font-semibold tracking-wider block mb-0.5">Outstanding</span>
              <p className="font-bold text-lg text-white tracking-tight leading-none">
                ₹{currentOutstanding.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="text-right space-y-1.5">
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-white/60">
                <span>Limit: ₹{totalLimit > 0 ? totalLimit.toLocaleString('en-IN') : 'N/A'}</span>
                {totalLimit > 0 && <span className="font-bold text-white/90">({utilization}%)</span>}
              </div>
              {totalLimit > 0 && (
                <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden ml-auto">
                  <div 
                    className={`h-full rounded-full ${utilization > 70 ? 'bg-rose-400' : utilization > 40 ? 'bg-amber-300' : 'bg-emerald-400'}`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ BACK OF CARD ═══ */}
        <div className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${style.bgGradient} px-6 pb-5 pt-0 text-white shadow-xl border border-white/15 flex flex-col backface-hidden rotate-y-180 overflow-hidden`}>
          {/* Black Magnetic Stripe */}
          <div className="w-[calc(100%+3rem)] -mx-6 h-10 bg-slate-950/90 border-y border-white/10 mt-5 mb-4 shrink-0" />

          {/* CVV + Statement/Due Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-xs font-mono border border-white/10">
              <span className="text-white/50 text-[9px] block uppercase font-sans mb-0.5">CVV / Security</span>
              <span className="font-bold tracking-widest text-amber-300 text-sm">•••</span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-white/50 uppercase font-sans block mb-0.5">Statement / Due</span>
              <span className="font-bold text-sm text-rose-300">{card.dueDate || card.statementDate || 'N/A'}</span>
            </div>
          </div>

          {/* Details Panel */}
          <div className="space-y-2.5 text-xs text-white/90 bg-white/5 rounded-xl p-4 border border-white/10 mb-auto">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Total Limit</span>
              <span className="font-bold text-sm">₹{totalLimit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Available Credit</span>
              <span className="font-bold text-sm text-emerald-300">₹{availableLimit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-2">
              <span className="text-white/50 text-[11px]">Auto Pay</span>
              <span className={`font-semibold text-[11px] ${card.autoPay ? 'text-emerald-400' : 'text-slate-400'}`}>
                {card.autoPay ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          </div>

          {/* Footer: Flip hint + Pay Bill */}
          <div className="flex items-center justify-between text-[11px] text-white/50 pt-3 shrink-0">
            <span>← Tap to flip front</span>
            {onPayBill && (
              <button
                onClick={(e) => { e.stopPropagation(); onPayBill(card); }}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-colors"
              >
                Pay Bill
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
