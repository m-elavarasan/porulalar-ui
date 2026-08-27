import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const BentoCalendarBar: React.FC = () => {
  const [activeDay, setActiveDay] = useState<number>(5); // Thu 5

  const days = [
    { dayName: 'Mon', dateNum: 2, hasDot: true, dotColor: 'bg-amber-400' },
    { dayName: 'Tue', dateNum: 3, hasDot: true, dotColor: 'bg-sky-400' },
    { dayName: 'Wed', dateNum: 4, hasDot: true, dotColor: 'bg-rose-400' },
    { dayName: 'Thu', dateNum: 5, hasDot: true, dotColor: 'bg-emerald-400' },
    { dayName: 'Fri', dateNum: 6, hasDot: true, dotColor: 'bg-amber-400' },
    { dayName: 'Sat', dateNum: 7, hasDot: true, dotColor: 'bg-rose-400' },
    { dayName: 'Sun', dateNum: 8, hasDot: true, dotColor: 'bg-sky-400' },
  ];

  return (
    <div className="bento-card p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs border border-slate-200/80">
      {/* Date Header & Month Switcher (Matching Image 4 "December 2-8 < > Month") */}
      <div className="flex items-center gap-3">
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          July 12–19, 2026
        </h3>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-rose-600 transition-all cursor-pointer">
            ‹
          </button>
          <button className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-rose-600 transition-all cursor-pointer">
            ›
          </button>
        </div>
      </div>

      {/* Days of Week Pills (Matching Image 4 Thu 5 active pink/coral pill style) */}
      <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto scrollbar-none py-1 flex-1 max-w-xl">
        {days.map((item) => {
          const isActive = item.dateNum === activeDay;
          return (
            <div
              key={item.dateNum}
              onClick={() => setActiveDay(item.dateNum)}
              className={`flex-1 min-w-[50px] py-2.5 px-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20 scale-105'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className={`text-[10px] font-bold ${isActive ? 'text-rose-100' : 'text-slate-400'}`}>
                {item.dayName}
              </span>
              <span className="text-sm font-black mt-0.5">{item.dateNum}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${item.dotColor}`} />
            </div>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 px-3.5 py-1.5 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-700">
        <CalendarIcon size={14} className="text-slate-500" />
        <span>Month View</span>
      </div>
    </div>
  );
};
