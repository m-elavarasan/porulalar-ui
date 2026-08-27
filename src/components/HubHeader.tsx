import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface HubSubTab {
  id: string;
  label: string;
  route: string;
  icon?: any;
}

interface HubHeaderProps {
  title: string;
  subtitle: string;
  tabs: HubSubTab[];
  icon?: any;
}

export const HubHeader: React.FC<HubHeaderProps> = ({ title, subtitle, tabs, icon: MainIcon }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="space-y-4 mb-6 select-none">
      {/* Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {MainIcon && (
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <MainIcon size={20} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{title}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Segmented Sub-Tab Switcher */}
        <div className="flex overflow-x-auto bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 gap-1 scrollbar-none shrink-0">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.route || (tab.route !== '/dashboard' && location.pathname.startsWith(tab.route));
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.route)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                {TabIcon && <TabIcon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
