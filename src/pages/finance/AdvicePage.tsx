import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cfoService } from '../../services/cfoService';
import { CFOAdviceItem } from '../../types';
import { Sparkles, AlertTriangle, ShieldAlert, TrendingUp, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AdvicePage: React.FC = () => {
  const [adviceList, setAdviceList] = useState<CFOAdviceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const res = await cfoService.getAdviceList();
      setAdviceList(res || []);
    } catch (e) {
      console.error('Failed to load CFO Advice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>PERSONAL CFO ADVICE ENGINE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            CFO ADVICE & STRATEGIC ACTIONS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            High-impact financial recommendations ranked by risk, return, and cashflow optimization.
          </p>
        </div>

        <button
          onClick={fetchAdvice}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH INSIGHTS</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-semibold">Running Financial Rules & CFO Intelligence Engine...</p>
        </div>
      ) : adviceList.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Your Finances Look Optimal!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No critical financial risks or urgent debt optimizations detected. Use the Central Simulator to explore future scenarios.
          </p>
          <button
            onClick={() => navigate('/simulator')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md"
          >
            OPEN SIMULATOR
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adviceList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    item.severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : item.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.category || 'CFO ADVICE'}
                </span>
                <span className="text-xs font-bold text-slate-400">Impact: +₹{item.impactAmount?.toLocaleString()}</span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.actionSummary}</p>
              </div>

              {/* Structured WHAT / WHY / CALCULATION / RISK / ACTION */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <strong className="text-slate-900 block font-bold">WHY THIS MATTERS:</strong>
                  <p className="text-slate-600">{item.explainableReason}</p>
                </div>

                {item.steps && item.steps.length > 0 && (
                  <div>
                    <strong className="text-slate-900 block font-bold">RECOMMENDED STEPS:</strong>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5 mt-0.5">
                      {item.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Severity: {item.severity}</span>
                </div>

                <button
                  onClick={() => navigate('/simulator')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>SIMULATE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
