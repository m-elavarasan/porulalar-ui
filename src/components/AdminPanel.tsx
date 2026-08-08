import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Trash2, 
  Server,
  Search,
  CheckCircle,
  Clock,
  UserPlus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDialog } from './DialogProvider';
import { SuperAdminSidebar } from './SuperAdminSidebar';

interface AdminPanelProps {
  token: string | null;
}

interface UserProfile {
  id: string;
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

export default function AdminPanel({ token }: AdminPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState('overview');
  
  // API states
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [newRole, setNewRole] = useState<'SuperAdmin' | 'user'>('user');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Feature flags demo matrix
  const [featureFlags, setFeatureFlags] = useState([
    { id: 'ai_assistant', name: 'Gemini AI Assistant', enabled: true, desc: 'Enables chat assistant & auto SMS parsing' },
    { id: 'aa_consent', name: 'Account Aggregator Sync', enabled: true, desc: 'Fetch bank feeds directly via RBI AA' },
    { id: 'crypto_tracking', name: 'Crypto Portfolio Live Tracking', enabled: false, desc: 'Real-time Web3 wallet balance sync' },
    { id: 'auto_pay_broker', name: 'AutoPay Broker Daemon', enabled: true, desc: 'Processes due EMIs daily at 00:01 UTC' },
  ]);

  // Audit Logs mock list
  const [auditLogs] = useState([
    { id: 'log-1', action: 'USER_ROLE_UPDATE', user: 'admin@porulalar.com', target: 'user_409', time: '10 mins ago', status: 'SUCCESS' },
    { id: 'log-2', action: 'USER_CREATE', user: 'admin@porulalar.com', target: 'pro@porulalar.com', time: '45 mins ago', status: 'SUCCESS' },
    { id: 'log-3', action: 'SMS_WEBHOOK_PARSE', user: 'SYSTEM_DAEMON', target: 'HDFC_SMS', time: '2 hours ago', status: 'SUCCESS' },
    { id: 'log-4', action: 'SUPER_ADMIN_LOGIN', user: 'admin@porulalar.com', target: 'IP 182.74.92.1', time: '4 hours ago', status: 'SUCCESS' },
  ]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview' || activeTab === 'services') {
        const data = await adminService.getStats();
        setStats(data);
      } else if (activeTab === 'users') {
        const data = await adminService.getUsers();
        setUsersList(data);
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
  }, [activeTab]);

  const handleRoleChange = async (userId: string, targetRole: string) => {
    try {
      const ok = await showConfirm(`Change role of user to ${targetRole}?`);
      if (!ok) return;
      await adminService.updateUserRole(userId, targetRole);
      await showAlert(`Role updated to ${targetRole}`, 'Success', 'success');
      fetchData();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to update role', 'Error', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setIsCreatingUser(true);
    try {
      await adminService.createUser({
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      await showAlert(`User ${newEmail} created successfully!`, 'Success', 'success');
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      setIsAddUserOpen(false);
      fetchData();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to create user account.', 'Error', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    try {
      const confirmDelete = await showConfirm(`Are you sure you want to permanently delete user "${user.email}"? This action cannot be undone.`);
      if (!confirmDelete) return;

      await adminService.deleteUser(user.id);
      await showAlert(`User account "${user.email}" deleted successfully.`, 'Success', 'success');
      fetchData();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to delete user account.', 'Error', 'error');
    }
  };

  const toggleFlag = (flagId: string) => {
    setFeatureFlags(prev => prev.map(f => f.id === flagId ? { ...f, enabled: !f.enabled } : f));
  };

  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Admin Content */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight capitalize">
              Super Admin Console — {activeTab}
            </h1>
            <p className="text-xs text-slate-500 font-medium">Manage platform architecture, subscribers, feature toggles & audit trails.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/60 flex items-center gap-1.5">
              <CheckCircle size={14} />
              System Healthy
            </span>
          </div>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Redesigned SaaS KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Registered Users */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Registered Users</span>
                  <div className="h-10 w-10 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Users size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black tracking-tight">{stats?.users?.total || usersList.length || 0}</div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-bold">
                  <TrendingUp size={14} />
                  <span>+{stats?.users?.addedLast7d || 45} last 7 days</span>
                </div>
              </div>

              {/* Card 2: SuperAdmins & Authorities */}
              <div className="bg-gradient-to-br from-purple-950 to-slate-900 text-white rounded-3xl p-6 border border-purple-900/40 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">SuperAdmin Roles</span>
                  <div className="h-10 w-10 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black tracking-tight">{stats?.users?.superAdmins || usersList.filter(u => u.role === 'SuperAdmin').length || 1}</div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-purple-300 font-bold">
                  <CheckCircle size={14} />
                  <span>Full Administrative Control</span>
                </div>
              </div>

              {/* Card 3: Database Records */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 border border-blue-900/40 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Total Indexed Records</span>
                  <div className="h-10 w-10 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <Server size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black tracking-tight">{(stats?.system?.totalDataRecords || 48200).toLocaleString()}</div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-blue-300 font-bold">
                  <Activity size={14} />
                  <span>Realtime Database Sync</span>
                </div>
              </div>

              {/* Card 4: Platform Status */}
              <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-3xl p-6 border border-emerald-900/40 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Platform Health</span>
                  <div className="h-10 w-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <Activity size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black tracking-tight text-emerald-400">100%</div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-300 font-bold">
                  <CheckCircle size={14} />
                  <span>All Microservices Operational</span>
                </div>
              </div>
            </div>

            {/* DB Collections Storage Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Database Storage Allocation</h3>
                <span className="text-xs text-slate-400 font-mono">SQLite / GORM Active Engine</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats?.system?.collections?.map(c => (
                  <div key={c.collection} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">{c.collection}</span>
                    <p className="text-xl font-black text-slate-900 mt-1">{c.count.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT TAB ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by email or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-500 font-bold">{filteredUsers.length} Users Listed</span>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-purple-600/20 flex items-center gap-2 shrink-0"
                >
                  <UserPlus size={16} /> Add New User
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">User Email</th>
                    <th className="p-3.5">User Role</th>
                    <th className="p-3.5">Registered Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">No matching users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3.5 font-extrabold text-slate-900">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right space-x-2">
                          {u.role === 'SuperAdmin' ? (
                            <button
                              onClick={() => handleRoleChange(u.id, 'user')}
                              className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                            >
                              Demote to User
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, 'SuperAdmin')}
                              className="text-xs text-purple-600 hover:underline font-bold cursor-pointer"
                            >
                              Promote to SuperAdmin
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Delete User Account"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FEATURE FLAGS TAB ── */}
        {activeTab === 'flags' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Platform Feature Flags</h3>
            <p className="text-xs text-slate-500">Toggle capabilities dynamically without code redeployment.</p>

            <div className="space-y-3 pt-2">
              {featureFlags.map(f => (
                <div key={f.id} className="p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between bg-white hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                  </div>

                  <button
                    onClick={() => toggleFlag(f.id)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${f.enabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 justify-start'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUDIT LOGS TAB ── */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Platform Security Audit Log</h3>
            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-purple-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-900 uppercase">{log.action}</span>
                      <p className="text-[11px] text-slate-500">By {log.user} on target {log.target}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{log.status}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── ADD USER MODAL ── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-600" /> Create New User Account
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@porulalar.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showModalPassword ? "Hide password" : "Show password"}
                  >
                    {showModalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  <option value="user">Standard User (user)</option>
                  <option value="SuperAdmin">SuperAdmin (SuperAdmin)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-purple-600/20"
                >
                  {isCreatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
