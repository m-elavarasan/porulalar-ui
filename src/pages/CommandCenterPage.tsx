import React, { useState, useEffect } from 'react';
import { cfoService } from '../services/cfoService';
import { CFOOverviewResponse } from '../types';
import { CFOHeader } from '../components/command-center/CFOHeader';
import { NetWorthHero } from '../components/command-center/NetWorthHero';
import { PersonalROCECard } from '../components/command-center/PersonalROCECard';
import { AssetCommandMatrix } from '../components/command-center/AssetCommandMatrix';
import { CapitalDeploymentHeatmap } from '../components/command-center/CapitalDeploymentHeatmap';
import { CapitalAllocationCard } from '../components/command-center/CapitalAllocationCard';
import { LiquidityForecastCard } from '../components/command-center/LiquidityForecastCard';
import { CFOInsightCard } from '../components/command-center/CFOInsightCard';
import { ScenarioStudioModal } from '../components/scenarios/ScenarioStudioModal';
import { Sliders, RefreshCw, Sparkles, Scale } from 'lucide-react';

export const CommandCenterPage: React.FC = () => {
  const [data, setData] = useState<CFOOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isScenarioOpen, setIsScenarioOpen] = useState<boolean>(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cfoService.getCFOOverview();
      setData(res);
    } catch (e: any) {
      console.error('Failed to load CFO overview', e);
      setError(e?.message || 'Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <span className="text-sm font-semibold uppercase tracking-wider font-crowz-header text-slate-700">
          Syncing Financial Model & Live Market Data...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center text-slate-500">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-lg">
          <h3 className="text-lg font-bold text-rose-800 font-crowz-header">Connection Error</h3>
          <p className="text-xs text-rose-600">{error || 'Unable to fetch CFO Overview data.'}</p>
          <button
            onClick={fetchOverview}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-saas cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* CFO Header */}
      <CFOHeader updatedMinutesAgo={data.updatedMinutesAgo} />

      {/* Global Net Worth Hero & 20Y Trajectory Chart */}
      <NetWorthHero
        netWorth={data.netWorth}
        netWorthYtdChange={data.netWorthYtdChange}
        netWorthYtdChangePct={data.netWorthYtdChangePct}
        netWorthCagr={data.netWorthCagr}
        portfolioRoce={data.portfolioRoce}
        investedCapital={data.investedCapital}
        liquidCapital={data.liquidCapital}
        totalDebt={data.totalDebt}
        trajectory={data.trajectoryChart}
      />

      {/* Action Bar for Scenario Studio */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-crowz-header">SCENARIO STUDIO</h3>
            <p className="text-xs text-slate-300">
              Simulate major capital decisions (Start Business, Real Estate, Market Downturns).
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScenarioOpen(true)}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-saas flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>LAUNCH SCENARIO STUDIO</span>
        </button>
      </div>

      {/* Personal ROCE Efficiency */}
      <PersonalROCECard roce={data.personalRoce} />

      {/* Strategic Asset Matrix */}
      <AssetCommandMatrix items={data.assetCommandMatrix} />

      {/* Capital Deployment Heatmap & Idle Capital Detector */}
      <CapitalDeploymentHeatmap
        idle={data.idleCapital}
        matrix={data.assetCommandMatrix}
        onExploreStrategy={() => setIsScenarioOpen(true)}
      />

      {/* Capital Allocation Engine */}
      <CapitalAllocationCard allocation={data.capitalAllocation} />

      {/* Liquidity Forecast Command */}
      <LiquidityForecastCard liquidity={data.liquidity} cashflow={data.rollingCashflow} />

      {/* CFO Deterministic Insights Grid */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              CFO BRIEF
            </span>
            <h3 className="text-2xl font-bold font-crowz-header text-slate-900">
              STRATEGIC INSIGHTS & ACTIONS
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.insights.map((ins) => (
            <CFOInsightCard
              key={ins.id}
              insight={ins}
              onExploreAction={() => setIsScenarioOpen(true)}
            />
          ))}
        </div>
      </div>

      {/* Scenario Studio Modal */}
      <ScenarioStudioModal
        isOpen={isScenarioOpen}
        onClose={() => setIsScenarioOpen(false)}
      />
    </div>
  );
};
