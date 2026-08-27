import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Server, 
  FileText, 
  ToggleLeft, 
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../App';

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'Dashboard KPI', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'services', label: 'Service Health', icon: Server },
  { id: 'flags', label: 'Feature Flags', icon: ToggleLeft },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  
  const displayName = user?.displayName || user?.username || user?.email?.split('@')[0] || 'SuperAdmin';
  const roleName = user?.role || 'Super Admin';
  const avatarUrl = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=059669&color=fff&font-size=0.4`;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 shrink-0 p-6 flex flex-col justify-between hidden md:flex min-h-screen border-r border-slate-800 shadow-xl">
      <div className="space-y-8">
        {/* Brand Logo Header (Emerald Theme) */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="font-crowz-header font-black text-xl tracking-tight text-white block leading-tight">
              Porulalar
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
              SuperAdmin Console
            </span>
          </div>
        </div>

        {/* Real User Profile Card */}
        <div className="flex flex-col items-center text-center space-y-2 py-3.5 px-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-xs">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div className="w-full overflow-hidden">
            <h3 className="font-crowz-header text-sm font-bold text-white truncate">
              {displayName}
            </h3>
            <p className="text-[10px] font-medium text-emerald-400/90 truncate">
              {user?.email || roleName}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sign Out Button */}
      <div className="pt-6 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50 text-[10px] text-slate-400 flex items-center justify-between font-bold">
          <span>System v2.4.0 • Active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
