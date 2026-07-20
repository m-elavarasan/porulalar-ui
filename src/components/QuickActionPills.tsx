import React from 'react';
import { ArrowUpRight, ArrowDownLeft, QrCode, Repeat } from 'lucide-react';

interface QuickActionPillsProps {
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onTransfer?: () => void;
  onPayQR?: () => void;
}

export const QuickActionPills: React.FC<QuickActionPillsProps> = ({
  onAddExpense,
  onAddIncome,
  onTransfer,
  onPayQR,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <button
        onClick={onAddExpense}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border-2 border-teal-300 hover:border-teal-500 transition-colors shadow-sm cursor-pointer text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center shrink-0">
          <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-sm font-black text-teal-950">Spend</div>
          <div className="text-xs text-teal-800 font-semibold">Log Expense</div>
        </div>
      </button>

      <button
        onClick={onAddIncome}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border-2 border-teal-300 hover:border-teal-500 transition-colors shadow-sm cursor-pointer text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center shrink-0">
          <ArrowDownLeft className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-sm font-black text-teal-950">Income</div>
          <div className="text-xs text-teal-800 font-semibold">Add Deposit</div>
        </div>
      </button>

      <button
        onClick={onTransfer}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border-2 border-teal-300 hover:border-teal-500 transition-colors shadow-sm cursor-pointer text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center shrink-0">
          <Repeat className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-sm font-black text-teal-950">Transfer</div>
          <div className="text-xs text-teal-800 font-semibold">Between Banks</div>
        </div>
      </button>

      <button
        onClick={onPayQR}
        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border-2 border-teal-300 hover:border-teal-500 transition-colors shadow-sm cursor-pointer text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center shrink-0">
          <QrCode className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="text-sm font-black text-teal-950">Pay QR</div>
          <div className="text-xs text-teal-800 font-semibold">Scan & Pay</div>
        </div>
      </button>
    </div>
  );
};
