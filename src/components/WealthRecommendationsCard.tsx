import React, { useState } from 'react';
import { Recommendation } from '../types';
import { v2Service } from '../services/v2Service';
import {
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Zap,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WealthRecommendationsCardProps {
  recommendations: Recommendation[];
  onSimulate?: (recommendation: Recommendation) => void;
  onRefresh?: () => void;
}

export const WealthRecommendationsCard: React.FC<WealthRecommendationsCardProps> = ({
  recommendations,
  onSimulate,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleDismiss = async (rec: Recommendation, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingId(rec.id);
    try {
      await v2Service.updateRecommendationStatus(rec.id, 'DISMISSED');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAction = async (rec: Recommendation) => {
    setUpdatingId(rec.id);
    try {
      await v2Service.updateRecommendationStatus(rec.id, 'ACCEPTED');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
    if (rec.actionRoute) {
      navigate(rec.actionRoute);
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="saas-card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl space-y-2 border border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald-400" size={18} />
          <h3 className="font-bold text-sm">Wealth Optimization Status</h3>
        </div>
        <p className="text-xs text-slate-300">
          Your finances are currently operating at peak efficiency. No immediate debt or cash allocation bottlenecks detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Zap size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Highest-Impact Wealth Opportunities</h2>
            <span className="text-[11px] text-slate-500 font-medium">Calculated decisions to grow and protect wealth</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
          {recommendations.length} Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const isCritical = rec.urgency === 'CRITICAL';
          const isHigh = rec.urgency === 'HIGH';

          return (
            <div
              key={rec.id}
              className={`saas-card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg border ${
                isCritical
                  ? 'border-rose-300/80 bg-gradient-to-b from-rose-50/50 via-white to-white'
                  : isHigh
                  ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/40 via-white to-white'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="space-y-3">
                {/* Header Urgency & Category */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                      isCritical
                        ? 'bg-rose-500/15 text-rose-700 border border-rose-400/30'
                        : isHigh
                        ? 'bg-amber-500/15 text-amber-800 border border-amber-400/30'
                        : 'bg-indigo-500/15 text-indigo-800 border border-indigo-400/30'
                    }`}
                  >
                    {rec.type.replace('_', ' ')}
                  </span>

                  <span className="text-[10px] font-bold text-slate-400">
                    Confidence: {rec.confidence}%
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                {/* Mathematical Why / Reason */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Financial Impact</span>
                  <div className="text-xs font-black text-emerald-700 flex items-center gap-1">
                    <TrendingUp size={14} className="text-emerald-600" />
                    <span>{rec.impact}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic leading-tight pt-1">
                    "{rec.reason}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  disabled={updatingId === rec.id}
                  onClick={(e) => handleDismiss(rec, e)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>

                <div className="flex items-center gap-2">
                  {onSimulate && rec.simulationType && (
                    <button
                      onClick={() => onSimulate(rec)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders size={13} />
                      <span>Simulate</span>
                    </button>
                  )}

                  <button
                    disabled={updatingId === rec.id}
                    onClick={() => handleAction(rec)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{rec.suggestedAction || 'Take Action'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
