import React, { useState, useEffect } from 'react';
import { cfoService } from '../services/cfoService';
import { CFOOverviewResponse } from '../types';
import { LiquidityForecastCard } from '../components/command-center/LiquidityForecastCard';
import { ScenarioStudioModal } from '../components/scenarios/ScenarioStudioModal';
import { RefreshCw, Layers, Sliders, Sparkles } from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const [data, setData] = useState<CFOOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);

  useEffect(() => {
    cfoService.getCFOOverview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-slate-500 font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Generating 20-Year Projections & Rolling Liquidity Forecast...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">MULTI-YEAR FORECAST</span>
          <h1 className="text-3xl font-extrabold font-crowz-header text-slate-900">WEALTH & LIQUIDITY PROJECTIONS</h1>
        </div>

        <button
          onClick={() => setIsStudioOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-saas flex items-center gap-2"
        >
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>OPEN SCENARIO STUDIO</span>
        </button>
      </div>

      <LiquidityForecastCard liquidity={data.liquidity} cashflow={data.rollingCashflow} />

      <ScenarioStudioModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} />
    </div>
  );
};
