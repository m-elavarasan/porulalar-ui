import React, { useState } from 'react';
import { CheckCircle2, Circle, MoreHorizontal, Check, X } from 'lucide-react';

export interface DailyTask {
  id: string;
  title: string;
  time: string;
  amount: string;
  completed: boolean;
  category?: string;
}

interface BentoDailyTasksPanelProps {
  tasks?: DailyTask[];
  onToggleTask?: (id: string) => void;
}

export const BentoDailyTasksPanel: React.FC<BentoDailyTasksPanelProps> = ({
  tasks: initialTasks = [
    { id: 't1', title: 'HDFC Credit Card Bill Payment', time: 'Due Today', amount: '₹14,200', completed: false, category: 'Bills' },
    { id: 't2', title: 'Nifty 50 Index SIP Auto-Debit', time: 'Tomorrow', amount: '₹10,000', completed: true, category: 'Investments' },
    { id: 't3', title: 'Review Parsed Gmail Statement #104', time: 'Pending Review', amount: '2 Items', completed: false, category: 'Gmail' },
    { id: 't4', title: 'Emergency Fund Rebalance', time: '25 Jul, 2026', amount: '₹25,000', completed: false, category: 'Goals' },
    { id: 't5', title: 'Verify Bank Account Liquidity', time: 'Completed', amount: '₹42,000', completed: true, category: 'Banks' },
  ],
}) => {
  const [taskList, setTaskList] = useState<DailyTask[]>(initialTasks);
  const [challengeStatus, setChallengeStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const toggleTask = (id: string) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const remainingCount = taskList.filter((t) => !t.completed).length;

  return (
    <div className="bento-card-lime p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-md border border-lime-300/80">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-lime-900/80">
          My daily tasks
        </span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-lime-300/80 flex items-center justify-center font-black text-xs text-lime-950">
            {remainingCount}
          </div>
          <button className="text-lime-900 hover:text-lime-950 p-1">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Counter Callout */}
      <div className="text-center py-2 space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-lime-950 tracking-tight leading-tight">
          You have <br />
          <span className="text-2xl sm:text-3xl text-slate-900 underline decoration-lime-500 font-extrabold">
            {remainingCount} new tasks
          </span>{' '}
          remaining
        </h2>
      </div>

      {/* Task Group Card Header */}
      <div className="bg-lime-200/60 p-3.5 rounded-2xl border border-lime-300/60 flex items-center justify-between text-xs font-bold text-lime-950">
        <div className="flex items-center gap-2">
          <span className="text-base">🏦</span>
          <div>
            <span className="block font-black">Financial Automations</span>
            <span className="text-[10px] font-semibold text-lime-800">
              Task ({taskList.filter((t) => t.completed).length}/{taskList.length})
            </span>
          </div>
        </div>
        <MoreHorizontal size={16} className="text-lime-800" />
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {taskList.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-3.5 rounded-2xl bg-white border transition-all flex items-center justify-between text-xs cursor-pointer select-none ${
              task.completed
                ? 'border-lime-200 opacity-70 bg-lime-50/50'
                : 'border-slate-200/90 shadow-xs hover:border-lime-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <button className="text-lime-600 focus:outline-none">
                {task.completed ? (
                  <CheckCircle2 size={18} className="text-lime-600 fill-lime-100" />
                ) : (
                  <Circle size={18} className="text-slate-400" />
                )}
              </button>
              <div>
                <span
                  className={`font-extrabold block text-slate-900 ${
                    task.completed ? 'line-through text-slate-400 font-medium' : ''
                  }`}
                >
                  {task.title}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{task.amount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                {task.time}
              </span>
              <span className="text-slate-300 font-mono text-xs">≡</span>
            </div>
          </div>
        ))}
      </div>

      {/* Challenge Card */}
      <div className="bg-white p-4 rounded-2xl border border-lime-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <span className="flex items-center gap-1.5 text-slate-900 font-black">
            Challenge Invitation
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center">
              5
            </span>
          </span>
          <MoreHorizontal size={16} className="text-slate-400" />
        </div>
        <p className="text-[10px] text-slate-400 font-semibold">From June to December, 2026</p>

        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shadow-xs mb-2">
            🏆💰
          </div>
          <h4 className="font-extrabold text-sm text-slate-900">30-Day Wealth Reserve #5</h4>
          <span className="text-[11px] text-slate-500 font-semibold">25 Jul, 2026</span>
        </div>

        {challengeStatus === 'pending' ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setChallengeStatus('accepted')}
              className="py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              <span>Accept</span>
            </button>
            <button
              onClick={() => setChallengeStatus('rejected')}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <X size={14} />
              <span>Reject</span>
            </button>
          </div>
        ) : (
          <div
            className={`p-2.5 rounded-xl text-center text-xs font-extrabold ${
              challengeStatus === 'accepted'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {challengeStatus === 'accepted' ? '✓ Challenge Accepted! Good luck 🎉' : 'Challenge Declined'}
          </div>
        )}
      </div>
    </div>
  );
};
