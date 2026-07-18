import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Plus, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Info,
  Server
} from 'lucide-react';
import { useDialog } from './DialogProvider';

interface AdminPanelProps {
  token: string | null;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemStats {
  users: {
    total: number;
    addedLast7d: number;
    addedLast30d: number;
    superAdmins: number;
    regularUsers: number;
  };
  system: {
    totalDataRecords: number;
    collections: Array<{ collection: string; count: number }>;
  };
}

interface MenuConfig {
  id: string;
  role: string;
  channel: string;
  menuItems: { items: Array<Record<string, any>> };
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel({ token }: AdminPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'users' | 'menus'>('stats');
  
  // API states
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [menusList, setMenusList] = useState<MenuConfig[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Menu Configurator states
  const [selectedRole, setSelectedRole] = useState('user');
  const [selectedChannel, setSelectedChannel] = useState<'web' | 'app'>('web');
  const [configItems, setConfigItems] = useState<Array<Record<string, any>>>([]);
  
  // New menu item fields
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPath, setNewItemPath] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('home');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeSubTab === 'stats') {
        const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } else if (activeSubTab === 'users') {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsersList(data);
      } else if (activeSubTab === 'menus') {
        const res = await fetch(`${API_BASE}/api/admin/menus`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch menus');
        const data = await res.json();
        setMenusList(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'API request failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  // Load configured items when role/channel selection changes
  useEffect(() => {
    if (activeSubTab === 'menus') {
      const match = menusList.find(m => m.role === selectedRole && m.channel === selectedChannel);
      if (match && match.menuItems && Array.isArray(match.menuItems.items)) {
        setConfigItems(match.menuItems.items);
      } else {
        // Load fallback static defaults based on role/channel
        setConfigItems(getDefaultStaticMenu(selectedRole, selectedChannel));
      }
    }
  }, [selectedRole, selectedChannel, menusList, activeSubTab]);

  const getDefaultStaticMenu = (role: string, channel: string) => {
    if (role === 'SuperAdmin') {
      if (channel === 'app') {
        return [
          { title: 'Admin Stats', path: '/admin/stats', icon: 'trending-up' },
          { title: 'User List', path: '/admin/users', icon: 'users' },
          { title: 'Dashboard', path: '/dashboard', icon: 'grid' },
          { title: 'Profile', path: '/profile', icon: 'user' },
        ];
      }
      return [
        { title: 'Admin Dashboard', path: '/admin/dashboard', icon: 'shield-check' },
        { title: 'User Management', path: '/admin/users', icon: 'users' },
        { title: 'Menu Configurator', path: '/admin/menus', icon: 'menu' },
        { title: 'Personal Wealth', path: '/dashboard', icon: 'home' },
        { title: 'Expenses', path: '/expenses', icon: 'trending-down' },
        { title: 'Income', path: '/income', icon: 'trending-up' },
        { title: 'Bank Accounts', path: '/banks', icon: 'wallet' },
      ];
    }
    if (channel === 'app') {
      return [
        { title: 'Dashboard', path: '/dashboard', icon: 'grid' },
        { title: 'Quick Expense', path: '/expenses/new', icon: 'plus-circle' },
        { title: 'My Banks', path: '/banks', icon: 'wallet' },
        { title: 'EMIs & Loans', path: '/emis', icon: 'percent' },
        { title: 'Chit Funds', path: '/chits', icon: 'repeat' },
        { title: 'Profile', path: '/profile', icon: 'user' },
      ];
    }
    return [
      { title: 'Dashboard', path: '/dashboard', icon: 'home' },
      { title: 'Expenses', path: '/expenses', icon: 'trending-down' },
      { title: 'Income', path: '/income', icon: 'trending-up' },
      { title: 'Bank Accounts', path: '/banks', icon: 'wallet' },
      { title: 'Credit Cards', path: '/cards', icon: 'credit-card' },
      { title: 'Loans', path: '/loans', icon: 'activity' },
      { title: 'EMIs', path: '/emis', icon: 'percent' },
      { title: 'Chit Funds', path: '/chits', icon: 'repeat' },
      { title: 'Investments', path: '/investments', icon: 'bar-chart-2' },
      { title: 'Assets', path: '/assets', icon: 'award' },
      { title: 'Savings Goals', path: '/goals', icon: 'target' },
    ];
  };

  const handleUpdateRole = async (targetUser: UserProfile, newRole: string) => {
    const confirm = await showConfirm(`Are you sure you want to change role of ${targetUser.username} to "${newRole}"?`);
    if (!confirm) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/users/${targetUser.id}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update role');
      }
      await showAlert(`User role updated to ${newRole} successfully!`, 'Role Updated', 'success');
      fetchData();
    } catch (err: any) {
      console.error(err);
      await showAlert(err.message || 'Action failed', 'Error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || !newItemPath) return;
    setConfigItems([...configItems, { title: newItemTitle, path: newItemPath, icon: newItemIcon }]);
    setNewItemTitle('');
    setNewItemPath('');
    setNewItemIcon('home');
  };

  const handleRemoveMenuItem = (index: number) => {
    setConfigItems(configItems.filter((_, idx) => idx !== index));
  };

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === configItems.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...configItems];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setConfigItems(updated);
  };

  const handleSaveMenuConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/menus`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          role: selectedRole,
          channel: selectedChannel,
          menuItems: configItems
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save menu config');
      }
      await showAlert('Dynamic menu configuration saved successfully!', 'Menus Saved', 'success');
      
      // Reload menu configs list
      const freshRes = await fetch(`${API_BASE}/api/admin/menus`, { headers: getHeaders() });
      if (freshRes.ok) {
        const data = await freshRes.json();
        setMenusList(data);
      }
    } catch (err: any) {
      console.error(err);
      await showAlert(err.message || 'Action failed', 'Error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-module">
      {/* Tab Navigation header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'stats' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            System Statistics
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'users' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            User Accounts
          </button>
          <button
            onClick={() => setActiveSubTab('menus')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'menus' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            Menu Configurator
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pl-2">
          <Server className="w-3.5 h-3.5" />
          <span>REST Endpoint connected</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs flex items-center gap-2">
          <Info className="h-4.5 w-4.5 shrink-0" />
          <span>Error loading admin data: {error}</span>
        </div>
      )}

      {/* --- Tab 1: System Statistics --- */}
      {activeSubTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-2xs">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Users</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.users.total}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-2xs">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joined (Last 7 Days)</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.users.addedLast7d}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-2xs">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Joined (Last 30 Days)</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.users.addedLast30d}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100 shadow-2xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Administrators</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.users.superAdmins}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Database Record Counts by Collection</h3>
            <div className="text-xs text-slate-400 mb-2">Total records stored across all users: <strong>{stats.system.totalDataRecords}</strong></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stats.system.collections.map((coll, idx) => (
                <div key={idx} className="border border-slate-100 bg-slate-50/40 rounded-2xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{coll.collection}</span>
                  <span className="text-lg font-black text-slate-700 tracking-tight pt-1">{coll.count} records</span>
                </div>
              ))}
              {stats.system.collections.length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-400 font-semibold">No records exist in the database.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Tab 2: User Management --- */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">User Directory & Roles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Username</th>
                  <th className="py-3.5 px-4 font-bold">Email</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Registered At</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4">{usr.username}</td>
                    <td className="py-3.5 px-4 font-normal">{usr.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        usr.role === 'SuperAdmin' 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-normal text-slate-400">{new Date(usr.createdAt).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      {usr.role === 'SuperAdmin' ? (
                        <button
                          onClick={() => handleUpdateRole(usr, 'user')}
                          disabled={isLoading}
                          className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Demote to User
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateRole(usr, 'SuperAdmin')}
                          disabled={isLoading}
                          className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Make SuperAdmin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading user directory list...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab 3: Dynamic Menu Configurator --- */}
      {activeSubTab === 'menus' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Configure Profile Scope</h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Target User Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="user">Regular User (user)</option>
                  <option value="SuperAdmin">Super Administrator (SuperAdmin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Application Channel</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as 'web' | 'app')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                >
                  <option value="web">Web Browser Console (web)</option>
                  <option value="app">Mobile App Device (app)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Menu Link</h4>
              <form onSubmit={handleAddMenuItem} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Link Title (e.g. Dashboard)"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Route Path (e.g. /dashboard)"
                    value={newItemPath}
                    onChange={(e) => setNewItemPath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Lucide Icon Class (e.g. home)"
                    value={newItemIcon}
                    onChange={(e) => setNewItemIcon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-indigo-100"
                >
                  <Plus className="w-4 h-4" />
                  <span>Append to Menu</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between space-y-4 min-h-[400px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  Menu Items Hierarchy ({configItems.length})
                </h3>
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase">
                  {selectedRole} • {selectedChannel}
                </span>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {configItems.map((item, idx) => (
                  <div key={idx} className="border border-slate-100 bg-slate-50/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 group hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">
                        {item.icon || 'link'}
                      </div>
                      <div>
                        <span className="block text-slate-700">{item.title}</span>
                        <span className="block text-[10px] text-slate-400 font-mono font-semibold">{item.path}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveMenuItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveMenuItem(idx, 'down')}
                        disabled={idx === configItems.length - 1}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveMenuItem(idx)}
                        className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                        title="Remove"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {configItems.length === 0 && (
                  <div className="py-12 text-center text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl">
                    No menu items in configuration. Add items using the sidebar controller.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
              <button
                onClick={() => setConfigItems(getDefaultStaticMenu(selectedRole, selectedChannel))}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Reset to Static Defaults
              </button>
              <button
                onClick={handleSaveMenuConfig}
                disabled={isLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
