import React, { useState } from 'react';
import { Star, TrendingUp, ChevronRight } from 'lucide-react';

interface RatingsData {
  score: number;
  ratingIncreasePct: number;
  betterThanLastWeek: boolean;
  salesRating: number;
  comparisonInstitution: string;
}

interface BentoRatingsChartCardProps {
  ratings?: RatingsData;
}

export const BentoRatingsChartCard: React.FC<BentoRatingsChartCardProps> = ({
  ratings = {
    score: 88,
    ratingIncreasePct: 72.9,
    betterThanLastWeek: true,
    salesRating: 34.0,
    comparisonInstitution: 'HDFC & Zerodha Combined',
  },
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('HDFC');
  const tags = ['HDFC', 'ICICI', 'Zerodha', 'Axis', 'Cardival'];

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-6 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Institutional Ratings & Yield
          </h3>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
          <button className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-5 space-y-4">
          <div>
            <span className="text-3xl font-black text-slate-900 tracking-tight block">
              {ratings.salesRating}% rating
            </span>
            <span className="text-xs font-semibold text-slate-500 leading-relaxed block mt-1">
              increases every week across linked accounts.
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black">
              <TrendingUp size={14} />
              <span>↗ ₹23.7K 7 Days</span>
            </div>
            <h2 className="text-3xl font-black text-blue-600 tracking-tight mt-1">
              +{ratings.ratingIncreasePct}%
            </h2>
            <span className="text-xs font-bold text-slate-500">
              better than last month performance
            </span>
          </div>

          <div className="flex items-center gap-4 pt-2 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-lime-400" />
              <span>Total Yield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-600" />
              <span>Prospect Growth</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 flex items-end justify-between gap-3 h-48 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex-1 flex items-end justify-center gap-1.5 h-full">
            <div className="w-full max-w-[28px] h-[35%] bg-blue-600 rounded-2xl transition-all hover:opacity-90" />
            <div className="w-full max-w-[28px] h-[90%] bg-lime-400 rounded-2xl transition-all hover:opacity-90" />
          </div>

          <div className="flex-1 flex items-end justify-center gap-1.5 h-full">
            <div className="w-full max-w-[28px] h-[50%] bg-blue-600 rounded-2xl transition-all hover:opacity-90" />
            <div className="w-full max-w-[28px] h-[65%] bg-lime-400 rounded-2xl transition-all hover:opacity-90" />
          </div>

          <div className="flex-1 flex items-end justify-center gap-1.5 h-full">
            <div className="w-full max-w-[28px] h-[75%] bg-blue-600 rounded-2xl transition-all hover:opacity-90" />
            <div className="w-full max-w-[28px] h-[40%] bg-lime-400 rounded-2xl transition-all hover:opacity-90" />
          </div>
        </div>
      </div>
    </div>
  );
};
