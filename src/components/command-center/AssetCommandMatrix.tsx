import React from 'react';
import { AssetCommandItem } from '../../types';
import { Layers, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface AssetCommandMatrixProps {
  items: AssetCommandItem[];
}

export const AssetCommandMatrix: React.FC<AssetCommandMatrixProps> = ({ items }) => {
  const formatLakhs = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold border border-rose-200">High Risk</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold border border-amber-200">Medium</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200">Low Risk</span>;
    }
  };

  return (
    <div className="bento-card p-6 rounded-3xl mb-8 border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            STRATEGIC ASSET MATRIX
          </span>
          <h3 className="text-xl font-bold font-crowz-header text-slate-900">
            ASSET COMMAND
          </h3>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {items.length} Assets Tracked
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 font-medium">
          <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="py-3 px-4 rounded-l-xl">Asset</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Capital</th>
              <th className="py-3 px-4">Current Value</th>
              <th className="py-3 px-4">Return</th>
              <th className="py-3 px-4">ROCE</th>
              <th className="py-3 px-4">Cash Yield</th>
              <th className="py-3 px-4">Risk</th>
              <th className="py-3 px-4 rounded-r-xl">Liquidity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80 transition-saas">
                <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                  {row.assetName}
                  <span className="block text-[11px] font-normal text-slate-400">{row.assetType}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                    {row.category}
                  </span>
                </td>
                <td className="py-4 px-4 font-semibold text-slate-800">{formatLakhs(row.capitalDeployed)}</td>
                <td className="py-4 px-4 font-bold text-slate-900">{formatLakhs(row.currentValue)}</td>
                <td className="py-4 px-4">
                  <span className={`font-bold ${row.returnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.returnPct >= 0 ? '+' : ''}{row.returnPct}%
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-extrabold text-blue-600 text-sm">{row.roce}%</span>
                </td>
                <td className="py-4 px-4 text-slate-700">
                  {row.cashYield > 0 ? formatLakhs(row.cashYield) : '—'}
                </td>
                <td className="py-4 px-4">{getRiskBadge(row.riskLevel)}</td>
                <td className="py-4 px-4">
                  <span className="text-slate-600 font-semibold">{row.liquidityLevel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
