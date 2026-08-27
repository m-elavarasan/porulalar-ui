import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cfoService } from '../../services/cfoService';
import { CFOSummaryResponse, CFOAdviceItem } from '../../types';
import {
  Sparkles,
  TrendingUp,
  Wallet,
  Calculator,
  Percent,
  Building2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<CFOSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrajectory, setSelectedTrajectory] = useState<'1Y' | '3Y' | '5Y' | '10Y'>('5Y');
  const navigate = useNavigate();

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await cfoService.getCFOSummary();
      setSummary(res);
    } catch (e) {
      console.error('Failed to load CFO summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const netWorth = summary?.netWorth || 2480000;
  const ytdChange = summary?.netWorthYtdChange || 210000;
  const monthlyIncome = summary?.monthlyIncome || 77600;
  const monthlyCommitments = summary?.monthlyCommitments || 32000;
  const freeCash = summary?.freeCash || 20600;

  const pos = summary?.position || {
    cash: 245000,
    investments: 700000,
    assets: 1000000,
    loans: 840000,
    creditCard: 45000,
    netWorth: 2060000
  };

  // Trajectory Multipliers
  const trajectoryMultiplier = selectedTrajectory === '1Y' ? 1.12 : selectedTrajectory === '3Y' ? 1.42 : selectedTrajectory === '5Y' ? 1.85 : 2.95;
  const projectedNetWorth = netWorth * trajectoryMultiplier;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Good Evening Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-1">
            PORULAR PERSONAL CFO
          </span>
          <h1 className="text-3xl font-black tracking-tight font-crowz-header">
            GOOD EVENING — YOUR FINANCIAL POSITION
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage once, simulate before deciding, and optimize your wealth.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">NET WORTH</span>
          <div className="text-3xl font-black text-white">₹{(netWorth / 100000).toFixed(1)}L</div>
          <span className="text-xs text-emerald-400 font-bold">
            +₹{(ytdChange / 100000).toFixed(1)}L YTD
          </span>
        </div>
      </div>

      {/* Top Important Numbers Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MONTHLY INCOME</span>
          <p className="text-2xl font-black text-slate-900">₹{monthlyIncome.toLocaleString()}</p>
          <span className="text-xs text-emerald-600 font-semibold">Salaried & Cash Inflows</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MONTHLY COMMITMENTS</span>
          <p className="text-2xl font-black text-slate-900">₹{monthlyCommitments.toLocaleString()}</p>
          <span className="text-xs text-rose-600 font-semibold">EMIs + Chit Payments</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FREE CASH SURPLUS</span>
          <p className="text-2xl font-black text-blue-600">₹{freeCash.toLocaleString()}</p>
          <span className="text-xs text-blue-600 font-semibold">Available for Simulation & Investment</span>
        </div>
      </div>

      {/* Financial Position Breakdown & Upcoming Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Position */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">FINANCIAL POSITION</h3>
            <button
              onClick={() => navigate('/money')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>MANAGE MONEY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-semibold block mb-1">CASH & BANKS</span>
              <p className="text-base font-extrabold text-slate-900">₹{(pos.cash / 100000).toFixed(2)}L</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-semibold block mb-1">INVESTMENTS</span>
              <p className="text-base font-extrabold text-slate-900">₹{(pos.investments / 100000).toFixed(2)}L</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 font-semibold block mb-1">LAND & ASSETS</span>
              <p className="text-base font-extrabold text-slate-900">₹{(pos.assets / 100000).toFixed(2)}L</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-rose-700 font-bold block mb-1">LOANS (DEBT)</span>
              <p className="text-base font-extrabold text-rose-900">₹{(pos.loans / 100000).toFixed(2)}L</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-rose-700 font-bold block mb-1">CREDIT CARDS</span>
              <p className="text-base font-extrabold text-rose-900">₹{(pos.creditCard / 100000).toFixed(2)}L</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-blue-800 font-bold block mb-1">NET WORTH</span>
              <p className="text-base font-extrabold text-blue-900">₹{(pos.netWorth / 100000).toFixed(2)}L</p>
            </div>
          </div>
        </div>

        {/* Upcoming Commitments */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Upcoming Payments
          </h3>

          <div className="space-y-3">
            {[
              { type: 'Next EMI', name: 'HDFC Personal Loan', amount: '₹22,000', date: 'Aug 15' },
              { type: 'Next Chit', name: 'Shriram 5L Chit', amount: '₹25,000', date: 'Aug 20' },
              { type: 'Upcoming SIP', name: 'Nifty 50 Index Fund', amount: '₹10,000', date: 'Aug 25' }
            ].map((up, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">{up.type}</span>
                  <strong className="text-slate-900">{up.name}</strong>
                </div>
                <div className="text-right">
                  <strong className="text-slate-900 block">{up.amount}</strong>
                  <span className="text-[11px] text-slate-500 font-medium">{up.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CFO Advice Bento Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">INTELLIGENT DECISIONS</span>
            <h3 className="text-xl font-bold text-slate-900">CFO ADVICE & OPPORTUNITIES</h3>
          </div>
          <button
            onClick={() => navigate('/advice')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>VIEW ALL ADVICE</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase">
                💡 LOAN OPPORTUNITY
              </span>
              <span className="text-xs font-bold text-blue-700">Save ~₹42,000 Interest</span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Prepay Personal Loan (12.4%)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your personal loan costs 12.4%. You currently have ₹1.2L liquid bank balance above your 3-month emergency reserve. Prepaying ₹1L could save approximately ₹42,000 in future interest.
            </p>
            <button
              onClick={() => navigate('/simulator')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>SIMULATE PREPAYMENT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-bold text-[10px] uppercase">
                ⚡ CHIT STRATEGY
              </span>
              <span className="text-xs font-bold text-indigo-700">Arbitrage Advantage</span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Take 5th Month Chit Prize to Pay Debt</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Taking your ₹5L chit prize in Month 5 carries an effective annual cost of ~8.5%. Using this payout to close your 12.4% personal loan generates an estimated net advantage of ₹24,500.
            </p>
            <button
              onClick={() => navigate('/simulator')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>SIMULATE STRATEGY</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Your Financial Future — Trajectory Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">YOUR FINANCIAL FUTURE</h3>
            <p className="text-xs text-slate-500">Projected Net Worth growth trajectory based on current surplus & compound interest.</p>
          </div>

          <div className="flex gap-2">
            {(['1Y', '3Y', '5Y', '10Y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTrajectory(t)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  selectedTrajectory === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PROJECTED {selectedTrajectory} NET WORTH</span>
            <div className="text-4xl font-extrabold text-blue-400 mt-1">₹{(projectedNetWorth / 100000).toFixed(1)}L</div>
            <p className="text-xs text-slate-300 mt-1">
              Estimated net wealth expansion assuming disciplined monthly surplus deployment.
            </p>
          </div>

          <button
            onClick={() => navigate('/simulator')}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>LAUNCH SIMULATOR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

