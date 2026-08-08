import React from 'react';
import { Home, Receipt, Plus, CreditCard, Settings, ShieldCheck, LogOut } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd?: () => void;
  isSuperAdmin?: boolean;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
  isSuperAdmin = false,
  onLogout,
}) => {
  if (isSuperAdmin) {
    return (
      <div className="md:hidden fixed bottom-4 left-3 right-3 z-50 select-none">
        <div className="bg-purple-950/95 backdrop-blur-2xl border border-purple-800 text-white rounded-3xl p-3 shadow-2xl flex items-center justify-between px-6">
          <button
            onClick={() => onSelectTab('admin')}
            className="flex items-center gap-2 py-2 px-4 rounded-2xl bg-purple-600 text-white font-extrabold text-xs shadow-md cursor-pointer"
          >
            <ShieldCheck className="h-5 w-5" />
            <span>SuperAdmin Console</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-purple-300 hover:text-rose-400 rounded-xl cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed bottom-4 left-3 right-3 z-50 select-none">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 text-white rounded-3xl p-2 shadow-2xl flex items-center justify-around relative">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-blue-400 bg-blue-500/20 font-bold' : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          onClick={() => onSelectTab('expenses')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'expenses' || activeTab === 'income' || activeTab === 'borrows' ? 'text-blue-400 bg-blue-500/20 font-bold' : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px]">Cash Flow</span>
        </button>

        {onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="-mt-7 h-13 w-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-xl border-2 border-slate-900 cursor-pointer active:scale-95 transition-transform"
            title="Quick Action"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        )}

        <button
          onClick={() => onSelectTab('cards')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'cards' || activeTab === 'banks' ? 'text-blue-400 bg-blue-500/20 font-bold' : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-[10px]">Cards</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'settings' ? 'text-blue-400 bg-blue-500/20 font-bold' : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
};
