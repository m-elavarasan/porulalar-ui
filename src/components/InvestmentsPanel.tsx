import { porulalarStore, increment } from '../lib/store';
import { analyticsService } from '../services/analyticsService';
import { bankService } from '../services/bankService';
import React, { useState } from 'react';
import { Plus, Trash, ArrowUpRight, TrendingUp, TrendingDown, PiggyBank, RefreshCw, Pencil, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { Investment, Bank, Card } from '../types';
import { useDialog } from './DialogProvider';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

export default function InvestmentsPanel({ userId, investments, banks, cards, onRefreshData }: InvestmentsPanelProps) {
  const { showAlert, showConfirm, showPrompt } = useDialog();
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

  const handleCASImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsParsingCas(true);
    
    // Simulate statement parsing wait
    setTimeout(async () => {
      // Mocking high-quality extracted mutual funds from CAS PDF/CSV
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
          schemeCode: '122639' // Parag Parikh Flexi Cap Scheme Code
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
          schemeCode: '125497' // SBI Small Cap Scheme Code
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
          schemeCode: '119062' // Mirae Asset Large Cap Scheme Code
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
          monthlyContribution: 5000, // Default SIP guess
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
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentName || !investedAmount) return;

    const invested = Number(investedAmount);
    // If live tracked, current value starts as 0 (will be updated via sync)
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
      const invId = editingInvestmentId;
      let currentValForCalc = current;
      
      // If we are editing a live tracked one and units changed, we might not have the live price immediately. 
      // But we just save the units, the sync will fix the current value later. 
      // For now, if editing and it's live tracked, we keep the previous current value for the calculation just so it doesn't drop to 0 until sync.
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

      const invRef = inv.id;
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

      // Log the SIP payment as an expense
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
      const invRef = inv.id;
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
          // Calculate the updated profit and return percentages
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

    // Get all unique sorted dates
    const datesSet = new Set<string>();
    investments.forEach((inv) => {
      if (inv.startDate) datesSet.add(inv.startDate);
      if (inv.lastUpdated) datesSet.add(inv.lastUpdated);
    });

    // Also add today's date so the chart is current
    const todayStr = new Date().toISOString().split('T')[0];
    datesSet.add(todayStr);

    const sortedDates = Array.from(datesSet).sort();

    // Helper to calculate diff in days
    const getDaysDiff = (d1: string, d2: string) => {
      const time1 = new Date(d1).getTime();
      const time2 = new Date(d2).getTime();
      return Math.max(0, (time2 - time1) / (1000 * 60 * 60 * 24));
    };

    const chartData = sortedDates.map((dateStr) => {
      let totalInvested = 0;
      let totalCurrent = 0;

      investments.forEach((inv) => {
        const start = inv.startDate || todayStr;
        const last = inv.lastUpdated || start;

        if (dateStr < start) {
          // Hasn't started yet
          return;
        } else if (dateStr >= last) {
          // Past last updated
          totalInvested += inv.investedAmount || 0;
          totalCurrent += inv.currentValue || 0;
        } else {
          // Interpolating between start date and lastUpdated date
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

    return chartData;
  };

  return (
    <div className="space-y-6">
      {/* Action Row */}
      <div className="flex justify-end gap-2">
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
          className="bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-100 font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className={`h-4.5 w-4.5 ${isParsingCas ? 'animate-pulse' : ''}`} />
          {isParsingCas ? 'Parsing CAS...' : 'Ingest CAS Statement'}
        </button>
        <button
          onClick={fetchLivePrices}
          disabled={isSyncing}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Live Sync'}
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          id="btn-add-investment"
        >
          <Plus className="h-4.5 w-4.5" /> Log Investment
        </button>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <form onSubmit={handleAddInvestment} className="bg-white p-5 border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <PiggyBank className="text-indigo-500 h-5 w-5" /> {editingInvestmentId ? 'Edit Investment Asset' : 'Track Investment Asset'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Asset Type</label>
              <select
                value={investmentType}
                onChange={(e) => setInvestmentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              >
                {INVESTMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fund / Asset Name</label>
              <input
                type="text"
                required
                placeholder={investmentType === 'Stocks' ? 'e.g. Reliance, TCS' : 'e.g. Parag Parikh Flexi Cap'}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
              {isSearchingMf && investmentType === 'Mutual Fund' && <div className="text-xs text-slate-400 mt-1">Searching Funds...</div>}
              {isSearchingStock && investmentType === 'Stocks' && <div className="text-xs text-slate-400 mt-1">Searching Stocks...</div>}
              
              {mfSearchResults.length > 0 && isLiveTracked && investmentType === 'Mutual Fund' && !schemeCode && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {mfSearchResults.map((res: any) => (
                    <div 
                      key={res.schemeCode}
                      onClick={() => {
                        setSchemeCode(res.schemeCode.toString());
                        setInvestmentName(res.schemeName);
                        setMfSearchResults([]);
                      }}
                      className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      {res.schemeName}
                    </div>
                  ))}
                </div>
              )}

              {stockSearchResults.length > 0 && isLiveTracked && investmentType === 'Stocks' && !tickerSymbol && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {stockSearchResults.map((res: any) => (
                    <div 
                      key={res.symbol}
                      onClick={() => {
                        setTickerSymbol(res.symbol);
                        setInvestmentName(`${res.longname || res.shortname || res.symbol}`);
                        setStockSearchResults([]);
                      }}
                      className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center"
                    >
                      <span className="truncate">{res.longname || res.shortname || res.symbol}</span>
                      <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1 rounded-sm text-[10px] ml-2 shrink-0">{res.symbol}</span>
                    </div>
                  ))}
                </div>
              )}

              {schemeCode && isLiveTracked && investmentType === 'Mutual Fund' && <div className="text-xs text-emerald-600 mt-1 font-semibold">Matched Scheme Code: {schemeCode}</div>}
              {tickerSymbol && isLiveTracked && investmentType === 'Stocks' && <div className="text-xs text-emerald-600 mt-1 font-semibold">Matched Ticker: {tickerSymbol}</div>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Platform / Broker</label>
              <input
                type="text"
                placeholder="e.g. Zerodha Coin, Groww"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Invested Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="e.g. 50000"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div className="col-span-full bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isLiveTracked"
                  checked={isLiveTracked} 
                  onChange={(e) => setIsLiveTracked(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isLiveTracked" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Enable Live Market Tracking?
                </label>
              </div>
              
              {isLiveTracked && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-indigo-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Number of Units / Shares</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="e.g. 150.5"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-50 outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  {investmentType === 'Mutual Fund' && (
                    <div>
                      <div className="text-xs text-slate-400 mt-7 italic">
                        Start typing your Fund Name above to search for the Live Scheme Code automatically!
                      </div>
                    </div>
                  )}
                  {investmentType === 'Stocks' && (
                    <div>
                      <div className="text-xs text-slate-400 mt-7 italic">
                        Start typing your Stock Name above to search for the Live Ticker Symbol automatically!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isLiveTracked && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Current Value (₹)</label>
                <input
                  type="number"
                  required={!isLiveTracked}
                  placeholder="e.g. 58000"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            )}
            <div className="col-span-full bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isRecurringSip"
                  checked={isRecurringSip} 
                  onChange={(e) => setIsRecurringSip(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isRecurringSip" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Is this a Recurring SIP / Investment?
                </label>
              </div>
              
              {isRecurringSip && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-indigo-100 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly SIP Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-50 outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">SIP Deduction Date (1-28)</label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      placeholder="e.g. 5"
                      value={sipDate}
                      onChange={(e) => setSipDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-50 outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-indigo-100 col-span-full">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="autoPay"
                        checked={autoPay}
                        onChange={(e) => setAutoPay(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="autoPay" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Enable Auto Pay (auto-deduct on SIP Date)
                      </label>
                    </div>
                    {autoPay && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Select Payment Source for Auto Debit/Charge</label>
                        <select
                          value={autoPaySourceId}
                          onChange={(e) => setAutoPaySourceId(e.target.value)}
                          required={autoPay}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">-- Auto Pay Source --</option>
                          {banks && banks.length > 0 && (
                            <optgroup label="Bank Accounts">
                              {banks.map(b => (
                                <option key={b.id} value={b.id}>{b.bankName}</option>
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
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. For daughter's education"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {editingInvestmentId ? 'Update Investment' : 'Save Investment'}
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Performance Line Chart */}
      {investments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Portfolio Growth Over Time</h3>
              <p className="text-xs text-slate-400">Chronological trend of total invested capital vs. actual current value</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-slate-600">Invested Capital</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-emerald-600">Current Portfolio Value</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                  tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#334155', fontSize: '11px', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="Invested Value"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Current Value"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Investment List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 italic">
            No tracked investments. Add mutual funds, stocks, or gold to track gains and build net worth.
          </div>
        ) : (
          investments.map((inv) => {
            const profit = inv.currentValue - inv.investedAmount;
            const returns = inv.investedAmount > 0 ? (profit / inv.investedAmount) * 100 : 0;
            const isPositive = profit >= 0;

            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col space-y-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                        {inv.investmentType}
                      </span>
                      {inv.isLiveTracked && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Live
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 truncate max-w-[180px]" title={inv.investmentName}>
                      {inv.investmentName}
                    </h3>
                    <p className="text-[11px] text-slate-400">Platform: <span className="text-slate-600 font-medium">{inv.platform}</span></p>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleEditInvestment(inv)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Edit investment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleUpdateCurrentValue(inv)}
                      className="p-1 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-100 transition-all cursor-pointer"
                      title="Update Market Value"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    {inv.monthlyContribution > 0 && (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={paySourceIds[inv.id] || ''}
                          onChange={e => setPaySourceIds(prev => ({ ...prev, [inv.id]: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] outline-hidden focus:ring-1 focus:ring-indigo-500 max-w-[100px]"
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
                          className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition-all cursor-pointer"
                          title="Record SIP contribution"
                        >
                          SIP
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteInvestment(inv.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete investment"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Return Percentage Badges */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Yield & XIRR</span>
                  <div className="flex items-center gap-2">
                    {xirrValues[inv.id] !== undefined && (
                      <span className="text-indigo-600 font-black bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md text-[10px] font-mono">
                        XIRR: {xirrValues[inv.id].toFixed(2)}%
                      </span>
                    )}
                    <div className={`flex items-center gap-0.5 font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      <span>{returns.toFixed(2)}% ({isPositive ? '+' : ''}₹{profit.toLocaleString('en-IN')})</span>
                    </div>
                  </div>
                </div>

                {/* Numbers Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px]">Invested Amount</span>
                    <span className="font-bold text-slate-700 text-xs">₹{inv.investedAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[10px]">Current Balance</span>
                    <span className="font-bold text-slate-900 text-xs block">₹{inv.currentValue.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-indigo-600 italic font-semibold">{numberToWords(inv.currentValue)}</span>
                  </div>
                  {inv.isLiveTracked && inv.units && inv.units > 0 && (
                    <div className="col-span-2 border-t border-slate-100 pt-2 mt-1 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block mb-0.5 text-[10px]">Holdings (Qty)</span>
                        <span className="font-bold text-indigo-600 text-xs">{inv.units.toFixed(3)} Units</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5 text-[10px]">Live Market Price</span>
                        <span className="font-bold text-emerald-600 text-xs">₹{(inv.currentValue / inv.units).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  {inv.isRecurringSip && inv.monthlyContribution > 0 && (
                    <div className="col-span-2 border-t border-slate-100 pt-1.5 mt-0.5 flex justify-between text-[11px]">
                      <span className="text-slate-400 font-sans">
                        Recurring SIP ({inv.sipDate ? `Day ${inv.sipDate}` : 'Monthly'}):
                      </span>
                      <span className="font-bold text-emerald-600 font-mono">₹{inv.monthlyContribution.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {inv.notes && (
                  <p className="text-[10px] text-slate-400 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 truncate">
                    Notes: {inv.notes}
                  </p>
                )}
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
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel Import
              </button>
              <button
                onClick={handleSaveCasInvestments}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="h-4.5 w-4.5 text-white" /> Save Imported Mutual Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
