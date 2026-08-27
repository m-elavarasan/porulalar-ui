import React from 'react';
import { Building2, MoreHorizontal } from 'lucide-react';

interface AccountItem {
  id: string;
  name: string;
  subtitle: string;
  countInfo: string;
  amount: string;
  tag: string;
  tagType: 'Beginner' | 'Pro' | 'Advanced' | 'Expert';
  status: 'Open' | 'Linked' | 'Active';
}

interface BentoAccountsListCardProps {
  onNavigate: (path: string) => void;
}

export const BentoAccountsListCard: React.FC<BentoAccountsListCardProps> = ({ onNavigate }) => {
  const accounts: AccountItem[] = [
    {
      id: 'a1',
      name: 'HDFC Savings Premium Account',
      subtitle: 'Primary Cash Reserve • Active Vault',
      countInfo: '22 Transactions',
      amount: 'Instant Liquidity',
      tag: 'High Yield',
      tagType: 'Beginner',
      status: 'Open',
    },
    {
      id: 'a2',
      name: 'Axis Bank Salary Account',
      subtitle: 'Automated Salary Deposit Vault',
      countInfo: '12 Transactions',
      amount: 'Monthly Deposit',
      tag: 'Auto-Debited',
      tagType: 'Beginner',
      status: 'Linked',
    },
    {
      id: 'a3',
      name: 'Zerodha Mutual Fund SIP',
      subtitle: 'Nifty 50 Index Equity Fund',
      countInfo: '15 Transactions',
      amount: 'Automated SIP',
      tag: 'Tax Free',
      tagType: 'Advanced',
      status: 'Active',
    },
    {
      id: 'a4',
      name: 'ICICI Amazon Pay Credit Card',
      subtitle: 'Lifestyle & Utilities Card',
      countInfo: '8 Transactions',
      amount: 'Reward Vault',
      tag: 'Zero Fee',
      tagType: 'Expert',
      status: 'Open',
    },
  ];

  const getTagBadgeClass = (tagType: string) => {
    switch (tagType) {
      case 'Beginner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Pro':
        return 'bg-amber-200 text-amber-900 border-amber-400';
      case 'Advanced':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'Expert':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="bento-card p-6 rounded-3xl space-y-4 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Top Linked Accounts & Portfolios
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Real-time status snapshot of primary financial vaults
          </p>
        </div>
        <button
          onClick={() => onNavigate('/banks')}
          className="text-xs font-extrabold text-rose-500 hover:text-rose-600 cursor-pointer"
        >
          See All →
        </button>
      </div>

      <div className="space-y-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                  {acc.name}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                  {acc.subtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-600 justify-between md:justify-end">
              <span className="text-[11px] text-slate-500 font-semibold">{acc.countInfo}</span>
              <span className="text-[11px] text-slate-500 font-semibold">{acc.amount}</span>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black border ${getTagBadgeClass(
                  acc.tagType
                )}`}
              >
                {acc.tag}
              </span>

              <span className="text-[11px] font-bold text-slate-400">{acc.status}</span>

              <button
                onClick={() => onNavigate('/banks')}
                className="px-3.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-all cursor-pointer"
              >
                Open
              </button>

              <button className="text-slate-400 hover:text-slate-700">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
