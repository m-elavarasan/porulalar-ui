import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { initAuth, googleSignIn, logout, getAccessToken, setAccessToken, backendLogin, backendRegister } from './lib/auth';
import { porulalarStore } from './lib/store';
import { schedulerService } from './services/schedulerService';
import { debounce } from './lib/utils';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  ShieldCheck,
  Award,
  Calendar,
  AlertTriangle,
  LogOut,
  ChevronRight,
  User,
  Clock,
  Briefcase,
  Layers,
  Activity,
  Grid,
  Sliders,
  Bell,
  BellOff,
  Plus,
  Trash,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  PiggyBank,
  ShieldAlert,
  Info,
  Search,
  Building2,
  CreditCard,
  Handshake,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDialog } from './components/DialogProvider';

import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
  Outlet
} from 'react-router-dom';

// Pages
import {
  DashboardPage,
  ExpensesPage,
  IncomePage,
  InvestmentsPage,
  LoansPage,
  EMIsPage,
  ChitsPage,
  AssetsGoalsPage,
  BanksPage,
  CardsPage,
  BorrowsPage,
  RecurringPage,
  AIPage,
  SettingsPage,
  AdminPage
} from './pages';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FinancialSimulatorsPanel } from './components/FinancialSimulatorsPanel';
import { GmailOnboardingModal } from './components/GmailOnboardingModal';

// Auth State Interfaces
export interface AuthUser {
  uid: string;
  username: string;
  email: string;
  role: string;
  photoURL?: string;
  displayName?: string;
}

export const AuthContext = createContext<{
  user: AuthUser | null;
  token: string | null;
  logout: () => void;
} | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

function IndexRoute() {
  const { user } = useAuth();
  const roleLower = (user?.role || '').toLowerCase();
  const isAdmin = roleLower.includes('admin') || roleLower === 'superadmin' || user?.email === 'admin@porulalar.com';
  return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
}

