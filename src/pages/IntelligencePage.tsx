import React, { useState, useEffect } from 'react';
import { cfoService } from '../services/cfoService';
import { CFOOverviewResponse } from '../types';
import { CFOInsightCard } from '../components/command-center/CFOInsightCard';
import AIPanel from '../components/AIPanel';
import { RefreshCw, Sparkles, Activity } from 'lucide-react';

export const IntelligencePage: React.FC = () => {
  const [data, setData] = useState<CFOOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    cfoService.getCFOOverview().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-slate-500 font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Synthesizing Deterministic CFO Signals & Grounded AI Context...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">CFO INTELLIGENCE ENGINE</span>
        <h1 className="text-3xl font-extrabold font-crowz-header text-slate-900">STRATEGIC INSIGHTS & GROUNDED AI</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-xl font-bold font-crowz-header text-slate-900 mb-4">ACTIVE CFO INSIGHTS & RADAR</h3>
          {data.insights.map((ins) => (
            <CFOInsightCard key={ins.id} insight={ins} />
          ))}
        </div>

        <div className="lg:col-span-5">
          <AIPanel />
        </div>
      </div>
    </div>
  );
};
