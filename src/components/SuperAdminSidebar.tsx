import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Server, 
  Bell, 
  FileText, 
  ToggleLeft, 
  Settings,
  ShieldAlert
} from 'lucide-react';

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'Dashboard KPI', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
  { id: 'services', label: 'Service Health', icon: Server },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
  { id: 'flags', label: 'Feature Flags', icon: ToggleLeft },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 shrink-0 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-64px)]">
      <div className="space-y-6">
        <div className="px-3 flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert size={16} />
          <span>Super Admin Console</span>
        </div>

        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-saas ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 text-xs space-y-1">
        <span className="font-semibold text-slate-900 block">System Version v2.4.0</span>
        <p className="text-slate-500">Node: Active • PostgreSQL: Healthy</p>
      </div>
    </aside>
  );
};
