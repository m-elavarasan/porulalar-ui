import React from 'react';
import { ShieldCheck, TrendingUp, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';

interface CreditHealthCardProps {
  score?: number;
  maxScore?: number;
  status?: string;
  netWorth?: number;
  savingsRate?: number;
}

export const CreditHealthCard: React.FC<CreditHealthCardProps> = ({
  score = 345,
  maxScore = 900,
  status = 'Excellent',
  netWorth = 0,
  savingsRate = 0,
}) => {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const radius = 68;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * (circumference / 2);

  return (
    <div className="mint-health-card rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
      {/* Top Navigation Row matching Image */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-9 w-9 rounded-full bg-white/80 border border-[#bce8e2] flex items-center justify-center text-[#181e29] shadow-2xs">
          <ChevronLeft className="h-5 w-5" />
        </div>
        <h3 className="text-base font-black text-[#181e29]">Credit Health</h3>
        <div className="w-9" />
      </div>

      <div className="text-center my-2">
        <span className="text-xs font-bold text-slate-700">You have <strong className="text-[#181e29] font-black">{status.toLowerCase()}</strong> credit</span>
      </div>

      {/* Dark Arc Semi-Circle Gauge matching Image Bottom Right */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="relative flex flex-col items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
            <circle
              stroke="rgba(255, 255, 255, 0.7)"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#181e29"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute flex flex-col items-center -mt-2">
            <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-0.5">
              ↑ 12 pts
            </span>
            <span className="text-4xl font-black text-[#181e29] tracking-tight">{score}</span>
            <span className="text-[11px] text-slate-600 font-bold mt-0.5">{status}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-600 font-semibold border-t border-[#bce8e2] pt-3">
        Next check tomorrow
      </div>
    </div>
  );
};
