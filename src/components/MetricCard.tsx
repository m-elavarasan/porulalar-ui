import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  accentBg?: string;
  sparklineData?: number[];
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  icon,
  accentBg,
  onClick,
}) => {
  const getBadgeStyle = () => {
    if (changeType === 'positive') return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    if (changeType === 'negative') return 'bg-rose-50 text-rose-700 border-rose-200/60';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getIcon = () => {
    if (changeType === 'positive') return <ArrowUpRight size={12} />;
    if (changeType === 'negative') return <ArrowDownRight size={12} />;
    return <Minus size={12} />;
  };

  return (
    <div
      onClick={onClick}
      className={`saas-card p-5 hover-elevate transition-saas bg-white flex flex-col justify-between relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${accentBg || ''}`}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-100/80 text-slate-700 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
          {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
        </h2>
      </div>

      {/* Bottom Subtitle & Trend Chip */}
      <div className="flex items-center justify-between text-xs pt-1">
        {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
        
        {change && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeStyle()}`}>
            {getIcon()}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
};
