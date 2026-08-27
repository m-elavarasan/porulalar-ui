import React, { useState, useEffect } from 'react';
import { cfoService } from '../services/cfoService';
import { CFOOverviewResponse } from '../types';
import { CapitalAllocationCard } from '../components/command-center/CapitalAllocationCard';
import { CapitalDeploymentHeatmap } from '../components/command-center/CapitalDeploymentHeatmap';
import { RefreshCw, PieChart, Zap } from 'lucide-react';

export const CapitalPage: React.FC = () => {
  const [data, setData] = useState<CFOOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    cfoService.getCFOOverview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-slate-500 font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Evaluating Capital Allocation & Deployment Heatmap...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">CAPITAL DEPLOYMENT</span>
        <h1 className="text-3xl font-extrabold font-crowz-header text-slate-900">CAPITAL ALLOCATION & IDLE CAPITAL ENGINE</h1>
      </div>

      <CapitalAllocationCard allocation={data.capitalAllocation} />
      <CapitalDeploymentHeatmap idle={data.idleCapital} matrix={data.assetCommandMatrix} />
    </div>
  );
};
