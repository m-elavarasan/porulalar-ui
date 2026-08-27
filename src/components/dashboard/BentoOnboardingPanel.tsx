import React, { useState } from 'react';
import { CheckCircle2, Circle, MoreHorizontal, ShieldCheck, ArrowRight } from 'lucide-react';

export interface OnboardingTask {
  id: string;
  title: string;
  subtitle: string;
  statusText: string;
  completed: boolean;
}

export const BentoOnboardingPanel: React.FC = () => {
  const [tasks, setTasks] = useState<OnboardingTask[]>([
    {
      id: 'ob1',
      title: 'Link Primary Bank Account Vault',
      subtitle: 'Connect HDFC & Axis Bank for automated balance sync',
      statusText: 'Completed',
      completed: true,
    },
    {
      id: 'ob2',
      title: 'Setup Automated Nifty 50 SIP',
      subtitle: 'Set up ₹10,000 monthly auto-debit for wealth accumulation',
      statusText: 'Completed',
      completed: true,
    },
    {
      id: 'ob3',
      title: 'Configure Credit Utilization Shield',
      subtitle: 'Set auto-alerts when Axis Magnus reaches 30% limit',
      statusText: 'In Progress',
      completed: false,
    },
    {
      id: 'ob4',
      title: 'Set Emergency Fund Reserve Target',
      subtitle: 'Target ₹2.5L liquid cash in HDFC Savings Vault',
      statusText: 'Pending',
      completed: false,
    },
    {
      id: 'ob5',
      title: 'Connect Demat Investment Portfolio',
      subtitle: 'Sync Zerodha & AngelOne portfolio holdings',
      statusText: 'Pending',
      completed: false,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="bento-card p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-xs border border-slate-200/80 bg-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Wealth Onboarding Checklist
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
            {completedCount}/{tasks.length} Completed
          </span>
          <button className="text-slate-400 hover:text-slate-700">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Progress Bar Callout */}
      <div className="space-y-2 py-1">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-extrabold text-slate-900 text-base">
            Portfolio Setup Status
          </h3>
          <span className="font-black text-blue-600 text-sm">{progressPct}%</span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* Onboarding Task List */}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none ${
              task.completed
                ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <button className="mt-0.5 text-blue-600 focus:outline-none">
                {task.completed ? (
                  <CheckCircle2 size={18} className="text-blue-600 fill-blue-100" />
                ) : (
                  <Circle size={18} className="text-slate-400" />
                )}
              </button>
              <div>
                <span
                  className={`font-bold text-xs block leading-tight text-slate-900 ${
                    task.completed ? 'line-through text-slate-400 font-medium' : ''
                  }`}
                >
                  {task.title}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {task.subtitle}
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                task.completed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {task.statusText}
            </span>
          </div>
        ))}
      </div>

      {/* Goal Callout Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-indigo-800/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h4 className="font-extrabold text-xs tracking-wide text-white">Porulalar Wealth Guarantee</h4>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
          Completing your onboarding checklist ensures 100% automated credit card shields and accurate MoM fund growth reports.
        </p>
      </div>
    </div>
  );
};
