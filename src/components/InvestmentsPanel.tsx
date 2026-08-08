import { porulalarStore, increment } from '../lib/store';
import { analyticsService } from '../services/analyticsService';
import { bankService } from '../services/bankService';
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  RefreshCw, 
  Pencil, 
  Upload, 
  CheckCircle,
  Search,
  Filter,
  PieChart,
  LineChart,
  Landmark,
  Coins,
  Layers,
  ArrowUpDown,
  Zap,
  Wallet,
  ShieldCheck,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Investment, Bank, Card } from '../types';
import { useDialog } from './DialogProvider';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { numberToWords } from '../lib/utils';

interface InvestmentsPanelProps {
  userId: string;
  investments: Investment[];
  banks?: Bank[];
  cards?: Card[];
  onRefreshData: () => void;
}

const INVESTMENT_TYPES = [
  'Mutual Fund',
  'Stocks',
  'Gold',
  'FD',
  'RD',
  'PPF',
  'NPS',
  'Chit Investment',
  'Other',
];

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Investments', icon: Wallet },
  { id: 'Mutual Fund', label: 'Mutual Funds', icon: PieChart },
  { id: 'Stocks', label: 'Stocks & Equity', icon: LineChart },
  { id: 'Gold', label: 'Gold & Bullion', icon: Coins },
  { id: 'FIXED', label: 'FD / RD / PPF', icon: Landmark },
  { id: 'Chit Investment', label: 'Chits & Others', icon: Layers },
];

