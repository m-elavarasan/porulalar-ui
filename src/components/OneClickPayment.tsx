import React, { useState, useEffect } from 'react';
import { smartService, UpcomingPayment, CascadeResult } from '../services/smartService';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import {
  Clock,
  CreditCard,
  Briefcase,
  Percent,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  EMI: { icon: ShoppingBag, color: 'text-violet-600', bgColor: 'bg-violet-50 border-violet-200', label: 'EMI' },
  Loan: { icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', label: 'Loan EMI' },
  Chit: { icon: Percent, color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200', label: 'Chit Fund' },
  CreditCard: { icon: CreditCard, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', label: 'Credit Card' },
};

export function OneClickPayment() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<CascadeResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedBank, setSelectedBank] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentData, bankData] = await Promise.all([
        smartService.getUpcomingPayments(),
        porulalarStore.fetchCollection('banks'),
      ]);
      setPayments(paymentData || []);
      setBanks(bankData || []);

      // Default selected bank to primary or first bank
      const primary = bankData?.find((b: any) => b.isPrimary) || bankData?.[0];
      if (primary) {
        const defaults: Record<string, string> = {};
        (paymentData || []).forEach((p: UpcomingPayment) => {
          defaults[p.id] = p.autoPayBank || primary.id;
        });
        setSelectedBank(defaults);
      }
    } catch (err) {
      console.error('Failed to load upcoming payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (payment: UpcomingPayment) => {
    setPayingId(payment.id);
    setSuccessResult(null);
    try {
      const bankId = selectedBank[payment.id] || '';
      let result: CascadeResult;
      switch (payment.type) {
        case 'EMI':
          result = await smartService.payEMI(payment.id, bankId);
          break;
        case 'Loan':
          result = await smartService.payLoan(payment.id, bankId);
          break;
        case 'Chit':
          result = await smartService.payChit(payment.id, bankId);
          break;
        case 'CreditCard':
          result = await smartService.payCard(payment.id, bankId, true);
          break;
        default:
          return;
      }
      setSuccessResult(result);

      // Refresh data after payment
      await Promise.all([
        porulalarStore.fetchCollection('banks', true),
        porulalarStore.fetchCollection('expenses', true),
        porulalarStore.fetchCollection(payment.type === 'EMI' ? 'emis' : payment.type === 'Loan' ? 'loans' : payment.type === 'Chit' ? 'chits' : 'cards', true),
      ]);
      loadData();

      // Auto-dismiss success after 5 seconds
      setTimeout(() => setSuccessResult(null), 5000);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setSuccessResult({ message: `❌ ${err.message || 'Payment failed'}` });
      setTimeout(() => setSuccessResult(null), 4000);
    } finally {
      setPayingId(null);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    if (!dueDate) return 999;
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const totalDue = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="saas-card p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48 mb-3"></div>
        <div className="h-16 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (payments.length === 0) return null;

  return (
    <div className="saas-card overflow-hidden">
      {/* Success Toast */}
      {successResult && (
        <div className={`px-5 py-3 text-xs font-bold flex items-center gap-2 ${
          successResult.message.startsWith('✅')
            ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-b border-rose-200'
        }`}>
          {successResult.message.startsWith('✅') ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{successResult.message}</span>
          {successResult.bankName && (
            <span className="ml-auto text-[10px] font-medium opacity-70">
              Debited from {successResult.bankName}
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
            <Zap size={18} className="text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Payments</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {payments.length} obligation{payments.length !== 1 ? 's' : ''} • Total ₹{totalDue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold border border-orange-200">
            {payments.length} DUE
          </span>
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Payment Items */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {payments
            .sort((a, b) => getDaysUntilDue(a.dueDate) - getDaysUntilDue(b.dueDate))
            .map((payment) => {
              const config = typeConfig[payment.type] || typeConfig.EMI;
              const IconComp = config.icon;
              const daysUntil = getDaysUntilDue(payment.dueDate);
              const isOverdue = daysUntil < 0;
              const isUrgent = daysUntil >= 0 && daysUntil <= 3;
              const isPaying = payingId === payment.id;

              return (
                <div
                  key={payment.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'border-rose-200 bg-rose-50/50'
                      : isUrgent
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${config.bgColor}`}>
                      <IconComp size={18} className={config.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{payment.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg font-extrabold text-slate-900">₹{payment.amount.toLocaleString('en-IN')}</span>
                        <span className={`text-[10px] font-semibold ${
                          isOverdue ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {isOverdue
                            ? `${Math.abs(daysUntil)} days overdue!`
                            : daysUntil === 0
                            ? 'Due today'
                            : `Due in ${daysUntil} days`}
                        </span>
                      </div>
                    </div>

                    {/* Bank Selector + Pay Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={selectedBank[payment.id] || ''}
                        onChange={(e) => setSelectedBank({ ...selectedBank, [payment.id]: e.target.value })}
                        className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 max-w-[100px] truncate"
                      >
                        <option value="">No bank</option>
                        {banks.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handlePay(payment)}
                        disabled={isPaying}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                          isOverdue
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Zap size={12} />
                        {isPaying ? 'Paying...' : 'Pay Now'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
