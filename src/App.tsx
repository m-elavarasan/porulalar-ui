import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { initAuth, googleSignIn, logout, getAccessToken, setAccessToken, backendLogin, backendRegister } from './lib/firebase';
import { porulalarStore } from './lib/store';
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
  Handshake
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
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import IncomePage from './pages/IncomePage';
import InvestmentsPage from './pages/InvestmentsPage';
import LoansPage from './pages/LoansPage';
import EMIsPage from './pages/EMIsPage';
import ChitsPage from './pages/ChitsPage';
import AssetsGoalsPage from './pages/AssetsGoalsPage';
import BanksPage from './pages/BanksPage';
import CardsPage from './pages/CardsPage';
import BorrowsPage from './pages/BorrowsPage';
import RecurringPage from './pages/RecurringPage';
import AIPage from './pages/AIPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

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
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const { showAlert } = useDialog();

  // Load cached user profile from previous session if available
  useEffect(() => {
    const cachedUser = localStorage.getItem('cached_firebase_user');
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
          setUser(currentUser as AuthUser);
          setToken(accessToken);
          setNeedsAuth(false);
          localStorage.setItem('cached_firebase_user', JSON.stringify({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: currentUser.role
          }));
        }
      },
      () => {
        const cachedUserObj = localStorage.getItem('cached_firebase_user');
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
        if (!authUsername || !authPassword) {
          throw new Error('Username and Password are required');
        }
        const result = await backendLogin(authUsername, authPassword);
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      } else {
        if (!authUsername || !authEmail || !authPassword) {
          throw new Error('Username, Email, and Password are required');
        }
        if (authPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        const result = await backendRegister(authUsername, authEmail, authPassword);
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
      setAuthUsername('');
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
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      localStorage.removeItem('cached_firebase_user');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 select-none" id="auth-page">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-100">
            <Wallet className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Porulalar AI</h1>
            <p className="text-sm text-slate-500">
              A premium, AI-powered financial supervisor. Synchronize expenses, chit auctions, EMI reminders, and bank-alerts securely.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">
              {authMode === 'login' ? 'Sign In to Your Account' : 'Register a New Account'}
            </h2>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs text-left flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 text-sm font-semibold transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 text-sm font-semibold transition-all bg-slate-50/50 focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 text-sm font-semibold transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </button>
            </div>
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="emis" element={<EMIsPage />} />
            <Route path="chits" element={<ChitsPage />} />
            <Route path="assets-goals" element={<AssetsGoalsPage />} />
            <Route path="banks" element={<BanksPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="borrows" element={<BorrowsPage />} />
            <Route path="recurring" element={<RecurringPage />} />
            <Route path="ai-advisor" element={<AIPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}

// ── AppLayout shell component ───────────────────────────────────────────
function AppLayout({ handleLogout }: { handleLogout: () => void }) {
  const { user } = useAuth();
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
      const [loansList, emisList, chitsList, banksList, cardsList, budgetsList, catsList] = await Promise.all([
        porulalarStore.fetchCollection('loans'),
        porulalarStore.fetchCollection('emis'),
        porulalarStore.fetchCollection('chits'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards'),
        porulalarStore.fetchCollection('budgets'),
        porulalarStore.fetchCollection('customCategories')
      ]);
      setLoans(loansList);
      setEmis(emisList);
      setChits(chitsList);
      setBanks(banksList);
      setCards(cardsList);
      setBudgets(budgetsList);
      setCustomCategories(catsList || []);
    } catch (e) {
      console.error('Error fetching layout overview details:', e);
    } finally {
      isLoadingLayout.current = false;
    }
  };

  const debouncedLoadLayoutData = useMemo(() => {
    return debounce(loadLayoutData, 100);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadLayoutData();

    // Subscribe to updates so notifications reflect changes immediately
    const unsubLoans = porulalarStore.subscribe('loans', debouncedLoadLayoutData);
    const unsubEmis = porulalarStore.subscribe('emis', debouncedLoadLayoutData);
    const unsubChits = porulalarStore.subscribe('chits', debouncedLoadLayoutData);
    const unsubBanks = porulalarStore.subscribe('banks', debouncedLoadLayoutData);
    const unsubCards = porulalarStore.subscribe('cards', debouncedLoadLayoutData);

    // Initial Scheduler Trigger
    const triggerScheduler = async () => {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      try {
        const res = await fetch(`${API_BASE}/api/scheduler/run`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
          }
        });
        if (res.ok) {
          setSchedulerMessage("Auto-scheduled payments synced from backend successfully!");
          setTimeout(() => setSchedulerMessage(null), 5000);
        }
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
  }, [user]);

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
    if (path.startsWith('/expenses')) return 'expenses';
    if (path.startsWith('/income')) return 'income';
    if (path.startsWith('/banks')) return 'banks';
    if (path.startsWith('/cards')) return 'cards';
    if (path.startsWith('/emis')) return 'emis';
    if (path.startsWith('/borrows')) return 'borrows';
    if (path.startsWith('/loans')) return 'loans';
    if (path.startsWith('/chits')) return 'chits';
    if (path.startsWith('/investments')) return 'investments';
    if (path.startsWith('/assets-goals')) return 'assets';
    if (path.startsWith('/recurring')) return 'recurring';
    if (path.startsWith('/ai-advisor')) return 'ai';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/admin')) return 'admin';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tabId: string) => {
    const pathMap: Record<string, string> = {
      dashboard: '/dashboard',
      expenses: '/expenses',
      income: '/income',
      banks: '/banks',
      cards: '/cards',
      emis: '/emis',
      borrows: '/borrows',
      loans: '/loans',
      chits: '/chits',
      investments: '/investments',
      assets: '/assets-goals',
      recurring: '/recurring',
      ai: '/ai-advisor',
      settings: '/settings',
      admin: '/admin'
    };
    navigate(pathMap[tabId] || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans" id="main-app">
      {/* Top Banner Message */}
      {schedulerMessage && (
        <div className="bg-emerald-600 text-white py-3 px-6 text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-md animate-bounce">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {schedulerMessage}
        </div>
      )}

      {/* Primary Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-150/50 shadow-premium py-3 md:py-4 px-4 md:px-6 sticky top-0 z-45 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 md:h-10 md:w-10 bg-gradient-to-tr from-indigo-50 to-violet-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-150/50 shadow-2xs transition-all hover:scale-105">
                <Wallet className="h-5 w-5 md:h-5.5 md:w-5.5 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-black text-slate-800 tracking-tight leading-tight">Personal Wealth</h1>
                <span className="text-[10px] md:text-xs text-slate-400 font-mono tracking-wider">UID: {user?.uid.substring(0, 8)}...</span>
              </div>
            </div>

            {/* Compact controls on mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-100 bg-white relative"
                title="Alerts & Notifications"
              >
                <Bell className="h-4 w-4" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {alertCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 bg-white"
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
                placeholder="Search transactions, investments, loans..."
                className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl pl-10 pr-10 py-2 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 font-medium shadow-2xs focus:shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl max-h-[420px] overflow-y-auto z-50 p-4 space-y-4 text-left">
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
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">
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
                                  <div className="text-xs font-bold text-slate-700">{e.description || e.category}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-semibold text-rose-500">{e.category}</span>
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
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">
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
                                  <div className="text-xs font-bold text-slate-700">{i.description || i.source}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-semibold text-emerald-500">{i.source}</span>
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

          <div className="hidden md:flex items-center gap-3.5">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-100 bg-white shadow-3xs cursor-pointer transition-all relative"
              title="Alerts & Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-xl select-none">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{user?.username || 'Active User'}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-100 bg-white shadow-3xs cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout view wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-4 md:py-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
        <aside className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-3.5 lg:pb-0 gap-2 lg:gap-1.5 scrollbar-none" id="nav-rail">
          {(() => {
            type TabDef = { id: string; label: string; icon: any };
            const groups: { title?: string; tabs: TabDef[] }[] = [
              { tabs: [{ id: 'dashboard', label: 'Dashboard', icon: Grid }] },
              { title: 'Transactions', tabs: [
                { id: 'expenses', label: 'Expenses', icon: Receipt },
                { id: 'income', label: 'Income Ledger', icon: ArrowDownLeft },
                { id: 'borrows', label: 'Borrow / Lend', icon: Handshake }
              ]},
              { title: 'Banking & Cards', tabs: [
                { id: 'banks', label: 'Bank Accounts', icon: Building2 },
                { id: 'cards', label: 'Credit Cards', icon: CreditCard }
              ]},
              { title: 'Fixed Obligations', tabs: [
                { id: 'emis', label: 'EMI Reminders', icon: Clock },
                { id: 'loans', label: 'Liability Loans', icon: Briefcase },
                { id: 'chits', label: 'Chit Funds', icon: Percent }
              ]},
              { title: 'Portfolio Management', tabs: [
                { id: 'investments', label: 'SIP Investments', icon: PiggyBank },
                { id: 'assets', label: 'Capital Assets', icon: Award }
              ]},
              { title: 'Administration', tabs: [
                { id: 'recurring', label: 'Autopay Scheduler', icon: Calendar },
                { id: 'ai', label: 'AI Supervisor', icon: Sparkles },
                { id: 'settings', label: 'Config Panel', icon: Sliders }
              ]}
            ];

            // Render role specific Super Admin tab
            if (user?.role === 'admin') {
              groups.push({
                title: 'System Supervision',
                tabs: [{ id: 'admin', label: 'Admin Terminal', icon: Sliders }]
              });
            }

            return groups.map((g, idx) => (
              <React.Fragment key={idx}>
                {g.title && (
                  <span className="hidden lg:block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3 mt-4 mb-1">
                    {g.title}
                  </span>
                )}
                {g.tabs.map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer shrink-0 border lg:w-full lg:justify-between lg:py-2.5 lg:px-4 lg:rounded-xl hover:-translate-y-[1px] active:translate-y-0 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-premium shadow-indigo-500/20 border-indigo-600'
                          : 'bg-white/80 border-slate-150/40 text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight className={`hidden lg:block h-3.5 w-3.5 opacity-50 transition-transform ${isActive ? 'rotate-90 opacity-100' : ''}`} />
                    </button>
                  );
                })}
              </React.Fragment>
            ));
          })()}
        </aside>

        {/* Content routing window */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsNotificationsOpen(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500 animate-pulse" /> Notification Center
              </h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 cursor-pointer transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <BellOff className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 shadow-3xs hover:shadow-xs transition-shadow ${
                        n.severity === 'urgent'
                          ? 'border-rose-100 bg-rose-50/20 text-rose-800'
                          : n.severity === 'warning'
                          ? 'border-amber-100 bg-amber-50/20 text-amber-800'
                          : 'border-indigo-100 bg-indigo-50/20 text-indigo-800'
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center ${
                        n.severity === 'urgent' ? 'bg-rose-100 text-rose-600' : n.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800 block">{n.title}</span>
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
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {isQuickActionOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom duration-250 mb-2">
            <button
              onClick={() => {
                setActiveQuickForm('expense');
                setIsQuickActionOpen(false);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4.5 py-2.5 rounded-2xl shadow-lg hover:shadow-xl text-xs transition-all cursor-pointer border border-rose-500/30 hover:scale-105 active:scale-95"
            >
              <Receipt className="h-4 w-4" />
              <span>Log Quick Expense</span>
            </button>
            <button
              onClick={() => {
                setActiveQuickForm('income');
                setIsQuickActionOpen(false);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4.5 py-2.5 rounded-2xl shadow-lg hover:shadow-xl text-xs transition-all cursor-pointer border border-emerald-500/30 hover:scale-105 active:scale-95"
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>Log Quick Income</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          className={`h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl border transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
            isQuickActionOpen 
              ? 'bg-slate-800 hover:bg-slate-900 border-slate-700 rotate-45' 
              : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500'
          }`}
          title="Quick Action Ledger"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Rapid Add Modal */}
      {activeQuickForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="quick-action-modal">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                  activeQuickForm === 'expense' 
                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                    : activeQuickForm === 'income' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                }`}>
                  {activeQuickForm === 'expense' ? <Receipt className="h-5 w-5" /> : activeQuickForm === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-sm">Rapidly Log New {activeQuickForm === 'expense' ? 'Expense' : 'Income'}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Bypasses main tabs. Saves instantly.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuickForm(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
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
    </div>
  );
}
