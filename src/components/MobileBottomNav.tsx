import React from 'react';
import { Home, TrendingDown, Bot, Settings, Plus, ShieldCheck, Landmark } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd?: () => void;
  isSuperAdmin?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
  isSuperAdmin = false,
}) => {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-2 shadow-2xl flex items-center justify-around relative">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-saas cursor-pointer ${
            activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Command</span>
        </button>

        <button
          onClick={() => onSelectTab('investments')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-saas cursor-pointer ${
            activeTab === 'investments' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Landmark className="h-5 w-5" />
          <span className="text-[10px]">Wealth</span>
        </button>

        {onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="-mt-7 h-13 w-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        )}

        <button
          onClick={() => onSelectTab('ai')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-saas cursor-pointer ${
            activeTab === 'ai' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Bot className="h-5 w-5" />
          <span className="text-[10px]">AI Insights</span>
        </button>

        {isSuperAdmin ? (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-saas cursor-pointer ${
              activeTab === 'admin' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px]">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-saas cursor-pointer ${
              activeTab === 'settings' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        )}
      </div>
    </div>
  );
};
