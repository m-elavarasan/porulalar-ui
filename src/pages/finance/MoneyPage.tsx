import React, { useState, useEffect } from 'react';
import { cfoService } from '../../services/cfoService';
import { CFOSummaryResponse } from '../../types';
import { Wallet, CreditCard, DollarSign, Building2, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const MoneyPage: React.FC = () => {
  const [data, setData] = useState<CFOSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMoneyData = async () => {
    setLoading(true);
    try {
      const res = await cfoService.getCFOSummary();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoneyData();
  }, []);

  const pos = data?.position;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span>MONEY & CASHFLOW MANAGEMENT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            MY MONEY & CAPACITY
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track bank balances, salary income, credit cards, and free cash surplus.
          </p>
        </div>

        <button
          onClick={fetchMoneyData}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH BALANCES</span>
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MONTHLY SALARY / INCOME</span>
          <p className="text-2xl font-black text-slate-900">₹{(data?.monthlyIncome || 77600).toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Salaried & Recurring
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FIXED COMMITMENTS</span>
          <p className="text-2xl font-black text-slate-900">₹{(data?.monthlyCommitments || 32000).toLocaleString()}</p>
          <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> EMIs + Chits + Rent
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MONTHLY FREE CASH</span>
          <p className="text-2xl font-black text-blue-600">₹{(data?.freeCash || 20600).toLocaleString()}</p>
          <span className="text-[11px] text-blue-600 font-semibold">Deployable Surplus</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">LIQUID BANK CASH</span>
          <p className="text-2xl font-black text-emerald-600">₹{(pos?.cash || 245000).toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 font-semibold">Emergency Reserve Buffer</span>
        </div>
      </div>

      {/* Cash Capacity Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900">MONTHLY FINANCIAL CAPACITY BREAKDOWN</h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50">
            <span className="font-semibold text-slate-700">Gross Salary & Income</span>
            <span className="font-extrabold text-slate-900">+₹{(data?.monthlyIncome || 77600).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50">
            <span className="font-semibold text-slate-700 font-medium">Fixed Loan EMIs & Chit Obligations</span>
            <span className="font-bold text-rose-600">-₹{(data?.monthlyCommitments || 32000).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50">
            <span className="font-semibold text-slate-700 font-medium">Essential Living Expenses</span>
            <span className="font-bold text-rose-600">-₹15,000</span>
          </div>
          <div className="flex justify-between items-center p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
            <span>Available Monthly Surplus / Free Cash</span>
            <span className="text-xl text-blue-700">₹{(data?.freeCash || 20600).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
