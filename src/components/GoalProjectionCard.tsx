import React from 'react';
import { GoalProjectionSummary, Goal } from '../types';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GoalProjectionCardProps {
  summary: GoalProjectionSummary;
}

export const GoalProjectionCard: React.FC<GoalProjectionCardProps> = ({ summary }) => {
  const navigate = useNavigate();
  const goals = summary.goals || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Target size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Goal Trajectory & Projections</h2>
            <span className="text-[11px] text-slate-500 font-medium">Mathematically computed milestone outcomes</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/assets')}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Manage Goals ({goals.length})</span>
          <span>→</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="saas-card p-6 text-center space-y-3 rounded-3xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Target size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">No wealth goals defined yet</h4>
            <p className="text-xs text-slate-500 mt-0.5">Define your milestones (e.g. ₹50L Retirement, ₹10L Emergency Fund) to track mathematically.</p>
          </div>
          <button
            onClick={() => navigate('/assets')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Create Wealth Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const status = g.trajectoryStatus || 'ON_TRACK';
            const isOnTrack = status === 'ON_TRACK' || status === 'ACHIEVED';
            const isAtRisk = status === 'AT_RISK';
            const isOffTrack = status === 'OFF_TRACK';

            return (
              <div
                key={g.id}
                className="saas-card p-5 rounded-3xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 bg-white flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900">{g.goalName}</h3>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        status === 'ACHIEVED'
                          ? 'bg-blue-100 text-blue-800'
                          : isOnTrack
                          ? 'bg-emerald-100 text-emerald-800'
                          : isAtRisk
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600">₹{(g.currentAmount || 0).toLocaleString('en-IN')}</span>
                      <span className="text-slate-900">Target: ₹{(g.targetAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOnTrack ? 'bg-emerald-500' : isAtRisk ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, g.progress || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Trajectory Breakdown Box */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Projected at Target Date:</span>
                      <strong className="text-slate-900">₹{(g.projectedOutcome || g.currentAmount || 0).toLocaleString('en-IN')}</strong>
                    </div>

                    {(g.shortfall || 0) > 0 ? (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Projected Shortfall:</span>
                        <span>-₹{(g.shortfall || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>On Track Target:</span>
                        <span>Surplus projected</span>
                      </div>
                    )}

                    {g.targetDate && (
                      <div className="flex justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-200/60">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> Target Date:
                        </span>
                        <span>{g.targetDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Required Action Step-up */}
                {(g.requiredMonthlyContribution || 0) > (g.monthlyContribution || 0) && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60">
                      <strong>Action Needed:</strong> Increase monthly contribution by{' '}
                      <strong>
                        ₹{Math.round((g.requiredMonthlyContribution || 0) - (g.monthlyContribution || 0)).toLocaleString('en-IN')}/mo
                      </strong>{' '}
                      to hit target.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
