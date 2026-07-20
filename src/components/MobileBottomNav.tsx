import React from 'react';
import { Home, TrendingDown, Bot, Settings, Plus, ShieldCheck } from 'lucide-react';

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
      <div className="bg-white border-2 border-teal-300 rounded-3xl p-2 shadow-xl flex items-center justify-around relative text-teal-950">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-teal-900 bg-teal-100 font-extrabold' : 'text-teal-800 hover:text-teal-950 font-bold'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('expenses')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'text-teal-900 bg-teal-100 font-extrabold' : 'text-teal-800 hover:text-teal-950 font-bold'
          }`}
        >
          <TrendingDown className="h-5 w-5" />
          <span className="text-[10px]">Spend</span>
        </button>

        {onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="-mt-7 h-13 w-13 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        )}

        <button
          onClick={() => onSelectTab('ai')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'ai' ? 'text-teal-900 bg-teal-100 font-extrabold' : 'text-teal-800 hover:text-teal-950 font-bold'
          }`}
        >
          <Bot className="h-5 w-5" />
          <span className="text-[10px]">AI Bot</span>
        </button>

        {isSuperAdmin ? (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'admin' ? 'text-teal-900 bg-teal-100 font-extrabold' : 'text-teal-800 hover:text-teal-950 font-bold'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px]">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-teal-900 bg-teal-100 font-extrabold' : 'text-teal-800 hover:text-teal-950 font-bold'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Config</span>
          </button>
        )}
      </div>
    </div>
  );
};
