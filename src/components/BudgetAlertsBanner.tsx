import React, { useEffect, useState } from 'react';
import { financeService, BudgetAlertItem } from '../services/financeService';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

export function BudgetAlertsBanner() {
  const [alerts, setAlerts] = useState<BudgetAlertItem[]>([]);

  useEffect(() => {
    financeService.getBudgetAlerts()
      .then((res) => setAlerts(res || []))
      .catch((err) => console.error('Failed to load budget alerts:', err));
  }, []);

  const activeAlerts = alerts.filter((a) => a.status !== 'OK');
  if (activeAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-6">
      {activeAlerts.map((item, idx) => {
        const isExceeded = item.status === 'EXCEEDED';
        return (
          <div
            key={idx}
            className={`flex items-center justify-between p-4 rounded-xl border text-sm shadow-md transition-all ${
              isExceeded
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isExceeded ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="font-semibold tracking-wide">{item.message}</p>
                <p className="text-xs opacity-75 mt-0.5">
                  Allocated: ₹{item.allocatedBudget.toLocaleString()} • Spent: ₹{item.spentAmount.toLocaleString()} ({item.percentageSpent}%)
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase border shrink-0 ${
                isExceeded
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              {item.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
