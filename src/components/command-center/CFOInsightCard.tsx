import React from 'react';
import { CFOInsightItem } from '../../types';
import { ShieldAlert, Sparkles, Scale, Award, ArrowRight } from 'lucide-react';

interface CFOInsightCardProps {
  insight: CFOInsightItem;
  onExploreAction?: () => void;
}

export const CFOInsightCard: React.FC<CFOInsightCardProps> = ({
  insight,
  onExploreAction,
}) => {
  const getTypeBadge = () => {
    switch (insight.type) {
      case 'RISK':
        return {
          icon: ShieldAlert,
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          badgeBg: 'bg-rose-600 text-white',
        };
      case 'OPPORTUNITY':
        return {
          icon: Sparkles,
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          badgeBg: 'bg-teal-600 text-white',
        };
      case 'DECISION':
        return {
          icon: Scale,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          badgeBg: 'bg-blue-600 text-white',
        };
      default:
        return {
          icon: Award,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badgeBg: 'bg-emerald-600 text-white',
        };
    }
  };

  const style = getTypeBadge();
  const Icon = style.icon;

  return (
    <div className={`p-6 rounded-3xl border ${style.bg} transition-saas relative flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${style.badgeBg} flex items-center gap-1.5`}>
            <Icon className="w-3.5 h-3.5" />
            {insight.type}
          </span>
          <span className="text-xs font-bold text-slate-500 opacity-80">
            {insight.confidence}% Confidence
          </span>
        </div>

        <h4 className="text-lg font-bold font-crowz-header text-slate-900 mb-4">
          {insight.title}
        </h4>

        {/* Structured Observation -> Why -> Impact -> Recommendation Flow */}
        <div className="space-y-3 text-xs text-slate-700 font-medium">
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">OBSERVATION</span>
            <p className="text-slate-800 leading-relaxed font-semibold">{insight.observation}</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">WHY</span>
            <p className="text-slate-700 leading-relaxed">{insight.why}</p>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/60 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">FINANCIAL IMPACT</span>
            <p className="text-slate-900 font-bold leading-relaxed">{insight.impact}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-sm">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">CFO RECOMMENDATION</span>
            <p className="leading-relaxed text-xs font-semibold">{insight.recommendation}</p>
          </div>
        </div>
      </div>

      {onExploreAction && (
        <button
          onClick={onExploreAction}
          className="mt-4 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 flex items-center justify-center gap-2 transition-saas shadow-2xs"
        >
          <span>EXPLORE DECISION</span>
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </button>
      )}
    </div>
  );
};
