import React from 'react';
import { Layers, ChevronDown } from 'lucide-react';

interface FundMatrixItem {
  fundCategory: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

export const BentoFundMatrixCard: React.FC = () => {
  const fundMatrix: FundMatrixItem[] = [
    { fundCategory: 'Nifty 50 Index Fund', q1: 18.5, q2: 21.2, q3: 24.8, q4: 28.5 },
    { fundCategory: 'Bank Fixed Reserves', q1: 12.0, q2: 12.5, q3: 13.0, q4: 13.8 },
    { fundCategory: 'Gold & Asset Vaults', q1: 8.5, q2: 9.2, q3: 9.8, q4: 10.5 },
    { fundCategory: 'SIP Wealth Builder', q1: 15.0, q2: 18.0, q3: 22.5, q4: 26.0 },
  ];

  const getShadeClass = (val: number) => {
    if (val < 10) return 'bg-indigo-100 text-indigo-900 font-bold';
    if (val < 15) return 'bg-indigo-300 text-indigo-950 font-bold';
    if (val < 22) return 'bg-blue-600 text-white font-extrabold';
    return 'bg-slate-900 text-white font-black';
  };

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-xs border border-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-blue-600" />
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Fund Performance Growth Matrix
          </h3>
        </div>

        <button className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1">
          <span>Quarterly</span>
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Fund Matrix Grid */}
      <div className="space-y-3 pt-1">
        {fundMatrix.map((item) => (
          <div key={item.fundCategory} className="grid grid-cols-12 gap-3 items-center text-xs">
            <span className="col-span-5 font-bold text-slate-800 truncate">
              {item.fundCategory}
            </span>

            <div className="col-span-7 grid grid-cols-4 gap-2">
              {[item.q1, item.q2, item.q3, item.q4].map((val, idx) => (
                <div
                  key={idx}
                  className={`h-9 rounded-xl flex items-center justify-center text-[10px] transition-all hover:scale-105 cursor-pointer shadow-2xs ${getShadeClass(
                    val
                  )}`}
                >
                  ₹{val}L
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Heat Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
        <span>Starting Fund</span>
        <div className="flex items-center gap-1">
          <span className="w-5 h-3 rounded-md bg-indigo-100" />
          <span className="w-5 h-3 rounded-md bg-indigo-300" />
          <span className="w-5 h-3 rounded-md bg-blue-600" />
          <span className="w-5 h-3 rounded-md bg-slate-900" />
        </div>
        <span>Peak Appreciation</span>
      </div>
    </div>
  );
};
