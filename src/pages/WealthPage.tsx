import React, { useState, useEffect } from 'react';
import { cfoService } from '../services/cfoService';
import { CFOOverviewResponse } from '../types';
import { NetWorthHero } from '../components/command-center/NetWorthHero';
import { PersonalROCECard } from '../components/command-center/PersonalROCECard';
import { AssetCommandMatrix } from '../components/command-center/AssetCommandMatrix';
import { TrendingUp, RefreshCw, ShieldCheck, DollarSign, Wallet } from 'lucide-react';

export const WealthPage: React.FC = () => {
  const [data, setData] = useState<CFOOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    cfoService.getCFOOverview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-slate-500 font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Loading Wealth Trajectory & Portfolio Performance...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">WEALTH STRATEGY</span>
        <h1 className="text-3xl font-extrabold font-crowz-header text-slate-900">NET WORTH & ASSET PERFORMANCE</h1>
      </div>

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

      <PersonalROCECard roce={data.personalRoce} />
      <AssetCommandMatrix items={data.assetCommandMatrix} />
    </div>
  );
};