export default function InvestmentsPanel({ userId, investments, banks, cards, onRefreshData }: InvestmentsPanelProps) {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  
  // Filter and Sort states
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'returns' | 'sip' | 'name'>('value');

  // Form state
  const [investmentType, setInvestmentType] = useState('Mutual Fund');
  const [investmentName, setInvestmentName] = useState('');
  const [platform, setPlatform] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [isLiveTracked, setIsLiveTracked] = useState(false);
  const [isRecurringSip, setIsRecurringSip] = useState(false);
  const [sipDate, setSipDate] = useState('1');
  const [units, setUnits] = useState('');
  const [schemeCode, setSchemeCode] = useState('');
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [mfSearchResults, setMfSearchResults] = useState<any[]>([]);
  const [isSearchingMf, setIsSearchingMf] = useState(false);
  const [stockSearchResults, setStockSearchResults] = useState<any[]>([]);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [autoPay, setAutoPay] = useState(false);
  const [autoPaySourceId, setAutoPaySourceId] = useState('');
  const [paySourceIds, setPaySourceIds] = useState<{ [id: string]: string }>({});

  const [showAddForm, setShowAddForm] = useState(false);

  // XIRR State
  const [xirrValues, setXirrValues] = useState<{ [id: string]: number }>({});
  const [loadingXirr, setLoadingXirr] = useState(false);

  // CAS statement ingestion state
  const [showCasModal, setShowCasModal] = useState(false);
  const [isParsingCas, setIsParsingCas] = useState(false);
  const [parsedInvestments, setParsedInvestments] = useState<any[]>([]);

  const fetchXIRRs = async () => {
    setLoadingXirr(true);
    try {
      const data = await analyticsService.getXIRRs();
      const mapping: { [id: string]: number } = {};
      data.forEach((item: any) => {
        mapping[item.id] = item.xirrPercentage;
      });
      setXirrValues(mapping);
    } catch (e) {
      console.error("Failed to fetch XIRRs:", e);
    } finally {
      setLoadingXirr(false);
    }
  };

  React.useEffect(() => {
    fetchXIRRs();
  }, [investments]);

  // Executive KPI Calculations
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalMonthlySip = 0;
    let activeSipCount = 0;
    let liveTrackedCount = 0;

    investments.forEach((inv) => {
      totalInvested += inv.investedAmount || 0;
      totalCurrent += inv.currentValue || 0;
      if (inv.monthlyContribution && inv.monthlyContribution > 0) {
        totalMonthlySip += inv.monthlyContribution;
        activeSipCount++;
      }
      if (inv.isLiveTracked) {
        liveTrackedCount++;
      }
    });

    const totalProfit = totalCurrent - totalInvested;
    const overallReturnPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalProfit,
      overallReturnPct,
      totalMonthlySip,
      activeSipCount,
      liveTrackedCount,
      totalAssetsCount: investments.length,
    };
  }, [investments]);

  // Filtered & Sorted Investments
  const filteredInvestments = useMemo(() => {
    return investments
      .filter((inv) => {
        // Tab Filter
        if (selectedTab === 'FIXED') {
          if (!['FD', 'RD', 'PPF', 'NPS'].includes(inv.investmentType)) return false;
        } else if (selectedTab === 'Chit Investment') {
          if (!['Chit Investment', 'Other'].includes(inv.investmentType)) return false;
        } else if (selectedTab !== 'ALL' && inv.investmentType !== selectedTab) {
          return false;
        }

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = inv.investmentName?.toLowerCase().includes(q);
          const matchPlatform = inv.platform?.toLowerCase().includes(q);
          const matchType = inv.investmentType?.toLowerCase().includes(q);
          const matchNotes = inv.notes?.toLowerCase().includes(q);
          return matchName || matchPlatform || matchType || matchNotes;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'value') return b.currentValue - a.currentValue;
        if (sortBy === 'returns') {
          const retA = a.investedAmount > 0 ? ((a.currentValue - a.investedAmount) / a.investedAmount) * 100 : 0;
          const retB = b.investedAmount > 0 ? ((b.currentValue - b.investedAmount) / b.investedAmount) * 100 : 0;
          return retB - retA;
        }
        if (sortBy === 'sip') return (b.monthlyContribution || 0) - (a.monthlyContribution || 0);
        if (sortBy === 'name') return a.investmentName.localeCompare(b.investmentName);
        return 0;
      });
  }, [investments, selectedTab, searchQuery, sortBy]);

  const handleCASImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsParsingCas(true);
    
    setTimeout(async () => {
      const mockExtracted = [
        {
          id: 'cas_inv_1',
          investmentName: 'Parag Parikh Flexi Cap Fund - Direct (CAS)',
          investmentType: 'Mutual Fund',
          platform: 'Groww CAS',
          investedAmount: 150000,
          currentValue: 204320,
          units: 3240.23,
          startDate: '2023-01-15',
          isLiveTracked: true,
          schemeCode: '122639'
        },
        {
          id: 'cas_inv_2',
          investmentName: 'SBI Small Cap Fund - Growth (CAS)',
          investmentType: 'Mutual Fund',
          platform: 'Zerodha Coin CAS',
          investedAmount: 80000,
          currentValue: 112500,
          units: 1450.40,
          startDate: '2023-04-10',
          isLiveTracked: true,
          schemeCode: '125497'
        },
        {
          id: 'cas_inv_3',
          investmentName: 'Mirae Asset Large Cap Fund - Direct (CAS)',
          investmentType: 'Mutual Fund',
          platform: 'CAS Ingestion',
          investedAmount: 120000,
          currentValue: 156800,
          units: 2150.10,
          startDate: '2022-11-05',
          isLiveTracked: true,
          schemeCode: '119062'
        }
      ];

      setParsedInvestments(mockExtracted);
      setIsParsingCas(false);
      setShowCasModal(true);
    }, 1500);
  };

  const handleSaveCasInvestments = async () => {
    try {
      for (const item of parsedInvestments) {
        const gain = item.currentValue - item.investedAmount;
        const returns = item.investedAmount > 0 ? (gain / item.investedAmount) * 100 : 0;
        
        await porulalarStore.addRecord('investments', {
          userId,
          investmentType: item.investmentType,
          investmentName: item.investmentName,
          platform: item.platform,
          investedAmount: item.investedAmount,
          currentValue: item.currentValue,
          monthlyContribution: 5000,
          startDate: item.startDate,
          lastUpdated: new Date().toISOString().split('T')[0],
          gainLoss: gain,
          returnPercentage: returns,
          notes: 'Ingested via Consolidated Account Statement (CAS)',
          isLiveTracked: item.isLiveTracked,
          units: item.units,
          schemeCode: item.schemeCode,
          isRecurringSip: true,
          sipDate: 15,
        });
      }
      setShowCasModal(false);
      setParsedInvestments([]);
      await showAlert(`Successfully imported ${parsedInvestments.length} mutual funds from your CAS statement!`, 'CAS Ingested', 'success');
      onRefreshData();
    } catch (e) {
      showAlert('Failed to save imported investments', 'Error', 'error');
    }
  };

  const resetForm = () => {
    setInvestmentType('Mutual Fund');
    setInvestmentName('');
    setPlatform('');
    setInvestedAmount('');
    setCurrentValue('');
    setMonthlyContribution('');
    setNotes('');
    setUnits('');
    setSchemeCode('');
    setTickerSymbol('');
    setIsLiveTracked(false);
    setIsRecurringSip(false);
    setSipDate('1');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEditingInvestmentId(null);
  };

  const handleEditInvestment = (inv: Investment) => {
    setEditingInvestmentId(inv.id);
    setInvestmentType(inv.investmentType);
    setInvestmentName(inv.investmentName);
    setPlatform(inv.platform || '');
    setInvestedAmount(inv.investedAmount.toString());
    setCurrentValue(inv.currentValue.toString());
    setMonthlyContribution((inv.monthlyContribution || 0).toString());
    setNotes(inv.notes || '');
    setIsLiveTracked(inv.isLiveTracked || false);
    setUnits((inv.units || '').toString());
    setSchemeCode(inv.schemeCode || '');
    setTickerSymbol(inv.tickerSymbol || '');
    setAutoPay(inv.autoPay || false);
    setAutoPaySourceId(inv.autoPaySourceId || '');
    setIsRecurringSip(inv.isRecurringSip || false);
    setSipDate((inv.sipDate || '1').toString());
    setStartDate(inv.startDate || new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentName || !investedAmount) return;

    const invested = Number(investedAmount);
    const current = isLiveTracked ? 0 : Number(currentValue);

    if (isNaN(invested) || invested <= 0) {
      await showAlert('Please enter a valid invested amount greater than 0.', 'Validation Error', 'error');
      return;
    }
    if (!isLiveTracked && (isNaN(current) || current < 0)) {
      await showAlert('Please enter a valid current value.', 'Validation Error', 'error');
      return;
    }
    
    if (isLiveTracked && (!units || isNaN(Number(units)))) {
      await showAlert('Please enter a valid number of units/shares for live tracking.', 'Validation Error', 'error');
      return;
    }

    try {
      let currentValForCalc = current;
      if (editingInvestmentId && isLiveTracked) {
        const existing = investments.find(i => i.id === editingInvestmentId);
        if (existing) currentValForCalc = existing.currentValue;
      }
      
      const gain = currentValForCalc - invested;
      const returns = invested > 0 ? (gain / invested) * 100 : 0;

      const payload = {
        userId,
        investmentType,
        investmentName,
        platform: platform || 'Direct',
        investedAmount: invested,
        currentValue: currentValForCalc,
        monthlyContribution: Number(monthlyContribution) || 0,
        startDate,
        lastUpdated: new Date().toISOString().split('T')[0],
        gainLoss: gain,
        returnPercentage: returns,
        notes: notes || '',
        isLiveTracked,
        units: isLiveTracked ? Number(units) : 0,
        schemeCode: isLiveTracked ? schemeCode : '',
        tickerSymbol: isLiveTracked ? tickerSymbol : '',
        isRecurringSip,
        sipDate: isRecurringSip ? Number(sipDate) : null,
        autoPay,
        autoPaySourceId,
      };

      if (editingInvestmentId) {
        await porulalarStore.updateRecord('investments', editingInvestmentId, payload);
      } else {
        await porulalarStore.addRecord('investments', payload);
      }

      resetForm();
      setShowAddForm(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this investment?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('investments', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const searchMf = async (query: string) => {
    if (query.length < 3) {
      setMfSearchResults([]);
      return;
    }
    setIsSearchingMf(true);
    try {
      const data = await bankService.searchMutualFunds(query);
      setMfSearchResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMf(false);
    }
  };

  const searchStock = async (query: string) => {
    if (query.length < 3) {
      setStockSearchResults([]);
      return;
    }
    setIsSearchingStock(true);
    try {
      const url = encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=5&newsCount=0&region=IN&lang=en-IN`);
      const data = await bankService.fetchExternalUrlProxy(url);
      const parsed = JSON.parse(data.contents);
      setStockSearchResults(parsed.quotes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingStock(false);
    }
  };

  const handleRecordSIP = async (inv: any) => {
    if (inv.monthlyContribution <= 0) {
      await showAlert('Please set a monthly SIP contribution amount for this investment first!', 'Error', 'error');
      return;
    }

    try {
      let livePrice = 0;
      let newUnitsBought = 0;
      let updatedCurrent = inv.currentValue + inv.monthlyContribution;

      if (inv.isLiveTracked) {
        setIsSyncing(true);
        try {
          if (inv.investmentType === 'Mutual Fund' && inv.schemeCode) {
            const data = await bankService.fetchMFDetails(inv.schemeCode);
            if (data && data.data && data.data.length > 0) {
              livePrice = parseFloat(data.data[0].nav);
            }
          } 
          else if (inv.investmentType === 'Stocks' && inv.tickerSymbol) {
             const url = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${inv.tickerSymbol}?interval=1d&range=1d`);
             const data = await bankService.fetchExternalUrlProxy(url);
             const parsed = JSON.parse(data.contents);
             const price = parsed?.chart?.result?.[0]?.meta?.regularMarketPrice;
             if (price) livePrice = parseFloat(price);
          }
        } catch (e) {
          console.error("Live price fetch failed during SIP:", e);
        } finally {
          setIsSyncing(false);
        }

        if (livePrice > 0) {
          newUnitsBought = inv.monthlyContribution / livePrice;
          const totalUnits = (inv.units || 0) + newUnitsBought;
          updatedCurrent = totalUnits * livePrice;
        } else {
          await showAlert('Failed to fetch live market price. Cannot calculate units bought automatically. Try again later.', 'API Error', 'error');
          return;
        }
      }

      const updatedInvested = inv.investedAmount + inv.monthlyContribution;
      const gain = updatedCurrent - updatedInvested;
      const returns = updatedInvested > 0 ? (gain / updatedInvested) * 100 : 0;

      const payload: any = {
        investedAmount: updatedInvested,
        currentValue: updatedCurrent,
        gainLoss: gain,
        returnPercentage: returns,
        lastUpdated: new Date().toISOString().split('T')[0],
      };

      if (inv.isLiveTracked && newUnitsBought > 0) {
        payload.units = (inv.units || 0) + newUnitsBought;
      }

      await porulalarStore.updateRecord('investments', inv.id, payload);

      const sourceIdForInv = paySourceIds[inv.id] || inv.autoPaySourceId || '';
      const bank = sourceIdForInv ? banks?.find(b => b.id === sourceIdForInv) : null;
      const card = sourceIdForInv ? cards?.find(c => c.id === sourceIdForInv) : null;

      if (bank) {
        await porulalarStore.updateRecord('banks', bank.id, { currentBalance: increment(-inv.monthlyContribution) });
      }
      if (card) {
        await porulalarStore.updateRecord('cards', card.id, { currentOutstanding: increment(inv.monthlyContribution) });
      }

      await porulalarStore.addRecord('expenses', {
        userId,
        date: new Date().toISOString().split('T')[0],
        category: 'Investment',
        subCategory: inv.investmentName,
        amount: inv.monthlyContribution,
        paymentMethod: bank ? bank.bankName : (card ? card.cardName : 'Auto-Debit'),
        description: `SIP payment for ${inv.investmentName}`,
        tags: ['SIP'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (inv.isLiveTracked && newUnitsBought > 0) {
        await showAlert(`SIP of ₹${inv.monthlyContribution.toLocaleString('en-IN')} recorded! Added ${newUnitsBought.toFixed(3)} units at ₹${livePrice.toFixed(2)}/unit.`, 'Success', 'success');
      } else {
        await showAlert(`SIP installment of ₹${inv.monthlyContribution.toLocaleString('en-IN')} successfully recorded!`, 'Success', 'success');
      }
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCurrentValue = async (inv: any) => {
    const newValStr = await showPrompt(`Update current market value for "${inv.investmentName}" (Invested: ₹${inv.investedAmount.toLocaleString('en-IN')}):`);
    if (!newValStr || isNaN(Number(newValStr))) return;
    const newVal = Number(newValStr);

    try {
      const gain = newVal - inv.investedAmount;
      const returns = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;

      await porulalarStore.updateRecord('investments', inv.id, {
        currentValue: newVal,
        gainLoss: gain,
        returnPercentage: returns,
        lastUpdated: new Date().toISOString().split('T')[0],
      });

      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLivePrices = async () => {
    setIsSyncing(true);
    let updatedCount = 0;
    try {
      for (const inv of investments) {
        if (!inv.isLiveTracked || !inv.units) continue;
        
        let livePrice = 0;
        
        if (inv.investmentType === 'Mutual Fund' && inv.schemeCode) {
          try {
            const data = await bankService.fetchMFDetails(inv.schemeCode);
            if (data && data.data && data.data.length > 0) {
              livePrice = parseFloat(data.data[0].nav);
            }
          } catch (e) {
            console.error("MFAPI error:", e);
          }
        } 
        else if (inv.investmentType === 'Stocks' && inv.tickerSymbol) {
           try {
             const url = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${inv.tickerSymbol}?interval=1d&range=1d`);
             const data = await bankService.fetchExternalUrlProxy(url);
             const parsed = JSON.parse(data.contents);
             const price = parsed?.chart?.result?.[0]?.meta?.regularMarketPrice;
             if (price) livePrice = parseFloat(price);
           } catch (e) {
             console.error("Stock API error:", e);
           }
        }

        if (livePrice > 0 && inv.units > 0) {
          const newCurrentValue = livePrice * inv.units;
          const gain = newCurrentValue - inv.investedAmount;
          const returns = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
          
          await porulalarStore.updateRecord('investments', inv.id, {
            currentValue: newCurrentValue,
            gainLoss: gain,
            returnPercentage: returns,
            lastUpdated: new Date().toISOString().split('T')[0],
          });
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        await showAlert(`Successfully synced live market prices for ${updatedCount} assets!`, 'Live Sync Complete', 'success');
        onRefreshData();
      } else {
        await showAlert('No live tracked assets were updated. Check if you have added Units/Shares to your live tracked investments.', 'Sync Complete', 'info');
      }
    } catch (e) {
      console.error(e);
      await showAlert('Failed to fetch live prices from the market APIs.', 'Sync Error', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const getChartData = () => {
    if (!investments || investments.length === 0) return [];

    const datesSet = new Set<string>();
    investments.forEach((inv) => {
      if (inv.startDate) datesSet.add(inv.startDate);
      if (inv.lastUpdated) datesSet.add(inv.lastUpdated);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    datesSet.add(todayStr);

    const sortedDates = Array.from(datesSet).sort();

    const getDaysDiff = (d1: string, d2: string) => {
      const time1 = new Date(d1).getTime();
      const time2 = new Date(d2).getTime();
      return Math.max(0, (time2 - time1) / (1000 * 60 * 60 * 24));
    };

    return sortedDates.map((dateStr) => {
      let totalInvested = 0;
      let totalCurrent = 0;

      investments.forEach((inv) => {
        const start = inv.startDate || todayStr;
        const last = inv.lastUpdated || start;

        if (dateStr < start) {
          return;
        } else if (dateStr >= last) {
          totalInvested += inv.investedAmount || 0;
          totalCurrent += inv.currentValue || 0;
        } else {
          const totalDays = getDaysDiff(start, last);
          const elapsedDays = getDaysDiff(start, dateStr);
          const ratio = totalDays > 0 ? elapsedDays / totalDays : 1;

          const invested = inv.investedAmount || 0;
          const currentAtLast = inv.currentValue || 0;
          const current = invested + ratio * (currentAtLast - invested);

          totalInvested += invested;
          totalCurrent += current;
        }
      });

      return {
        date: new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        'Invested Value': Math.round(totalInvested),
        'Current Value': Math.round(totalCurrent),
        'Profit / Loss': Math.round(totalCurrent - totalInvested),
      };
    });
  };

  const getAssetBadgeConfig = (type: string) => {
    const lower = (type || '').toLowerCase();
    if (lower.includes('mutual')) {
      return { icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', badge: 'Mutual Fund' };
    } else if (lower.includes('stock') || lower.includes('equity')) {
      return { icon: LineChart, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', badge: 'Stocks' };
    } else if (lower.includes('gold') || lower.includes('sgb')) {
      return { icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', badge: 'Gold' };
    } else if (lower.includes('fd') || lower.includes('rd') || lower.includes('ppf') || lower.includes('nps')) {
      return { icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', badge: type };
    } else if (lower.includes('chit')) {
      return { icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', badge: 'Chit Fund' };
    }
    return { icon: PiggyBank, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', badge: type || 'Asset' };
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Portfolio KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PiggyBank size={96} />
          </div>
          <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider block mb-1">
            Total Portfolio Value
          </span>
          <div className="text-2xl font-black tracking-tight mb-1">
            ₹{portfolioSummary.totalCurrent.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              portfolioSummary.overallReturnPct >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {portfolioSummary.overallReturnPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {portfolioSummary.overallReturnPct >= 0 ? '+' : ''}{portfolioSummary.overallReturnPct.toFixed(2)}%
            </span>
            <span className="text-indigo-200/80">Overall Return</span>
          </div>
        </div>

        {/* Total Capital Invested */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Capital Invested</span>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-600">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800">
            ₹{portfolioSummary.totalInvested.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400">
            Principal across <strong className="text-slate-700 font-semibold">{portfolioSummary.totalAssetsCount}</strong> assets
          </p>
        </div>

        {/* Total Net Profit / Loss */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Gain (P&L)</span>
            <div className={`p-2 rounded-xl ${portfolioSummary.totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {portfolioSummary.totalProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </div>
          </div>
          <div className={`text-xl font-bold ${portfolioSummary.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {portfolioSummary.totalProfit >= 0 ? '+' : ''}₹{portfolioSummary.totalProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400">
            Unrealized market profit
          </p>
        </div>

        {/* Monthly SIP Outflow */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly SIP Flow</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800">
            ₹{portfolioSummary.totalMonthlySip.toLocaleString('en-IN')}
            <span className="text-xs text-slate-400 font-normal">/mo</span>
          </div>
          <p className="text-xs text-slate-400">
            <strong className="text-indigo-600 font-semibold">{portfolioSummary.activeSipCount}</strong> active recurring SIPs
          </p>
        </div>
      </div>

      {/* Primary Toolbar: Actions + Search + Sort */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                  }`}
                >
                  <TabIcon size={14} className={isActive ? 'text-indigo-300' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <input 
              type="file" 
              id="cas-file-input"
              accept=".pdf,.csv" 
              className="hidden" 
              onChange={handleCASImportFile} 
            />
            <button
              onClick={() => document.getElementById('cas-file-input')?.click()}
              disabled={isParsingCas}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs px-3 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Import Mutual Funds from CAS statement PDF"
            >
              <Upload className={`h-3.5 w-3.5 text-indigo-600 ${isParsingCas ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isParsingCas ? 'Parsing...' : 'CAS Import'}</span>
            </button>

            <button
              onClick={fetchLivePrices}
              disabled={isSyncing}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-xs px-3 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Sync live market prices for Mutual Funds & Stocks"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
            </button>

            <button
              onClick={() => {
                if (showAddForm) resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              id="btn-add-investment"
            >
              <Plus className="h-4 w-4" /> Log Investment
            </button>
          </div>
        </div>

        {/* Secondary Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by fund, broker, scheme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-semibold text-slate-400 flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="value">Highest Portfolio Value</option>
              <option value="returns">Highest Returns (%)</option>
              <option value="sip">Highest Monthly SIP</option>
              <option value="name">Asset Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add / Edit Investment Structured Form */}
      {showAddForm && (
        <form onSubmit={handleAddInvestment} className="bg-white p-6 border border-indigo-100 rounded-2xl shadow-md space-y-5 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="text-indigo-600 h-5 w-5" /> 
              {editingInvestmentId ? 'Edit Investment Asset' : 'Add New Investment Asset'}
            </h3>
            <span className="text-xs text-slate-400">Fill details to log capital or live market tracking</span>
          </div>

          {/* Section 1: Asset Basics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">1. Asset Classification & Platform</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Asset Category</label>
                <select
                  value={investmentType}
                  onChange={(e) => setInvestmentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  {INVESTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fund / Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder={investmentType === 'Stocks' ? 'e.g. Reliance Industries, TCS' : 'e.g. Parag Parikh Flexi Cap Fund'}
                  value={investmentName}
                  onChange={(e) => {
                    setInvestmentName(e.target.value);
                    if (isLiveTracked) {
                      if (investmentType === 'Mutual Fund') {
                        setSchemeCode('');
                        searchMf(e.target.value);
                      } else if (investmentType === 'Stocks') {
                        setTickerSymbol('');
                        searchStock(e.target.value);
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                {isSearchingMf && investmentType === 'Mutual Fund' && <div className="text-[11px] text-slate-400 mt-1">Searching Scheme Codes...</div>}
                {isSearchingStock && investmentType === 'Stocks' && <div className="text-[11px] text-slate-400 mt-1">Searching Stock Tickers...</div>}
                
                {mfSearchResults.length > 0 && isLiveTracked && investmentType === 'Mutual Fund' && !schemeCode && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {mfSearchResults.map((res: any) => (
                      <div 
                        key={res.schemeCode}
                        onClick={() => {
                          setSchemeCode(res.schemeCode.toString());
                          setInvestmentName(res.schemeName);
                          setMfSearchResults([]);
                        }}
                        className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        {res.schemeName}
                      </div>
                    ))}
                  </div>
                )}

                {stockSearchResults.length > 0 && isLiveTracked && investmentType === 'Stocks' && !tickerSymbol && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {stockSearchResults.map((res: any) => (
                      <div 
                        key={res.symbol}
                        onClick={() => {
                          setTickerSymbol(res.symbol);
                          setInvestmentName(`${res.longname || res.shortname || res.symbol}`);
                          setStockSearchResults([]);
                        }}
                        className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center"
                      >
                        <span className="truncate">{res.longname || res.shortname || res.symbol}</span>
                        <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm text-[10px] ml-2 shrink-0">{res.symbol}</span>
                      </div>
                    ))}
                  </div>
                )}

                {schemeCode && isLiveTracked && investmentType === 'Mutual Fund' && <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Matched Scheme Code: {schemeCode}</div>}
                {tickerSymbol && isLiveTracked && investmentType === 'Stocks' && <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Matched Ticker: {tickerSymbol}</div>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Broker / Platform</label>
                <input
                  type="text"
                  placeholder="e.g. Zerodha Coin, Groww, INDmoney"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Capital & Live Tracking */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">2. Deployed Capital & Live Market Sync</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total Invested Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {!isLiveTracked && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Valuation (₹) *</label>
                  <input
                    type="number"
                    required={!isLiveTracked}
                    placeholder="e.g. 185000"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Investment Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Live Tracking Checkbox */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isLiveTracked"
                  checked={isLiveTracked} 
                  onChange={(e) => setIsLiveTracked(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isLiveTracked" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  Enable Live Market Price Tracking?
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold uppercase">Auto NAV</span>
                </label>
              </div>
              
              {isLiveTracked && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-indigo-200 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Units / Shares *</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="e.g. 1450.25"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-slate-50 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center italic">
                    Type your Mutual Fund or Stock name above to bind scheme code or ticker symbol automatically.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: SIP & Auto-Pay */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">3. SIP Contribution & Auto-Debit Rules</h4>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isRecurringSip"
                  checked={isRecurringSip} 
                  onChange={(e) => setIsRecurringSip(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isRecurringSip" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Is this a Monthly Recurring SIP / Deposit?
                </label>
              </div>
              
              {isRecurringSip && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-indigo-200 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly SIP Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-slate-50 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">SIP Date of Month (1-28)</label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      placeholder="e.g. 5"
                      value={sipDate}
                      onChange={(e) => setSipDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-slate-50 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-200 col-span-full">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="autoPay"
                        checked={autoPay}
                        onChange={(e) => setAutoPay(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <label htmlFor="autoPay" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Enable Auto Pay (Auto-deduct balance on SIP Date)
                      </label>
                    </div>

                    {autoPay && (
                      <div className="mt-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Select Source Bank Account or Credit Card</label>
                        <select
                          value={autoPaySourceId}
                          onChange={(e) => setAutoPaySourceId(e.target.value)}
                          required={autoPay}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">-- Choose Payment Source --</option>
                          {banks && banks.length > 0 && (
                            <optgroup label="Bank Accounts">
                              {banks.map(b => (
                                <option key={b.id} value={b.id}>{b.bankName} (₹{b.currentBalance.toLocaleString('en-IN')})</option>
                              ))}
                            </optgroup>
                          )}
                          {cards && cards.length > 0 && (
                            <optgroup label="Credit Cards">
                              {cards.filter(c => c.cardType === 'Credit').map(c => (
                                <option key={c.id} value={c.id}>{c.cardName}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Financial Target</label>
            <input
              type="text"
              placeholder="e.g. Dedicated for daughter's higher education in 2035"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {editingInvestmentId ? 'Update Investment' : 'Save Investment Asset'}
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Performance Area Chart */}
      {investments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <LineChart className="h-4 w-4 text-indigo-600" />
                Portfolio Growth & Net Worth Growth
              </h3>
              <p className="text-xs text-slate-400">Cumulative trend comparing total invested principal against current market valuation</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <span className="text-slate-600">Invested Capital</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span className="text-emerald-600 font-bold">Current Valuation</span>
              </div>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                  }}
                  labelStyle={{ fontWeight: 700, color: '#1e293b', fontSize: '11px', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="Invested Value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                />
                <Area
                  type="monotone"
                  dataKey="Current Value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filtered Investment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInvestments.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-10 text-center space-y-2">
            <PiggyBank className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No investment assets found</h4>
            <p className="text-xs text-slate-400">
              {searchQuery ? 'No investments match your search query.' : 'Log mutual funds, stocks, or gold to track wealth growth.'}
            </p>
          </div>
        ) : (
          filteredInvestments.map((inv) => {
            const profit = inv.currentValue - inv.investedAmount;
            const returns = inv.investedAmount > 0 ? (profit / inv.investedAmount) * 100 : 0;
            const isPositive = profit >= 0;
            const badgeConfig = getAssetBadgeConfig(inv.investmentType);
            const BadgeIcon = badgeConfig.icon;

            return (
              <div 
                key={inv.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-200 transition-all duration-200 relative group"
              >
                {/* Header: Badge & Asset Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${badgeConfig.bg} ${badgeConfig.color} border flex items-center justify-center shrink-0`}>
                        <BadgeIcon size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {badgeConfig.badge}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 block">
                          {inv.platform || 'Direct'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {inv.isLiveTracked && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Live
                        </span>
                      )}
                      
                      <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isPositive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                      }`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{isPositive ? '+' : ''}{returns.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug break-words" title={inv.investmentName}>
                      {inv.investmentName}
                    </h3>
                  </div>
                </div>

                {/* Numbers Box */}
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-0.5">Invested</span>
                      <span className="text-xs font-bold text-slate-700 font-mono">₹{inv.investedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-l border-slate-200/60 pl-2.5">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-0.5">Current Value</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">₹{inv.currentValue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Profit & XIRR Row */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Net Profit / Loss:</span>
                    <span className={`font-bold font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}₹{profit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {xirrValues[inv.id] !== undefined && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Annualized XIRR Return:</span>
                      <span className="font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-mono">
                        {xirrValues[inv.id].toFixed(2)}%
                      </span>
                    </div>
                  )}

                  {inv.isLiveTracked && inv.units && inv.units > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">Units / Holdings:</span>
                        <span className="font-semibold text-slate-700 font-mono">{inv.units.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Live Price / Unit:</span>
                        <span className="font-semibold text-emerald-600 font-mono">₹{(inv.currentValue / inv.units).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {inv.isRecurringSip && inv.monthlyContribution > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/60 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Zap size={10} className="text-indigo-600" /> SIP ({inv.sipDate ? `Day ${inv.sipDate}` : 'Monthly'}):
                      </span>
                      <span className="font-bold text-indigo-600 font-mono">₹{inv.monthlyContribution.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {inv.notes && (
                  <p className="text-[10px] text-slate-400 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100 truncate" title={inv.notes}>
                    Notes: {inv.notes}
                  </p>
                )}

                {/* Footer Action Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {inv.monthlyContribution > 0 ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                      <select
                        value={paySourceIds[inv.id] || ''}
                        onChange={e => setPaySourceIds(prev => ({ ...prev, [inv.id]: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 outline-hidden focus:ring-1 focus:ring-indigo-500 flex-1 min-w-0 truncate"
                      >
                        <option value="">-- Source --</option>
                        {banks && banks.length > 0 && (
                          <optgroup label="Banks">
                            {banks.map(b => <option key={b.id} value={b.id}>{b.bankName}</option>)}
                          </optgroup>
                        )}
                        {cards && cards.length > 0 && (
                          <optgroup label="Cards">
                            {cards.filter(c => c.cardType === 'Credit').map(c => <option key={c.id} value={c.id}>{c.cardName}</option>)}
                          </optgroup>
                        )}
                      </select>
                      <button
                        onClick={() => handleRecordSIP(inv)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                        title="Record manual SIP payment installment"
                      >
                        <Plus size={10} /> SIP
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">One-time Capital</span>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => handleUpdateCurrentValue(inv)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      title="Update Market Valuation"
                    >
                      <RefreshCw size={14} />
                    </button>

                    <button
                      onClick={() => handleEditInvestment(inv)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      title="Edit Investment Details"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteInvestment(inv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Investment Asset"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CAS Ingest Modal */}
      {showCasModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-600" /> Extracted Mutual Funds from Statement
              </h3>
              <p className="text-xs text-slate-500 mt-1">Review the mutual funds extracted from your CAS PDF/CSV statement. Select import to save them to your active assets ledger.</p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {parsedInvestments.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{item.investmentName}</span>
                    <span className="text-slate-400 block mt-0.5">Folio / Platform: {item.platform}</span>
                    <span className="text-indigo-600 font-semibold font-mono block">Units: {item.units}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Invested Value</span>
                    <span className="font-bold text-slate-700 block">₹{item.investedAmount.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mt-1">Market Value</span>
                    <span className="font-bold text-slate-900 block">₹{item.currentValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCasModal(false);
                  setParsedInvestments([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel Import
              </button>
              <button
                onClick={handleSaveCasInvestments}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4 text-white" /> Save Imported Mutual Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
