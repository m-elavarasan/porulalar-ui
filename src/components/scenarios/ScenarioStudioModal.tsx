import React, { useState, useEffect } from 'react';
import { X, Sliders, TrendingUp, Sparkles, AlertCircle, ArrowUpRight, Scale } from 'lucide-react';
import { cfoService } from '../../services/cfoService';
import { ScenarioInputVariables, ScenarioOutputResult } from '../../types';

interface ScenarioStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScenarioStudioModal: React.FC<ScenarioStudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [scenarioType, setScenarioType] = useState<string>('Start Business');
  const [initialCapital, setInitialCapital] = useState<number>(1000000);
  const [revenueGrowth, setRevenueGrowth] = useState<number>(8);
  const [operatingMargin, setOperatingMargin] = useState<number>(22);
  const [investmentReturn, setInvestmentReturn] = useState<number>(12);
  const [inflation, setInflation] = useState<number>(5);
  const [horizonYears, setHorizonYears] = useState<number>(10);

  const [result, setResult] = useState<ScenarioOutputResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    runSimulation();
  }, [isOpen, initialCapital, revenueGrowth, operatingMargin, investmentReturn, inflation, horizonYears]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const input: ScenarioInputVariables = {
        initialCapital,
        revenueGrowth,
        operatingMargin,
        investmentReturn,
        inflation,
        horizonYears,
      };
      const res = await cfoService.runScenarioSimulation(input);
      setResult(res);
    } catch (e) {
      console.error('Failed to run scenario', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setScenarioType(preset);
    if (preset === 'Start Business') {
      setInitialCapital(1000000);
      setRevenueGrowth(8);
      setOperatingMargin(22);
      setInvestmentReturn(12);
    } else if (preset === 'Buy Property') {
      setInitialCapital(2500000);
      setRevenueGrowth(6);
      setOperatingMargin(15);
      setInvestmentReturn(9);
    } else if (preset === 'Market Crash (-25%)') {
      setInitialCapital(800000);
      setRevenueGrowth(-10);
      setOperatingMargin(10);
      setInvestmentReturn(-5);
    } else if (preset === 'Income Shock (-20%)') {
      setInitialCapital(500000);
      setRevenueGrowth(-5);
      setOperatingMargin(12);
      setInvestmentReturn(4);
    }
  };

  const formatLakhs = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                CFO SCENARIO ENGINE
              </span>
              <h3 className="text-2xl font-bold font-crowz-header text-slate-900">
                SCENARIO STUDIO
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-saas"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {['Start Business', 'Buy Property', 'Market Crash (-25%)', 'Income Shock (-20%)'].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-saas ${
                scenarioType === preset
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              [ {preset} ]
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Initial Capital Commitment</span>
                <span className="text-blue-600">{formatLakhs(initialCapital)}</span>
              </div>
              <input
                type="range"
                min={100000}
                max={10000000}
                step={100000}
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Revenue Growth</span>
                <span className="text-blue-600">{revenueGrowth}%</span>
              </div>
              <input
                type="range"
                min={-20}
                max={40}
                step={1}
                value={revenueGrowth}
                onChange={(e) => setRevenueGrowth(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Operating Margin</span>
                <span className="text-blue-600">{operatingMargin}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={operatingMargin}
                onChange={(e) => setOperatingMargin(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Investment Yield / Return</span>
                <span className="text-blue-600">{investmentReturn}%</span>
              </div>
              <input
                type="range"
                min={-10}
                max={30}
                step={1}
                value={investmentReturn}
                onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Time Horizon</span>
                <span className="text-blue-600">{horizonYears} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={horizonYears}
                onChange={(e) => setHorizonYears(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-6 bento-card-dark p-6 rounded-3xl flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-4">
                SIMULATED FINANCIAL OUTPUT
              </span>

              {result && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">BASE CASE</span>
                      <span className="text-sm font-bold text-white">{formatLakhs(result.baseNetWorth)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-1">SCENARIO</span>
                      <span className="text-sm font-black text-emerald-400">{formatLakhs(result.scenarioNetWorth)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-400 uppercase font-semibold block mb-1">DELTA</span>
                      <span className={`text-sm font-black ${result.deltaNetWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {result.deltaNetWorth >= 0 ? '+' : ''}{formatLakhs(result.deltaNetWorth)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold mb-6">
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ROCE</span>
                      <span className="text-base font-extrabold text-blue-400">{result.roce}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-0.5">IRR</span>
                      <span className="text-base font-extrabold text-purple-400">{result.irr}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-0.5">NPV</span>
                      <span className="text-base font-extrabold text-emerald-400">{formatLakhs(result.npv)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 col-span-2 sm:col-span-3">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ANNUAL NET CASHFLOW</span>
                      <span className="text-base font-extrabold text-white">{formatLakhs(result.annualCashflow)} / year</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-saas shadow-lg"
            >
              CONFIRM & EXPLORE DECISION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
