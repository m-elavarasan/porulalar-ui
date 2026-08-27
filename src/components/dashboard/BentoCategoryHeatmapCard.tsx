import React from 'react';
import { Layers, ChevronDown, MoreHorizontal } from 'lucide-react';

interface CategoryMatrixItem {
  category: string;
  w1: number;
  w2: number;
  w3: number;
  w4: number;
}

interface BentoCategoryHeatmapCardProps {
  categoryMatrix?: CategoryMatrixItem[];
}

export const BentoCategoryHeatmapCard: React.FC<BentoCategoryHeatmapCardProps> = ({
  categoryMatrix = [
    { category: 'Dining & Food', w1: 120, w2: 240, w3: 180, w4: 310 },
    { category: 'Shopping & Style', w1: 210, w2: 80, w3: 450, w4: 120 },
    { category: 'Bills & Utilities', w1: 500, w2: 500, w3: 500, w4: 500 },
    { category: 'Investments & SIPs', w1: 350, w2: 200, w3: 400, w4: 600 },
  ],
}) => {
  const getShadeClass = (val: number) => {
    if (val < 150) return 'bg-blue-100/90 text-blue-900';
    if (val < 250) return 'bg-blue-300 text-blue-950';
    if (val < 400) return 'bg-blue-500 text-white';
    if (val < 550) return 'bg-blue-700 text-white';
    return 'bg-blue-950 text-white';
  };

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-blue-600" />
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Category Spending Heatmap Matrix
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1">
            <span>Weekly</span>
            <ChevronDown size={12} />
          </button>
          <button className="text-slate-400 hover:text-slate-700">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {categoryMatrix.map((item) => (
          <div key={item.category} className="grid grid-cols-12 gap-3 items-center text-xs">
            <span className="col-span-4 font-extrabold text-slate-800 truncate">
              {item.category}
            </span>

            <div className="col-span-8 grid grid-cols-4 gap-2">
              {[item.w1, item.w2, item.w3, item.w4].map((val, idx) => (
                <div
                  key={idx}
                  className={`h-9 rounded-xl flex items-center justify-center font-black text-[10px] transition-all hover:scale-105 cursor-pointer shadow-xs ${getShadeClass(val)}`}
                >
                  ₹{val}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
        <span>Low Intensity</span>
        <div className="flex items-center gap-1">
          <span className="w-5 h-3 rounded-md bg-blue-100" />
          <span className="w-5 h-3 rounded-md bg-blue-300" />
          <span className="w-5 h-3 rounded-md bg-blue-500" />
          <span className="w-5 h-3 rounded-md bg-blue-700" />
          <span className="w-5 h-3 rounded-md bg-blue-950" />
        </div>
        <span>High Intensity</span>
      </div>
    </div>
  );
};
