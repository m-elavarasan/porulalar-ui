import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Plus, 
  Trash, 
  Save, 
  Server,
  DollarSign,
  ToggleLeft,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useDialog } from './DialogProvider';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { MetricCard } from './MetricCard';

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
    { id: 'log-2', action: 'EXPORT_DATA_PURGE', user: 'demo@porulalar.com', target: 'Self', time: '1 hour ago', status: 'SUCCESS' },
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const ok = await showConfirm(`Change role of user to ${newRole}?`);
      if (!ok) return;
      await adminService.updateUserRole(userId, newRole);
      await showAlert(`Role updated to ${newRole}`, 'Success', 'success');
      fetchData();
    } catch (err: any) {
      await showAlert(err.message || 'Failed to update role', 'Error', 'error');
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Registered Users"
                value={stats?.users?.total || 1420}
                change="+12.4% this mo"
                changeType="positive"
                subtitle={`${stats?.users?.addedLast7d || 45} joined last 7 days`}
                icon={<Users size={18} />}
              />
              <MetricCard
                title="Active Subscribers"
                value="1,180"
                change="+8.1%"
                changeType="positive"
                subtitle="Pro & Enterprise tiers"
                icon={<ShieldCheck size={18} />}
              />
              <MetricCard
                title="Monthly MRR Revenue"
                value="₹14,85,000"
                change="+18.5%"
                changeType="positive"
                subtitle="SaaS Subscription ARR"
                icon={<DollarSign size={18} />}
              />
              <MetricCard
                title="Total Data Records"
                value={stats?.system?.totalDataRecords || 48200}
                change="Healthy"
                changeType="positive"
                subtitle="Indexed in Firestore DB"
                icon={<Server size={18} />}
              />
            </div>

            {/* DB Collections Breakdown */}
            <div className="saas-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Database Storage Allocation</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats?.system?.collections?.map(c => (
                  <div key={c.collection} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">{c.collection}</span>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{c.count.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT TAB ── */}
        {activeTab === 'users' && (
          <div className="saas-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by email or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs"
                />
              </div>

              <span className="text-xs text-slate-500 font-medium">Showing {filteredUsers.length} users</span>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
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
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-saas">
                        <td className="p-3.5 font-bold text-slate-900">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right">
                          {u.role === 'SuperAdmin' ? (
                            <button
                              onClick={() => handleRoleChange(u.id, 'User')}
                              className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                            >
                              Demote to User
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u.id, 'SuperAdmin')}
                              className="text-xs text-purple-600 hover:underline font-bold"
                            >
                              Make SuperAdmin
                            </button>
                          )}
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
          <div className="saas-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Platform Feature Flags</h3>
            <p className="text-xs text-slate-500">Toggle capabilities dynamically without code redeployment.</p>

            <div className="space-y-3 pt-2">
              {featureFlags.map(f => (
                <div key={f.id} className="p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between bg-white hover:border-slate-300 transition-saas">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                  </div>

                  <button
                    onClick={() => toggleFlag(f.id)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${f.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}
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
          <div className="saas-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Platform Security Audit Log</h3>

            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-500 ml-2">by {log.user} ({log.target})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">{log.time}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