function DashboardRoute() {
  const { user } = useAuth();
  const roleLower = (user?.role || '').toLowerCase();
  const isAdmin = roleLower.includes('admin') || roleLower === 'superadmin' || user?.email === 'admin@porulalar.com';
  if (isAdmin) {
    return <AdminPage />;
  }
  return <DashboardPage />;
}

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#f43f5e' },
  { name: 'Fuel', color: '#3b82f6' },
  { name: 'Rent', color: '#10b981' },
  { name: 'EMI', color: '#8b5cf6' },
  { name: 'Chit', color: '#ec4899' },
  { name: 'Insurance', color: '#06b6d4' },
  { name: 'Investment', color: '#f59e0b' },
  { name: 'Shopping', color: '#a855f7' },
  { name: 'Entertainment', color: '#14b8a6' },
  { name: 'Medical', color: '#ef4444' },
  { name: 'Travel', color: '#eab308' },
  { name: 'Utilities', color: '#64748b' },
  { name: 'Other', color: '#94a3b8' },
];

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auth Submit credentials states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isSuperAdminPortal, setIsSuperAdminPortal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { showAlert } = useDialog();

  // Load cached user profile from previous session if available
  useEffect(() => {
    const cachedUser = localStorage.getItem('porulalar_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setNeedsAuth(false);
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    }

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        if (currentUser) {
          const userObj = currentUser as AuthUser;
          setUser(userObj);
          setToken(accessToken);
          setNeedsAuth(false);
          localStorage.setItem('porulalar_user', JSON.stringify({
            uid: userObj.uid,
            displayName: userObj.displayName,
            email: userObj.email,
            photoURL: userObj.photoURL,
            role: userObj.role
          }));
        }
      },
      () => {
        const cachedUserObj = localStorage.getItem('porulalar_user');
        if (!cachedUserObj) {
          setNeedsAuth(true);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      if (authMode === 'login') {
        if (!authEmail || !authPassword) {
          throw new Error('Email and Password are required');
        }
        const result = await backendLogin(authEmail, authPassword);
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        const roleLower = (result.user?.role || '').toLowerCase();
        if (roleLower.includes('admin')) {
          window.location.hash = '#/admin';
        }
      } else {
        if (!authEmail || !authPassword) {
          throw new Error('Email and Password are required');
        }
        if (authPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        const result = await backendRegister(authEmail, authPassword);
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear state regardless of API success
      setUser(null);
      setToken(null);
      setAuthEmail('');
      setAuthPassword('');
      setAuthError(null);
      setAuthMode('login');
      setNeedsAuth(true);
      localStorage.removeItem('porulalar_user');
      localStorage.removeItem('porulalar_access_token');
      localStorage.removeItem('porulalar_refresh_token');
      // Reset hash to root and force clean redirect to login screen
      window.location.hash = '#/';
      window.location.reload();
    }
  };

  const isSuperAdminRoute = window.location.hash.includes('admin-login');

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 select-none" id="auth-page">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8 space-y-6 text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-xs">
            {isSuperAdminRoute ? (
              <ShieldCheck className="h-8 w-8 text-purple-600" />
            ) : (
              <Wallet className="h-8 w-8 text-indigo-600" />
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isSuperAdminRoute ? 'SuperAdmin Terminal' : 'Porulalar Wealth Supervisor'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              {isSuperAdminRoute
                ? 'High-security administrative portal for system metrics and user roles.'
                : 'Sign in to access your personal wealth workspace.'}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isSuperAdminRoute
                ? 'Authenticate SuperAdmin'
                : authMode === 'login'
                ? 'Sign In to Your Account'
                : 'Register a New Account'}
            </h2>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs text-left flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-bold block">{authError}</span>
                  {!isSuperAdminRoute && authMode === 'login' && (
                    <span className="text-xs text-slate-600 block mt-1">
                      Need an account? Click <button type="button" onClick={() => setAuthMode('register')} className="text-indigo-700 underline font-bold">Sign Up</button> to register.
                    </span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-slate-900 text-sm font-bold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none text-slate-900 text-sm font-bold transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full h-12 mt-2 font-extrabold text-sm rounded-xl flex items-center justify-center transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                  isSuperAdminRoute
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
              >
                {isLoggingIn ? (
                  <span>Verifying...</span>
                ) : (
                  <span>{isSuperAdminRoute ? 'Authorize Admin Portal' : authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {!isSuperAdminRoute && (
              <div className="pt-2 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, logout: handleLogout }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout handleLogout={handleLogout} />}>
            <Route index element={<IndexRoute />} />
            <Route path="dashboard" element={<DashboardRoute />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="borrows" element={<BorrowsPage />} />
            <Route path="banks" element={<BanksPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="emis" element={<EMIsPage />} />
            <Route path="chits" element={<ChitsPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="goals" element={<AssetsGoalsPage />} />
            <Route path="simulators" element={<FinancialSimulatorsPanel />} />
            <Route path="ai-advisor" element={<AIPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<IndexRoute />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}

// ── AppLayout shell component ───────────────────────────────────────────
function AppLayout({ handleLogout }: { handleLogout: () => void }) {
  const { user } = useAuth();
  const roleLower = (user?.role || '').toLowerCase();
  const isAdminUser = roleLower.includes('admin') || roleLower === 'superadmin' || user?.email === 'admin@porulalar.com';
  const { showAlert } = useDialog();
  const navigate = useNavigate();
  const location = useLocation();

  const [schedulerMessage, setSchedulerMessage] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [activeQuickForm, setActiveQuickForm] = useState<'expense' | 'income' | 'investment' | null>(null);

  // Global Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Small lists for Layout details
  const [loans, setLoans] = useState<any[]>([]);
  const [emis, setEmis] = useState<any[]>([]);
  const [chits, setChits] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  // Search Results Lists
  const [searchResults, setSearchResults] = useState<any>({
    expenses: [],
    income: [],
    investments: [],
    loans: [],
    chits: [],
    assets: [],
  });

  const getMergedCategories = () => {
    const map = new Map<string, { name: string; color: string }>();
    DEFAULT_CATEGORIES.forEach((cat) => {
      map.set(cat.name, cat);
    });
    customCategories.forEach((cc) => {
      map.set(cc.name, { name: cc.name, color: cc.color });
    });
    return Array.from(map.values());
  };

  const isLoadingLayout = useRef(false);

  const loadLayoutData = async () => {
    if (isLoadingLayout.current) return;
    isLoadingLayout.current = true;
    try {
      await porulalarStore.bootstrap();
      setLoans(porulalarStore.getCache('loans'));
      setEmis(porulalarStore.getCache('emis'));
      setChits(porulalarStore.getCache('chits'));
      setBanks(porulalarStore.getCache('banks'));
      setCards(porulalarStore.getCache('cards'));
      setBudgets(porulalarStore.getCache('budgets'));
      setCustomCategories(porulalarStore.getCache('customCategories'));
    } catch (e) {
      console.error('Error fetching layout overview details:', e);
    } finally {
      isLoadingLayout.current = false;
    }
  };

  useEffect(() => {
    if (!user) return;
    const roleLower = (user?.role || '').toLowerCase();
    const isAdminUser = roleLower.includes('admin');
    if (isAdminUser && (location.pathname === '/' || location.pathname === '/dashboard')) {
      navigate('/admin', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (!user) return;
    loadLayoutData();

    // Subscribe to updates without re-triggering full layout reload
    const unsubLoans = porulalarStore.subscribe('loans', (items) => setLoans(items));
    const unsubEmis = porulalarStore.subscribe('emis', (items) => setEmis(items));
    const unsubChits = porulalarStore.subscribe('chits', (items) => setChits(items));
    const unsubBanks = porulalarStore.subscribe('banks', (items) => setBanks(items));
    const unsubCards = porulalarStore.subscribe('cards', (items) => setCards(items));

    // Initial Scheduler Trigger once
    const triggerScheduler = async () => {
      try {
        await schedulerService.runScheduler();
      } catch (err) {
        console.error('Failed to run scheduler:', err);
      }
    };
    triggerScheduler();

    return () => {
      unsubLoans();
      unsubEmis();
      unsubChits();
      unsubBanks();
      unsubCards();
    };
  }, [user?.uid]);

  // Global Search trigger
  const runGlobalSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ expenses: [], income: [], investments: [], loans: [], chits: [], assets: [] });
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    try {
      // For global search, fetch latest lists
      const [expList, incList, invList, loansList, chitsList, assetsList] = await Promise.all([
        porulalarStore.fetchCollection('expenses'),
        porulalarStore.fetchCollection('income'),
        porulalarStore.fetchCollection('investments'),
        porulalarStore.fetchCollection('loans'),
        porulalarStore.fetchCollection('chits'),
        porulalarStore.fetchCollection('assets')
      ]);

      const matchedExp = expList.filter(e => e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q));
      const matchedInc = incList.filter(i => i.description?.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q));
      const matchedInv = invList.filter(inv => inv.investmentName?.toLowerCase().includes(q) || inv.investmentType?.toLowerCase().includes(q));
      const matchedLoans = loansList.filter(l => l.loanName?.toLowerCase().includes(q) || l.lenderName?.toLowerCase().includes(q));
      const matchedChits = chitsList.filter(c => c.chitName?.toLowerCase().includes(q));
      const matchedAssets = assetsList.filter(a => a.assetName?.toLowerCase().includes(q));

      setSearchResults({
        expenses: matchedExp,
        income: matchedInc,
        investments: matchedInv,
        loans: matchedLoans,
        chits: matchedChits,
        assets: matchedAssets
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runGlobalSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);



  // Notifications calculation
  const getNotifications = () => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'urgent' | 'warning' | 'info';
      date: string;
      icon: any;
    }> = [];
    const today = new Date();

    emis.filter(e => e.status === 'Active' && e.nextDueDate).forEach(e => {
      const diffDays = Math.ceil((new Date(e.nextDueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays <= 5) {
        list.push({
          id: `emi-${e.id}`,
          title: `EMI Payment Due: ${e.itemName}`,
          description: `EMI installment of ₹${e.emiAmount.toLocaleString('en-IN')} is due on ${e.nextDueDate} (${diffDays} days left).`,
          severity: diffDays <= 2 ? 'urgent' : 'warning',
          date: e.nextDueDate,
          icon: Calendar,
        });
      } else if (diffDays < 0) {
        list.push({
          id: `emi-overdue-${e.id}`,
          title: `EMI Payment OVERDUE: ${e.itemName}`,
          description: `EMI installment of ₹${e.emiAmount.toLocaleString('en-IN')} was due on ${e.nextDueDate} (${Math.abs(diffDays)} days overdue!).`,
          severity: 'urgent',
          date: e.nextDueDate,
          icon: ShieldAlert,
        });
      }
    });

    loans.filter(l => l.status === 'Active' && l.nextDueDate).forEach(l => {
      const diffDays = Math.ceil((new Date(l.nextDueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays <= 5) {
        list.push({
          id: `loan-${l.id}`,
          title: `Loan EMI Due: ${l.loanName}`,
          description: `EMI contribution of ₹${l.emiAmount.toLocaleString('en-IN')} is due on ${l.nextDueDate} (${diffDays} days left).`,
          severity: diffDays <= 2 ? 'urgent' : 'warning',
          date: l.nextDueDate,
          icon: Calendar,
        });
      } else if (diffDays < 0) {
        list.push({
          id: `loan-overdue-${l.id}`,
          title: `Loan EMI OVERDUE: ${l.loanName}`,
          description: `EMI payment of ₹${l.emiAmount.toLocaleString('en-IN')} was due on ${l.nextDueDate} (${Math.abs(diffDays)} days overdue!).`,
          severity: 'urgent',
          date: l.nextDueDate,
          icon: ShieldAlert,
        });
      }
    });

    chits.filter(c => c.status === 'Active' && c.nextDueDate).forEach(c => {
      const diffDays = Math.ceil((new Date(c.nextDueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays <= 5) {
        list.push({
          id: `chit-${c.id}`,
          title: `Chit Auction Due: ${c.chitName}`,
          description: `Monthly chit contribution of ₹${c.monthlyContribution.toLocaleString('en-IN')} is due on ${c.nextDueDate} (${diffDays} days left).`,
          severity: diffDays <= 2 ? 'urgent' : 'warning',
          date: c.nextDueDate,
          icon: Calendar,
        });
      } else if (diffDays < 0) {
        list.push({
          id: `chit-overdue-${c.id}`,
          title: `Chit Payment Overdue: ${c.chitName}`,
          description: `Monthly contribution of ₹${c.monthlyContribution.toLocaleString('en-IN')} was due on ${c.nextDueDate} (${Math.abs(diffDays)} days overdue!).`,
          severity: 'urgent',
          date: c.nextDueDate,
          icon: ShieldAlert,
        });
      }
    });

    list.push({
      id: 'system-welcoming',
      title: 'Porulalar Secure Sync Active',
      description: 'Your wealth snapshots are encrypted and synchronized safely in your local Postgres database.',
      severity: 'info',
      date: 'Just Now',
      icon: ShieldCheck,
    });

    return list;
  };

  const notifications = getNotifications();
  const alertCount = notifications.filter(n => n.severity === 'urgent' || n.severity === 'warning').length;

  const totalResultsCount = Object.values(searchResults).reduce((sum: number, arr: any) => sum + arr.length, 0);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/expenses') || path.startsWith('/income') || path.startsWith('/borrows')) return 'cashflow';
    if (path.startsWith('/banks') || path.startsWith('/cards')) return 'accounts';
    if (path.startsWith('/loans') || path.startsWith('/emis') || path.startsWith('/chits') || path.startsWith('/simulators')) return 'obligations';
    if (path.startsWith('/investments') || path.startsWith('/assets-goals')) return 'portfolio';
    if (path.startsWith('/ai-advisor') || path.startsWith('/recurring') || path.startsWith('/settings')) return 'system';
    if (path.startsWith('/admin')) return 'admin';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tabId: string) => {
    const pathMap: Record<string, string> = {
      dashboard: '/dashboard',
      cashflow: '/expenses',
      accounts: '/banks',
      obligations: '/loans',
      portfolio: '/investments',
      system: '/ai-advisor',
      admin: '/admin'
    };
    navigate(pathMap[tabId] || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a] flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-900" id="main-app">
      {/* Top Banner Message */}
      {schedulerMessage && (
        <div className="bg-emerald-600 text-white py-3 px-6 text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-md animate-bounce">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {schedulerMessage}
        </div>
      )}

      {/* Primary Header */}
      {isAdminUser ? (
        <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-45 transition-all text-white select-none">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-extrabold tracking-tight leading-tight text-white flex items-center gap-2">
                  Porulalar Admin Console
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono font-extrabold uppercase">
                    SuperAdmin
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">High-security system metrics, audit logs & role authorization</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700 py-1.5 px-3 rounded-xl text-xs text-slate-300">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px]">Backend API Online</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 py-1.5 px-3 rounded-xl">
                <div className="h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{user?.email || 'SuperAdmin'}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-700 bg-slate-800 shadow-xs cursor-pointer transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* FULL WIDTH HORIZONTAL HUB NAVIGATION BAR FOR SUPERADMIN */}
          <div className="border-t border-slate-800 bg-slate-950/80 px-4 md:px-6 py-2 overflow-x-auto scrollbar-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs rounded-xl bg-purple-600 text-white font-extrabold shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>SuperAdmin Console</span>
                </button>
              </div>
              <div className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold">
                Control Plane Active • Role: SuperAdmin
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs sticky top-0 z-45 transition-all text-[#0f172a]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
                  <Wallet className="h-5.5 w-5.5 text-white" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-extrabold tracking-tight leading-tight text-slate-900">Porulalar Wealth</h1>
                  <span className="text-[9px] text-blue-600 font-mono tracking-wider block font-bold uppercase">
                    PERSONAL WEALTH WORKSPACE
                  </span>
                </div>
              </div>

              {/* Compact controls on mobile */}
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white relative"
                  title="Alerts & Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* GLOBAL SEARCH BAR */}
            <div className="relative flex-1 max-w-md w-full" id="global-search-container">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search ledger, assets, goals..."
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-2xl pl-10 pr-10 py-2 text-xs text-[#0f172a] placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {isSearchFocused && searchQuery.trim() && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSearchFocused(false)} 
                  />
                  
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl max-h-[420px] overflow-y-auto z-50 p-4 space-y-4 text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Search Results ({totalResultsCount})
                      </span>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    {totalResultsCount === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <p className="text-sm font-semibold">No matches found</p>
                        <p className="text-xs mt-1">Try searching for details, categories, or amounts.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {searchResults.expenses.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-widest pl-1">
                              <Receipt className="h-3.5 w-3.5" /> Expenses ({searchResults.expenses.length})
                            </div>
                            <div className="space-y-1">
                              {searchResults.expenses.map((e: any) => (
                                <button
                                  key={e.id}
                                  onClick={() => {
                                    navigate('/expenses');
                                    setIsSearchFocused(false);
                                  }}
                                  className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between border border-transparent hover:border-slate-100 cursor-pointer"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">{e.description || e.category}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      <span className="font-semibold text-rose-600">{e.category}</span>
                                      <span>• {e.date}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs font-black text-rose-600 font-mono">-₹{e.amount.toLocaleString('en-IN')}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchResults.income.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-1">
                              <ArrowDownLeft className="h-3.5 w-3.5" /> Income ({searchResults.income.length})
                            </div>
                            <div className="space-y-1">
                              {searchResults.income.map((i: any) => (
                                <button
                                  key={i.id}
                                  onClick={() => {
                                    navigate('/income');
                                    setIsSearchFocused(false);
                                  }}
                                  className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between border border-transparent hover:border-slate-100 cursor-pointer"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">{i.description || i.source}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                      <span className="font-semibold text-emerald-600">{i.source}</span>
                                      <span>• {i.date}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs font-black text-emerald-600 font-mono">+₹{i.amount.toLocaleString('en-IN')}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 bg-white shadow-xs cursor-pointer transition-all relative"
                title="Alerts & Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </button>

              {/* Settings Quick Access */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 bg-white shadow-xs cursor-pointer transition-all"
                title="Preferences & Settings"
              >
                <Sliders className="h-4.5 w-4.5" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl select-none">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className="h-5 w-5 rounded-full" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{user?.email || 'Active User'}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 bg-white shadow-xs cursor-pointer transition-all"
                title="Sign Out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* FULL WIDTH HORIZONTAL HUB NAVIGATION BAR */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 md:px-6 py-2 overflow-x-auto scrollbar-none">
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              {(() => {
                type TabDef = { id: string; label: string; icon: any };
                const hubs: TabDef[] = [
                  { id: 'dashboard', label: 'Overview', icon: Grid },
                  { id: 'cashflow', label: 'Cash Flow', icon: Receipt },
                  { id: 'accounts', label: 'Accounts & Credit', icon: Building2 },
                  { id: 'obligations', label: 'Obligations & Chits', icon: Percent },
                  { id: 'portfolio', label: 'Portfolio & Assets', icon: PiggyBank },
                  { id: 'system', label: 'AI Supervisor', icon: Sparkles }
                ];

                return hubs.map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60 font-semibold'
                      }`}
                    >
                      <IconComp className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </header>
      )}

      {/* Main Layout view wrapper - 100% Width */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6">
        <main className="w-full">
          {isAdminUser ? <AdminPage /> : <Outlet />}
        </main>
      </div>

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setIsNotificationsOpen(false)} />
          <div className="relative bg-white border-l border-slate-200 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-600" /> Notification Center
              </h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <BellOff className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-semibold">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 shadow-xs transition-all ${
                        n.severity === 'urgent'
                          ? 'border-rose-200 bg-rose-50 text-rose-950'
                          : n.severity === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-950'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-950'
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center ${
                        n.severity === 'urgent' ? 'bg-rose-100 text-rose-600' : n.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 block">{n.title}</span>
                        <p className="text-slate-600 font-medium">{n.description}</p>
                        <span className="text-[9px] text-slate-400 font-semibold block pt-1">Due: {n.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Quick Ledger */}
      {!isAdminUser && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {isQuickActionOpen && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom duration-250 mb-2">
              <button
                onClick={() => {
                  setActiveQuickForm('expense');
                  setIsQuickActionOpen(false);
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4.5 py-2.5 rounded-2xl shadow-md text-xs transition-colors cursor-pointer border border-rose-500/30"
              >
                <Receipt className="h-4 w-4" />
                <span>Log Quick Expense</span>
              </button>
              <button
                onClick={() => {
                  setActiveQuickForm('income');
                  setIsQuickActionOpen(false);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4.5 py-2.5 rounded-2xl shadow-md text-xs transition-colors cursor-pointer border border-emerald-500/30"
              >
                <ArrowDownLeft className="h-4 w-4" />
                <span>Log Quick Income</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className={`h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg border transition-colors cursor-pointer ${
              isQuickActionOpen 
                ? 'bg-slate-800 hover:bg-slate-900 border-slate-700 rotate-45' 
                : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500'
            }`}
            title="Quick Action Ledger"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Rapid Add Modal */}
      {activeQuickForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-fade-in" id="quick-action-modal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in text-slate-900">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                  activeQuickForm === 'expense' 
                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                    : activeQuickForm === 'income' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}>
                  {activeQuickForm === 'expense' ? <Receipt className="h-5 w-5" /> : activeQuickForm === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900 text-sm">Rapidly Log New {activeQuickForm === 'expense' ? 'Expense' : 'Income'}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Bypasses main tabs. Saves instantly.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuickForm(null)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeQuickForm === 'expense' && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const date = (form.elements.namedItem('date') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
                const subCategory = (form.elements.namedItem('subCategory') as HTMLInputElement).value;
                const amt = (form.elements.namedItem('amount') as HTMLInputElement).value;
                const paymentMethod = (form.elements.namedItem('paymentMethod') as HTMLSelectElement).value;
                const description = (form.elements.namedItem('description') as HTMLInputElement).value;

                const numAmt = Number(amt);
                if (isNaN(numAmt) || numAmt <= 0) {
                  await showAlert('Please enter a valid expense amount.', 'Validation Error', 'error');
                  return;
                }

                try {
                  const nowStr = new Date().toISOString();
                  const expenseObj = {
                    userId: user?.uid,
                    date,
                    category,
                    subCategory: subCategory || 'General',
                    amount: numAmt,
                    paymentMethod,
                    description: description || `${category} purchase`,
                    tags: [],
                    createdAt: nowStr,
                    updatedAt: nowStr,
                  };

                  await porulalarStore.addRecord('expenses', expenseObj);

                  form.reset();
                  setActiveQuickForm(null);
                  setSchedulerMessage(`Successfully logged ₹${numAmt.toLocaleString('en-IN')} expense!`);
                  setTimeout(() => setSchedulerMessage(null), 4000);
                } catch (err) {
                  console.error(err);
                  await showAlert('Failed to log expense.', 'Error', 'error');
                }
              }} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <input type="date" required name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <select name="category" defaultValue={getMergedCategories()[0]?.name || 'Food'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20">
                      {getMergedCategories().map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Sub-Category</label>
                    <input type="text" name="subCategory" placeholder="e.g. Vegetables" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
                    <input type="number" required name="amount" min="1" step="0.01" placeholder="e.g. 450" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                    <select name="paymentMethod" defaultValue="UPI" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20">
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      {banks.map(b => (
                        <option key={b.id} value={`Bank: ${b.bankName}`}>Bank: {b.bankName}</option>
                      ))}
                      {cards.filter(c => c.cardType === 'Credit').map(c => (
                        <option key={c.id} value={`CC: ${c.cardName}`}>CC: {c.cardName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                    <input type="text" name="description" placeholder="e.g. Weekly grocery shopping" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setActiveQuickForm(null)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer">Log Expense</button>
                </div>
              </form>
            )}

            {activeQuickForm === 'income' && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const date = (form.elements.namedItem('date') as HTMLInputElement).value;
                const source = (form.elements.namedItem('source') as HTMLSelectElement).value;
                const amt = (form.elements.namedItem('amount') as HTMLInputElement).value;
                const description = (form.elements.namedItem('description') as HTMLInputElement).value;

                const numAmt = Number(amt);
                if (isNaN(numAmt) || numAmt <= 0) {
                  await showAlert('Please enter a valid income amount.', 'Validation Error', 'error');
                  return;
                }

                try {
                  const incomeObj = {
                    userId: user?.uid,
                    date,
                    source,
                    amount: numAmt,
                    description: description || `${source} Income`,
                    recurring: false,
                    linkedBankId: null,
                    createdAt: new Date().toISOString(),
                  };

                  await porulalarStore.addRecord('income', incomeObj);
                  form.reset();
                  setActiveQuickForm(null);
                  setSchedulerMessage(`Successfully logged ₹${numAmt.toLocaleString('en-IN')} income!`);
                  setTimeout(() => setSchedulerMessage(null), 4000);
                } catch (err) {
                  console.error(err);
                  await showAlert('Failed to log income.', 'Error', 'error');
                }
              }} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <input type="date" required name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Source</label>
                    <select name="source" defaultValue="Salary" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20">
                      <option value="Salary">Salary</option>
                      <option value="Farm Income">Farm Income</option>
                      <option value="Milk Sales">Milk Sales</option>
                      <option value="Chit Received">Chit Received</option>
                      <option value="Bonus">Bonus</option>
                      <option value="Interest Income">Interest Income</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (₹)</label>
                    <input type="number" required name="amount" min="1" step="0.01" placeholder="e.g. 50000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                    <input type="text" name="description" placeholder="e.g. Monthly corporate salary transfer" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setActiveQuickForm(null)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer">Log Income</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mobile PWA Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={location.pathname.replace('/', '') || 'dashboard'}
        onSelectTab={(tab) => navigate(`/${tab}`)}
        onOpenQuickAdd={() => setActiveQuickForm('expense')}
        isSuperAdmin={isAdminUser}
        onLogout={handleLogout}
      />
    </div>
  );
}
