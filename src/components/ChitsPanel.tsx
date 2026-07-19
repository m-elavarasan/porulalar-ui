import { porulalarStore, increment } from '../lib/store';
import React, { useState, useEffect, useMemo } from 'react';
import { Landmark, TrendingUp, Calendar, AlertCircle, Plus, CheckCircle2, History, X, Trash, FileText, CalendarPlus, Pencil, Gift, HelpCircle, Sparkles, BarChart2 } from 'lucide-react';
import { numberToWords } from '../lib/utils';
import { Chit, Bank, Card } from '../types';
import { createCalendarReminder } from '../lib/googleServices';
import { useDialog } from './DialogProvider';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChitsPanelProps {
  userId: string;
  chits: Chit[];
  banks?: Bank[];
  cards?: Card[];
  accessToken: string | null;
  onRefreshData: () => void;
}

export default function ChitsPanel({ userId, chits, banks, cards, accessToken, onRefreshData }: ChitsPanelProps) {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };
  const [chitName, setChitName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [processingFee, setProcessingFee] = useState<number>(0);
  const [totalChitValue, setTotalChitValue] = useState('');
  const [numberOfMembers, setNumberOfMembers] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalTenureMonths, setTotalTenureMonths] = useState('');
  const [gapMonths, setGapMonths] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [initialInstallments, setInitialInstallments] = useState('0');
  const [initialAmount, setInitialAmount] = useState('0');
  const [editingChitId, setEditingChitId] = useState<string | null>(null);
  const [autoPay, setAutoPay] = useState(false);
  const [autoPaySourceId, setAutoPaySourceId] = useState('');
  const [paySourceIds, setPaySourceIds] = useState<{ [id: string]: string }>({});
  const [commissionPct, setCommissionPct] = useState('5');

  // Chit YTM Calculator states
  const [activeTab, setActiveTab] = useState<'chits' | 'calculator'>('chits');
  const [calcChitValue, setCalcChitValue] = useState(500000);
  const [calcMembers, setCalcMembers] = useState(20);
  const [calcBidDiscount, setCalcBidDiscount] = useState(150000);
  const [calcCommissionPct, setCalcCommissionPct] = useState(5);
  const [calcPrizeMonth, setCalcPrizeMonth] = useState(5);

  const calculateChitYTM = () => {
    const commission = calcChitValue * (calcCommissionPct / 100);
    const dividendPool = calcBidDiscount - commission;
    const dividendPerMember = dividendPool / calcMembers;
    const netPayment = (calcChitValue / calcMembers) - dividendPerMember;
    const prizeMoney = calcChitValue - calcBidDiscount;

    // Solver for IRR
    const cashflows: number[] = [];
    for (let t = 1; t <= calcMembers; t++) {
      if (t === calcPrizeMonth) {
        cashflows.push(prizeMoney - netPayment);
      } else {
        cashflows.push(-netPayment);
      }
    }

    let low = -0.99;
    let high = 2.0;
    let irr = 0;
    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      let npv = 0;
      for (let t = 0; t < cashflows.length; t++) {
        npv += cashflows[t] / Math.pow(1 + mid, t + 1);
      }
      if (Math.abs(npv) < 1e-4) {
        irr = mid;
        break;
      }
      if (npv > 0) {
        low = mid;
      } else {
        high = mid;
      }
    }
    const annualizedYTM = (Math.pow(1 + irr, 12) - 1) * 100;
    return {
      commission,
      dividendPool,
      dividendPerMember,
      netPayment,
      prizeMoney,
      annualizedYTM: isNaN(annualizedYTM) ? 0 : annualizedYTM
    };
  };

  const [isShared, setIsShared] = useState(false);
  const [sharePartnerName, setSharePartnerName] = useState('');
  const [mySharePercentage, setMySharePercentage] = useState('50');

  const resetForm = () => {
    setChitName('');
    setOrganizer('');
    setProcessingFee(0);
    setTotalChitValue('');
    setNumberOfMembers('');
    setMonthlyContribution('');
    setTotalTenureMonths('');
    setGapMonths('');
    setStartDate('');
    setNextDueDate('');
    setNotes('');
    setInitialInstallments('0');
    setInitialAmount('0');
    setIsShared(false);
    setSharePartnerName('');
    setMySharePercentage('50');
    setAutoPay(false);
    setAutoPaySourceId('');
    setEditingChitId(null);
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingStates, setSyncingStates] = useState<{ [id: string]: boolean }>({});

  // Transaction history and inline logging states
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeLogFormChitId, setActiveLogFormChitId] = useState<string | null>(null);
  const [logAmount, setLogAmount] = useState('');
  const [logType, setLogType] = useState<'Installment Paid' | 'Bonus' | 'Adjustment'>('Installment Paid');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logChitNumber, setLogChitNumber] = useState('');

  // File upload states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const txFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isParsingTx, setIsParsingTx] = useState(false);
  const [viewingPastPaymentsChit, setViewingPastPaymentsChit] = useState<Chit | null>(null);

  // Compute aggregated stats for active trackers
  const statsSummary = React.useMemo(() => {
    let totalValue = 0;
    let totalPaid = 0;
    let totalMonthly = 0;
    let totalYield = 0;

    chits.forEach((chit) => {
      const sharePct = chit.isShared && chit.mySharePercentage ? (chit.mySharePercentage / 100) : 1;
      const displayChitValue = chit.totalChitValue * sharePct;
      const displayMonthly = chit.monthlyContribution * sharePct;

      const chitTxs = transactions.filter(t => t.chitId === chit.id && t.type !== 'Prize Received');
      const txSum = chitTxs.reduce((sum, tx) => sum + Number(tx.amount), 0) * sharePct;
      const scaledAmountPaid = (chit.amountPaidTillDate || 0) * sharePct;
      const totalContributed = txSum > 0 ? txSum : (scaledAmountPaid || (displayMonthly * chit.installmentsPaid));

      const remainingInstallments = Math.max(0, chit.numberOfMembers - chit.installmentsPaid);
      const displayPrizeReceived = (chit.prizeAmountReceived || 0) * sharePct;
      const approxExpectedYield = chit.prizeTaken
        ? displayPrizeReceived - (totalContributed + (displayMonthly * remainingInstallments))
        : displayChitValue - (totalContributed + (displayMonthly * remainingInstallments));

      if (chit.status === 'Active') {
        totalValue += displayChitValue;
        totalPaid += totalContributed;
        totalMonthly += displayMonthly;
        totalYield += approxExpectedYield;
      }
    });

    return { totalValue, totalPaid, totalMonthly, totalYield };
  }, [chits, transactions]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const { parseChitPDF, parseChitCSV } = await import('../lib/localParser');
      let parsedData;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        parsedData = await parseChitPDF(file);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        parsedData = await parseChitCSV(file);
      } else {
        await showAlert('Unsupported file format.', 'Error', 'error');
        return;
      }

      if (Object.keys(parsedData).length === 0) {
        await showAlert('Could not find recognizable chit details.', 'Parsing Failed', 'warning');
      } else {
        if (parsedData.totalChitValue) handleChitValueChange(parsedData.totalChitValue);
        if (parsedData.monthlyContribution) setMonthlyContribution(parsedData.monthlyContribution);
        if (parsedData.totalTenureMonths) setTotalTenureMonths(parsedData.totalTenureMonths);
        if (parsedData.organizer) setOrganizer(parsedData.organizer);
        if (parsedData.chitName) setChitName(parsedData.chitName);
        await showAlert('Form auto-filled with extracted details!', 'Parsing Complete', 'info');
      }
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to parse statement: ' + err.message, 'Error', 'error');
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingPastPaymentsChit) return;

    setIsParsingTx(true);
    try {
      const { parseTransactionsPDF, parseTransactionsCSV } = await import('../lib/localParser');
      let txs;
      if (file.name.toLowerCase().endsWith('.pdf')) {
        txs = await parseTransactionsPDF(file);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        txs = await parseTransactionsCSV(file);
      } else {
        await showAlert('Unsupported file format.', 'Error', 'error');
        return;
      }
      
      if (txs.length === 0) {
        await showAlert('No valid transactions found in the statement.', 'Parsing Failed', 'warning');
      } else {
        const sum = txs.reduce((acc, curr) => acc + curr.amount, 0);
        const confirmed = await showConfirm(`Found ${txs.length} past payments summing up to ₹${sum.toLocaleString('en-IN')}. Upload them as Installments?`);
        if (confirmed) {
          for (const tx of txs) {
            await porulalarStore.addRecord('chitTransactions', {
              userId,
              chitId: viewingPastPaymentsChit.id,
              transactionDate: tx.date,
              amount: tx.amount,
              type: 'Installment Paid',
            });
            const sharePct = viewingPastPaymentsChit.isShared && viewingPastPaymentsChit.mySharePercentage ? (viewingPastPaymentsChit.mySharePercentage / 100) : 1;
            await porulalarStore.addRecord('expenses', {
              userId,
              date: tx.date,
              category: 'Chit',
              subCategory: viewingPastPaymentsChit.chitName,
              amount: tx.amount * sharePct,
              paymentMethod: 'Bank Transfer',
              description: `Uploaded Tx: ${tx.description}`,
              tags: ['Chit'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          await showAlert('Successfully imported past payments.', 'Success', 'success');
          // Update parent state
          let advancedDueDate = viewingPastPaymentsChit.nextDueDate;
          if (advancedDueDate) {
            const d = new Date(advancedDueDate);
            d.setMonth(d.getMonth() + txs.length);
            advancedDueDate = d.toISOString().split('T')[0];
          }
          const chitRef = viewingPastPaymentsChit.id;
          await porulalarStore.updateRecord('chits', chitRef, {
            amountPaidTillDate: (viewingPastPaymentsChit.amountPaidTillDate || 0) + sum,
            installmentsPaid: (viewingPastPaymentsChit.installmentsPaid || 0) + txs.length,
            installmentsRemaining: Math.max(0, (viewingPastPaymentsChit.installmentsRemaining || 1) - txs.length),
            ...(advancedDueDate ? { nextDueDate: advancedDueDate } : {})
          });
          onRefreshData();
          
          // Re-fetch transactions
          const txList = await porulalarStore.fetchCollection('chitTransactions');
          setTransactions(txList);
        }
      }
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to parse statement: ' + err.message, 'Error', 'error');
    } finally {
      setIsParsingTx(false);
      if (txFileInputRef.current) txFileInputRef.current.value = '';
    }
  };

  // Fetch transactions on refresh or mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const txList = await porulalarStore.fetchCollection('chitTransactions');
        setTransactions(txList);
      } catch (err) {
        console.error('Error fetching chit transactions:', err);
      }
    };
    fetchTransactions();
  }, [chits]);

  // Auto-calculate monthly contribution based on: totalChitValue / numberOfMembers
  const handleChitValueChange = (val: string) => {
    setTotalChitValue(val);
    const total = Number(val);
    const members = Number(numberOfMembers) || 20;
    if (total > 0 && members > 0) {
      setMonthlyContribution(Math.round(total / members).toString());
    }
  };

  const handleMembersChange = (val: string) => {
    setNumberOfMembers(val);
    const members = Number(val);
    const total = Number(totalChitValue);
    if (total > 0 && members > 0) {
      setMonthlyContribution(Math.round(total / members).toString());
    }
    if (members > 0) {
      setTotalTenureMonths((members * Number(gapMonths || 1)).toString());
    }
  };

  const handleGapChange = (val: string) => {
    setGapMonths(val);
    const gap = Number(val) || 1;
    const members = Number(numberOfMembers);
    if (members > 0) {
      setTotalTenureMonths((members * gap).toString());
    }
  };

  const handleAddChit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chitName || !totalChitValue || !monthlyContribution || !totalTenureMonths || !numberOfMembers || !startDate) return;

    try {
      const nowStr = new Date().toISOString();
      const tChitVal = Number(totalChitValue);
      const mContrib = Number(monthlyContribution);
      const tTenure = Number(totalTenureMonths);
      const iInst = Number(initialInstallments) || 0;
      const iAmt = Number(initialAmount) || 0;

      if (isNaN(tChitVal) || tChitVal <= 0 || isNaN(mContrib) || mContrib <= 0 || isNaN(tTenure) || tTenure <= 0) {
        await showAlert('Please enter valid positive numbers for chit value, contribution, and tenure.', 'Validation Error', 'error');
        return;
      }
      if (isNaN(iInst) || iInst < 0 || isNaN(iAmt) || iAmt < 0) {
        await showAlert('Please enter valid positive numbers for initial amounts.', 'Validation Error', 'error');
        return;
      }

      const existingChit = editingChitId ? chits.find(c => c.id === editingChitId) : null;
      
      const chitData = {
        userId,
        chitName,
        organizer: organizer || 'Self-Organized',
        totalChitValue: tChitVal,
        numberOfMembers: Number(numberOfMembers) || 20,
        isShared,
        sharePartnerName: isShared ? sharePartnerName : '',
        mySharePercentage: isShared ? (Number(mySharePercentage) || 50) : 100,
        monthlyContribution: mContrib,
        totalTenureMonths: tTenure,
        startDate,
        endDate: new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + tTenure)).toISOString().split('T')[0],
        amountPaidTillDate: iAmt,
        installmentsPaid: iInst,
        installmentsRemaining: Math.max(0, (Number(numberOfMembers) || 20) - iInst),
        prizeTaken: existingChit ? existingChit.prizeTaken : false,
        prizeAmountReceived: existingChit ? existingChit.prizeAmountReceived : 0,
        prizeTakenMonth: existingChit ? existingChit.prizeTakenMonth : 0,
        discountReceived: existingChit ? existingChit.discountReceived : 0,
        expectedProfit: existingChit ? existingChit.expectedProfit : 0, // We will compute projected yield on the fly
        nextDueDate: nextDueDate || new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1 + iInst)).toISOString().split('T')[0],
        status: existingChit ? existingChit.status : 'Active',
        autoPay,
        autoPaySourceId,
        notes: notes || '',
        updatedAt: nowStr,
      };

      let chitId = editingChitId;
      if (editingChitId) {
        await porulalarStore.updateRecord('chits', editingChitId, chitData);
        await showAlert('Chit updated successfully!', 'Success', 'success');
      } else {
        const chitRef = await porulalarStore.addRecord('chits', { ...chitData, createdAt: nowStr });
        chitId = chitRef.id;
      }

      // If initial amount was paid AND it's a new chit, log that transaction!
      if (!editingChitId && iAmt > 0 && chitId) {
        await porulalarStore.addRecord('chitTransactions', {
          userId,
          chitId: chitId,
          transactionDate: startDate,
          amount: iAmt,
          type: 'Installment Paid',
        });
      }

      // Clear Form
      resetForm();
      setShowAddForm(false);
      onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert('Failed to save chit: ' + err.message, 'Save Error', 'error');
    }
  };

  const handleDeleteChit = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this chit fund?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('chits', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (chit: Chit) => {
    setEditingChitId(chit.id);
    setChitName(chit.chitName);
    setOrganizer(chit.organizer || '');
    setTotalChitValue(chit.totalChitValue.toString());
    setNumberOfMembers(chit.numberOfMembers.toString());
    setMonthlyContribution(chit.monthlyContribution.toString());
    setTotalTenureMonths(chit.totalTenureMonths.toString());
    
    // Default to gap=1 if they have normal data, or calculate it if it seems custom.
    const calculatedGap = chit.totalTenureMonths / (chit.numberOfMembers || 1);
    setGapMonths(calculatedGap.toString());
    setStartDate(chit.startDate);
    setNextDueDate(chit.nextDueDate || '');
    setNotes(chit.notes || '');
    setInitialInstallments(chit.installmentsPaid.toString());
    setInitialAmount(chit.amountPaidTillDate?.toString() || '0');
    setIsShared(chit.isShared || false);
    setSharePartnerName(chit.sharePartnerName || '');
    setMySharePercentage(chit.mySharePercentage ? chit.mySharePercentage.toString() : '50');
    setAutoPay(chit.autoPay || false);
    setAutoPaySourceId(chit.autoPaySourceId || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayInstallment = async (chit: Chit) => {
    const defaultAmount = chit.monthlyContribution;
    const amountStr = await showPrompt(`Enter actual installment amount paid for "${chit.chitName}" (Base monthly contribution is ₹${defaultAmount.toLocaleString('en-IN')}, but bid dividend might make it lower):`, 'Log Installment', defaultAmount.toString());
    
    if (amountStr === null) return;
    
    const amountPaid = Number(amountStr);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      await showAlert("Please enter a valid positive number.", 'Validation Error', 'error');
      return;
    }

    try {
      const sourceId = chit.autoPaySourceId || '';
      const bank = banks?.find(b => b.id === sourceId);
      const card = cards?.find(c => c.id === sourceId);
      const chitRef = chit.id;
      const nextPayDate = new Date(new Date(chit.nextDueDate).setMonth(new Date(chit.nextDueDate).getMonth() + 1)).toISOString().split('T')[0];

      const newInstallments = (chit.installmentsPaid || 0) + 1;

      await porulalarStore.updateRecord('chits', chitRef, {
        amountPaidTillDate: (chit.amountPaidTillDate || 0) + amountPaid,
        installmentsPaid: newInstallments,
        installmentsRemaining: Math.max(0, (chit.installmentsRemaining || 1) - 1),
        nextDueDate: nextPayDate,
      });

      const sharePct = chit.isShared && chit.mySharePercentage ? (chit.mySharePercentage / 100) : 1;
      const myExpenseAmount = amountPaid * sharePct;

      // Deduct from bank or card
      if (bank) {
        await porulalarStore.updateRecord('banks', bank.id, { currentBalance: increment(-myExpenseAmount) });
      }
      if (card) {
        await porulalarStore.updateRecord('cards', card.id, { currentOutstanding: increment(myExpenseAmount) });
      }

      await porulalarStore.addRecord('expenses', {
        userId,
        date: new Date().toISOString().split('T')[0],
        category: 'Chit',
        subCategory: chit.chitName,
        amount: myExpenseAmount,
        paymentMethod: bank ? bank.bankName : (card ? card.cardName : 'UPI'),
        description: `Installment ${newInstallments} for ${chit.chitName}`,
        tags: ['Chit'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Log transaction record
      await porulalarStore.addRecord('chitTransactions', {
        chitId: chit.id,
        transactionDate: new Date().toISOString().split('T')[0],
        amount: chit.monthlyContribution,
        type: 'Installment Paid',
      });

      await showAlert(`Installment of ₹${chit.monthlyContribution.toLocaleString('en-IN')} logged!`, 'Installment Logged', 'success');
      onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert("Failed to save installment: " + err.message, 'Save Error', 'error');
    }
  };

  const handleClaimPrize = async (chit: Chit) => {
    const claimStr = await showPrompt(`Enter auction payout amount received for "${chit.chitName}":`, 'Claim Prize');
    if (!claimStr || isNaN(Number(claimStr))) return;
    const claimAmount = Number(claimStr);

    const dateStr = await showPrompt(`Enter date of payout received (YYYY-MM-DD):`, 'Claim Prize Date', new Date().toISOString().split('T')[0]);
    if (!dateStr) return;

    try {
      const chitRef = chit.id;
      const totalExpectedInvested = chit.monthlyContribution * chit.totalTenureMonths;
      const calculatedProfit = Math.max(0, claimAmount - totalExpectedInvested);

      await porulalarStore.updateRecord('chits', chitRef, {
        prizeTaken: true,
        prizeAmountReceived: claimAmount,
        prizeTakenMonth: (chit.installmentsPaid || 1),
        expectedProfit: calculatedProfit,
        prizeTakenDate: dateStr,
      });

      // Record as income
      await porulalarStore.addRecord('income', {
        userId,
        date: dateStr,
        source: 'Chit Received',
        amount: claimAmount,
        description: `Auction prize payout for ${chit.chitName}`,
        recurring: false,
        createdAt: new Date().toISOString(),
      });

      // Log transaction record
      await porulalarStore.addRecord('chitTransactions', {
        userId,
        chitId: chit.id,
        transactionDate: dateStr,
        amount: claimAmount,
        type: 'Prize Received',
      });

      await showAlert(`Congratulations! Prize payout of ₹${claimAmount.toLocaleString('en-IN')} logged as income on ${dateStr}.`, 'Claim Successful', 'success');
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPrize = async (chit: Chit) => {
    const claimStr = await showPrompt(`Edit auction payout amount received for "${chit.chitName}":`, 'Edit Prize Amount', chit.prizeAmountReceived.toString());
    if (claimStr === null) return;
    const claimAmount = Number(claimStr);
    if (isNaN(claimAmount)) return;
    
    const monthStr = await showPrompt(`Edit the month number when payout was claimed for "${chit.chitName}":`, 'Edit Prize Month', chit.prizeTakenMonth.toString());
    if (monthStr === null) return;
    const month = Number(monthStr);
    if (isNaN(month)) return;

    const dateStr = await showPrompt(`Edit date of payout received (YYYY-MM-DD):`, 'Edit Prize Date', chit.prizeTakenDate || new Date().toISOString().split('T')[0]);
    if (dateStr === null) return;

    try {
      const chitRef = chit.id;
      await porulalarStore.updateRecord('chits', chitRef, {
        prizeAmountReceived: claimAmount,
        prizeTakenMonth: month,
        prizeTakenDate: dateStr,
      });
      await showAlert(`Prize details updated successfully!`, 'Update Successful', 'success');
      onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert("Failed to update prize details: " + err.message, 'Save Error', 'error');
    }
  };

  const handleLogCustomTx = async (chit: Chit) => {
    if (!logAmount || isNaN(Number(logAmount))) {
      await showAlert("Please enter a valid amount.", 'Validation Error', 'error');
      return;
    }
    const amountVal = Number(logAmount);
    try {
      const logBankId = paySourceIds[chit.id] || chit.autoPaySourceId || '';
      await porulalarStore.addRecord('chitTransactions', {
        userId,
        chitId: chit.id,
        transactionDate: logDate,
        amount: amountVal,
        type: logType,
        chitNumber: logChitNumber ? Number(logChitNumber) : null,
      });

      const chitRef = chit.id;
      const isInstallment = logType === 'Installment Paid';
      let nextPayDate = chit.nextDueDate;
      if (isInstallment && chit.nextDueDate) {
        const d = new Date(chit.nextDueDate);
        d.setMonth(d.getMonth() + 1);
        nextPayDate = d.toISOString().split('T')[0];
      }
      
      await porulalarStore.updateRecord('chits', chitRef, {
        amountPaidTillDate: (chit.amountPaidTillDate || 0) + amountVal,
        ...(isInstallment ? {
          installmentsPaid: (chit.installmentsPaid || 0) + 1,
          installmentsRemaining: Math.max(0, (chit.installmentsRemaining || 1) - 1),
          nextDueDate: nextPayDate,
        } : {}),
      });

      // Optional: Log Expense / Income
      const sharePct = chit.isShared && chit.mySharePercentage ? (chit.mySharePercentage / 100) : 1;
      const myTxAmount = amountVal * sharePct;

      if (logType === 'Installment Paid') {
        const bank = banks?.find(b => b.id === logBankId);
        const card = cards?.find(c => c.id === logBankId);
        if (bank) {
          await porulalarStore.updateRecord('banks', bank.id, { currentBalance: increment(-myTxAmount) });
        }
        if (card) {
          await porulalarStore.updateRecord('cards', card.id, { currentOutstanding: increment(myTxAmount) });
        }

        await porulalarStore.addRecord('expenses', {
          userId,
          date: logDate,
          category: 'Chit',
          subCategory: chit.chitName,
          amount: myTxAmount,
          paymentMethod: bank ? bank.bankName : (card ? card.cardName : 'UPI'),
          description: `Custom ${logType} for ${chit.chitName}`,
          tags: ['Chit'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (logType === 'Prize Received') {
        const bank = banks?.find(b => b.id === logBankId);
        if (bank) {
          await porulalarStore.updateRecord('banks', bank.id, { currentBalance: increment(myTxAmount) });
        }
        
        await porulalarStore.addRecord('income', {
          userId,
          date: logDate,
          source: `Chit Prize: ${chit.chitName}`,
          amount: myTxAmount,
          description: `Prize received for ${chit.chitName}`,
          recurring: false,
          linkedBankId: logBankId || '',
          createdAt: new Date().toISOString(),
        });
      }

      setLogAmount('');
      setActiveLogFormChitId(null);
      await showAlert("Transaction logged successfully!", 'Success', 'success');
      onRefreshData();
    } catch (err: any) {
      console.error("Error logging custom transaction:", err);
      await showAlert("Failed to save transaction: " + err.message, 'Save Error', 'error');
    }
  };

  const handleDeleteTransaction = async (tx: any, chit: Chit) => {
    const confirmed = await showConfirm('Are you sure you want to delete this transaction record?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('chitTransactions', tx.id);
      
      // If it was an installment or log amount, revert the chit stats
      if (tx.type !== 'Prize Received') {
        const chitRef = chit.id;
        const isInstallment = tx.type === 'Installment Paid';
        await porulalarStore.updateRecord('chits', chitRef, {
          amountPaidTillDate: Math.max(0, (chit.amountPaidTillDate || 0) - tx.amount),
          ...(isInstallment ? {
            installmentsPaid: Math.max(0, (chit.installmentsPaid || 0) - 1),
          } : {}),
        });

        // Delete the corresponding expense record
        const allExp = await porulalarStore.fetchCollection('expenses');
        const expDocs = allExp.filter(d => 
          d.date === tx.transactionDate &&
          d.category === 'Chit' &&
          d.subCategory === chit.chitName &&
          d.amount === tx.amount
        );
        const deletePromises = expDocs.map(d => porulalarStore.deleteRecord('expenses', d.id));
        await Promise.all(deletePromises);

        onRefreshData();
      } else {
        // Revert prize received
        const chitRef = chit.id;
        await porulalarStore.updateRecord('chits', chitRef, {
          prizeTaken: false,
          prizeAmountReceived: 0,
          prizeTakenMonth: 0,
          expectedProfit: Math.max(0, chit.totalChitValue - (chit.monthlyContribution * chit.totalTenureMonths)),
        });

        // Delete the corresponding income record
        const allInc = await porulalarStore.fetchCollection('income');
        const incDocs = allInc.filter(d => 
          d.date === tx.transactionDate &&
          d.source === `Chit Prize: ${chit.chitName}` &&
          d.amount === tx.amount
        );
        const deletePromises = incDocs.map(d => porulalarStore.deleteRecord('income', d.id));
        await Promise.all(deletePromises);

        onRefreshData();
      }

      // Re-fetch transactions
      const txList = await porulalarStore.fetchCollection('chitTransactions');
      setTransactions(txList);
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const handleSyncToCalendar = async (chit: Chit) => {
    if (!accessToken) {
      await showAlert('Authentication required to sync reminders with Google Calendar!', 'Authentication Required', 'warning');
      return;
    }

    setSyncingStates((prev) => ({ ...prev, [chit.id]: true }));
    try {
      const summary = `Chit Due: ${chit.chitName}`;
      const description = `Monthly contribution of ₹${chit.monthlyContribution.toLocaleString('en-IN')} is due. Organizer: ${chit.organizer}. Total Chit Value: ₹${chit.totalChitValue.toLocaleString('en-IN')}`;

      const res = await createCalendarReminder(accessToken, summary, description, chit.nextDueDate);
      if (res.success) {
        await showAlert(`Successfully synchronized chit due reminder for ${chit.nextDueDate}! Set triggers for 7, 3, 1 day, and on due date.`, 'Sync Successful', 'success');
      } else {
        await showAlert('Calendar sync failed: ' + res.error, 'Sync Failed', 'error');
      }
    } catch (err: any) {
      await showAlert('Failed: ' + err.message, 'Sync Failed', 'error');
    } finally {
      setSyncingStates((prev) => ({ ...prev, [chit.id]: false }));
    }
  };

  const simulatorChartData = useMemo(() => {
    const val = Number(calcChitValue) || 100000;
    const members = Number(calcMembers) || 20;
    const bid = Number(calcBidDiscount) || 20000;
    const commPct = Number(calcCommissionPct) || 5;

    const foremanCommission = val * (commPct / 100);
    const dividendPool = bid - foremanCommission;
    const dividendPerMember = dividendPool > 0 ? dividendPool / members : 0;
    const standardInstallment = val / members;
    const netPayment = standardInstallment - dividendPerMember;
    const prizeMoney = val - bid;

    const data = [];
    for (let t = 1; t <= members; t++) {
      if (t === calcPrizeMonth) {
        data.push({
          month: `${t}`,
          "Amount": Math.round(prizeMoney - netPayment),
          label: `Payout: ₹${Math.round(prizeMoney).toLocaleString('en-IN')}`,
          type: 'Prize Received'
        });
      } else {
        data.push({
          month: `${t}`,
          "Amount": -Math.round(netPayment),
          label: `Payment: -₹${Math.round(netPayment).toLocaleString('en-IN')}`,
          type: 'Contribution'
        });
      }
    }
    return data;
  }, [calcChitValue, calcMembers, calcBidDiscount, calcCommissionPct, calcPrizeMonth]);

  return (
    <div className="space-y-6">
      {/* Tabs Menu */}
      <div className="flex bg-slate-950/40 p-1 rounded-xl w-fit gap-1 border border-slate-900 shadow-2xs mb-2 select-none">
        <button
          onClick={() => setActiveTab('chits')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${
            activeTab === 'chits'
              ? 'bg-gradient-to-r from-violet-650 to-fuchsia-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Chit Funds Ledger
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${
            activeTab === 'calculator'
              ? 'bg-gradient-to-r from-violet-650 to-fuchsia-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Interactive YTM Simulator
        </button>
      </div>

      {activeTab === 'calculator' && (
        <div 
          onMouseMove={handleMouseMove}
          className="glow-card rounded-3xl p-6 md:p-8 space-y-6 text-left animate-scale-in"
        >
          <div>
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400 animate-pulse" /> Interactive Auction Bidding Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-1">Drag the months slider to simulate winning the auction, instantly calculating annualized yields (YTM) and modeling dynamic cash flows.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-2 space-y-4.5 bg-slate-950/40 p-5 rounded-2xl border border-slate-900 shadow-3xs">
              <h4 className="text-[10px] font-bold text-slate-455 uppercase tracking-widest border-b border-slate-900 pb-2">Simulation Parameters</h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Chit Fund Value (₹)</label>
                <input 
                  type="number" 
                  value={calcChitValue}
                  onChange={(e) => setCalcChitValue(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:bg-slate-950 transition-all font-mono"
                  placeholder="e.g. 100000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Total Members</label>
                  <input 
                    type="number" 
                    value={calcMembers}
                    onChange={(e) => setCalcMembers(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:bg-slate-950 transition-all font-mono"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Bid Discount (₹)</label>
                  <input 
                    type="number" 
                    value={calcBidDiscount}
                    onChange={(e) => setCalcBidDiscount(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:bg-slate-950 transition-all font-mono"
                    placeholder="e.g. 30000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Commission (%)</label>
                  <input 
                    type="number" 
                    value={calcCommissionPct}
                    onChange={(e) => setCalcCommissionPct(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:bg-slate-950 transition-all font-mono"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Prize Month</label>
                  <input 
                    type="number" 
                    min="1"
                    max={calcMembers}
                    value={calcPrizeMonth}
                    onChange={(e) => setCalcPrizeMonth(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:bg-slate-950 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Range Slider Interaction */}
              <div className="pt-2 border-t border-slate-905">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-400">Timeline Slider:</span>
                  <span className="text-violet-400 font-mono">Month {calcPrizeMonth} of {calcMembers || 20}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max={calcMembers || 20}
                  value={calcPrizeMonth}
                  onChange={(e) => setCalcPrizeMonth(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1 font-mono">
                  <span>Month 1</span>
                  <span>Month {Math.round((calcMembers || 20) / 2)}</span>
                  <span>Month {calcMembers || 20}</span>
                </div>
              </div>
            </div>

            {/* Visualizer & Outputs */}
            <div className="lg:col-span-3 space-y-4">
              {(() => {
                const results = calculateChitYTM();
                return (
                  <>
                    {/* Key Metric Deck */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-1 shadow-3xs text-left">
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Net Payout Received</span>
                        <span className="text-base font-black text-slate-200 font-mono">₹{results.prizeMoney.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-1 shadow-3xs text-left">
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Net Contribution</span>
                        <span className="text-base font-black text-slate-200 font-mono">₹{results.netPayment.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-gradient-to-tr from-violet-650 to-fuchsia-600 text-white p-4 rounded-2xl shadow-glow relative overflow-hidden flex flex-col justify-center text-left">
                        <div className="absolute -right-3 -top-3 h-14 w-14 bg-white/5 rounded-full pointer-events-none" />
                        <span className="text-[9px] font-bold text-violet-200 uppercase tracking-widest block z-10">Annualized Yield (YTM)</span>
                        <span className="text-2xl font-black font-mono tracking-tight z-10">{results.annualizedYTM.toFixed(2)}%</span>
                      </div>
                    </div>

                    {/* Recharts Live Cash Flow */}
                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5 text-violet-400" /> Cash Flow Visualizer
                        </h4>
                        <span className="text-[9px] font-semibold text-slate-500">Green = Net Prize | Red = Monthly Payment</span>
                      </div>

                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={simulatorChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <XAxis dataKey="month" stroke="#475569" fontSize={9} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const item = payload[0].payload;
                                  return (
                                    <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-left shadow-lg">
                                      <p className="text-[9px] font-bold text-slate-500 font-mono">Month {item.month}</p>
                                      <p className={`text-xs font-black font-mono ${item.type === 'Prize Received' ? 'text-emerald-450' : 'text-rose-455'}`}>
                                        {item.label}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="Amount">
                              {simulatorChartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.type === 'Prize Received' ? '#10b981' : '#f43f5e'} 
                                  fillOpacity={entry.type === 'Prize Received' ? 0.95 : 0.8}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* AI Bidding Advisor Insights */}
              <div className="p-4 bg-gradient-to-tr from-slate-900/60 to-slate-950/60 border border-slate-850 rounded-2xl space-y-2.5">
                <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Bidding Engine Insights
                </h4>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {calcPrizeMonth <= Math.round((calcMembers || 20) * 0.25) ? (
                    <p>
                      ⚠️ <strong className="text-rose-400">Early Auction Bid Phase:</strong> Bidding in months 1 to {Math.round((calcMembers || 20) * 0.25)} is optimal only if you have an urgent personal need for capital (e.g. debt repayment, immediate asset purchase). The high bid discount of ₹{calcBidDiscount.toLocaleString('en-IN')} reduces your effective YTM return to <span className="font-bold text-rose-400 font-mono">{calculateChitYTM().annualizedYTM.toFixed(2)}%</span>.
                    </p>
                  ) : calcPrizeMonth >= Math.round((calcMembers || 20) * 0.75) ? (
                    <p>
                      💎 <strong className="text-emerald-450">Late Auction Dividends Peak:</strong> Bidding in the final months (Month {Math.round((calcMembers || 20) * 0.75)} to {calcMembers}) acts as an excellent savings instrument. You secure maximum dividend pools from previous rounds, yielding an estimated annualized return of <span className="font-bold text-emerald-450 font-mono">{calculateChitYTM().annualizedYTM.toFixed(2)}%</span>.
                    </p>
                  ) : (
                    <p>
                      ⚡ <strong className="text-cyan-400">Mid-Term Balance Phase:</strong> Month {calcPrizeMonth} offers a solid balance between cash availability and dividend earnings. You receive a net prize payout of <span className="font-bold text-white font-mono">₹{calculateChitYTM().prizeMoney.toLocaleString('en-IN')}</span> while securing a moderate yield rate.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chits' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Summary Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onMouseMove={handleMouseMove}
              className="glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Active Value</span>
                <span className="text-xl font-black text-slate-100 font-mono">₹{statsSummary.totalValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-10 w-10 bg-violet-950/40 text-violet-400 rounded-xl flex items-center justify-center border border-violet-850 shadow-2xs">
                <Landmark className="h-5 w-5" />
              </div>
            </div>

            <div 
              onMouseMove={handleMouseMove}
              className="glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Monthly Bill</span>
                <span className="text-xl font-black text-slate-100 font-mono">₹{statsSummary.totalMonthly.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-10 w-10 bg-indigo-950/40 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-850 shadow-2xs">
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            <div 
              onMouseMove={handleMouseMove}
              className="glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Contributed</span>
                <span className="text-xl font-black text-slate-100 font-mono">₹{statsSummary.totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-10 w-10 bg-emerald-950/40 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-850 shadow-2xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div 
              onMouseMove={handleMouseMove}
              className="glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Projected Yield</span>
                <span className={`text-xl font-black font-mono ${statsSummary.totalYield >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                  {statsSummary.totalYield >= 0 ? '+' : '-'}₹{Math.abs(statsSummary.totalYield).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-2xs ${statsSummary.totalYield >= 0 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-850' : 'bg-rose-950/40 text-rose-455 border-rose-850'}`}>
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center gap-4 border-b border-slate-900 pb-3 mt-2">
            <div>
              <h2 className="text-xs font-extrabold text-slate-550 tracking-wider uppercase">Active Trackers ({chits.length})</h2>
            </div>
            <button
              onClick={() => {
                if (showAddForm && !editingChitId) {
                  setShowAddForm(false);
                } else {
                  resetForm();
                  setShowAddForm(true);
                }
              }}
              className="bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-glow flex items-center gap-1.5 cursor-pointer hover:-translate-y-[1px] active:translate-y-0 animate-pulse"
              id="btn-add-chit"
            >
              <Plus className="h-4 w-4" /> Start Chit Tracker
            </button>
          </div>

          {/* Add Chit Form */}
          {showAddForm && (
            <form onSubmit={handleAddChit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-premium space-y-6 text-left animate-scale-in">
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Landmark className="text-violet-400 h-5 w-5" /> {editingChitId ? 'Edit Chit Fund Account' : 'Start New Chit Fund Account'}
                </h3>
                
                <div className="flex items-center gap-3">
                  {startDate && totalTenureMonths && !isNaN(Number(totalTenureMonths)) && (
                    <span className="text-[10px] bg-violet-950/20 text-violet-300 border border-violet-900/40 px-3 py-1.5 rounded-lg font-mono font-bold">
                      Maturity: {new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + Number(totalTenureMonths))).toISOString().split('T')[0]}
                    </span>
                  )}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,.csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isParsingFile}
                      className="px-3.5 py-1.5 bg-slate-950/40 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {isParsingFile ? 'Reading Statement...' : 'Import Statement'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Chit Scheme Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gokulam 5 Lakh Chit"
                    value={chitName}
                    onChange={(e) => setChitName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden font-bold text-slate-250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Foreman / Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Shriram Chits"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden font-semibold text-slate-250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(Number(e.target.value))}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden font-mono font-bold text-slate-250"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Chit Value (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={totalChitValue}
                    onChange={(e) => handleChitValueChange(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden font-mono font-bold text-slate-205"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Total Members / Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={totalTenureMonths}
                    onChange={(e) => setTotalTenureMonths(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden font-mono font-bold text-slate-205"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Calculated Monthly Fee (₹)</label>
                  <input
                    type="number"
                    readOnly
                    placeholder="e.g. 25000"
                    value={monthlyContribution}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-violet-400 cursor-not-allowed"
                  />
                  {monthlyContribution && (
                    <span className="text-[10px] text-slate-500 block mt-1 font-semibold">
                      Word: {numberToWords(Number(monthlyContribution))} Rupees
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Foreman Commission (%)</label>
                  <input
                    type="number"
                    required
                    placeholder="5"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden font-mono font-semibold text-slate-255"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden text-slate-255"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Next Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-950 outline-hidden text-slate-255"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowAddForm(false); }}
                  className="px-4.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-750 hover:to-fuchsia-750 rounded-xl transition-all cursor-pointer shadow-glow"
                >
                  {editingChitId ? 'Update Chit Fund' : 'Add Chit Fund'}
                </button>
              </div>
            </form>
          )}

          {/* Chits List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chits.length === 0 ? (
              <div className="col-span-2 bg-slate-900/50 rounded-2xl border border-slate-850 p-12 text-center text-slate-500 italic shadow-premium">
                No active chit funds tracked. Add chits to calculate payouts and expected yields.
              </div>
            ) : (
              [...chits].sort((a, b) => {
                const aMatured = Number(a.installmentsPaid) >= Number(a.numberOfMembers);
                const bMatured = Number(b.installmentsPaid) >= Number(b.numberOfMembers);
                if (aMatured && !bMatured) return 1;
                if (!aMatured && bMatured) return -1;
                return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
              }).map((chit) => {
                const paidPct = (Number(chit.installmentsPaid) / Number(chit.numberOfMembers)) * 100;
                const isMatured = Number(chit.installmentsPaid) >= Number(chit.numberOfMembers);
                
                // Calculate expected yield dynamically
                const displayChitValue = chit.totalChitValue;
                const displayMonthly = chit.monthlyContribution;
                const chitTxs = transactions.filter(t => t.chitId === chit.id && t.type !== 'Prize Received');
                const txSum = chitTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
                const totalContributed = txSum > 0 ? txSum : (chit.amountPaidTillDate || (displayMonthly * chit.installmentsPaid));
                const remainingInstallments = Math.max(0, chit.numberOfMembers - chit.installmentsPaid);
                const displayPrizeReceived = chit.prizeAmountReceived || 0;
                const expectedYield = chit.prizeTaken
                  ? displayPrizeReceived - (totalContributed + (displayMonthly * remainingInstallments))
                  : displayChitValue - (totalContributed + (displayMonthly * remainingInstallments));
                
                return (
                  <div 
                    key={chit.id} 
                    onMouseMove={handleMouseMove}
                    className="glow-card rounded-3xl p-6 flex flex-col justify-between shadow-premium transition-all hover:-translate-y-[2px] duration-300 text-left"
                  >
                    {/* Card Content Header */}
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">
                            {chit.organizer || 'Chit Fund'}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-200 leading-tight">
                            {chit.chitName}
                          </h3>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-lg font-black text-slate-200 font-mono">
                            ₹{Number(chit.totalChitValue).toLocaleString('en-IN')}
                          </span>
                          <div className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                            isMatured 
                              ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/50' 
                              : 'text-violet-400 bg-violet-950/20 border-violet-900/50'
                          }`}>
                            {isMatured ? 'Matured' : `Installment ${chit.installmentsPaid}/${chit.numberOfMembers}`}
                          </div>
                        </div>
                      </div>

                      {/* Lifetime Progress Track */}
                      <div className="mt-5 space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500">
                          <span>LIFETIME PROGRESS</span>
                          <span>{paidPct.toFixed(0)}% PAID</span>
                        </div>
                        <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-slate-900">
                          <div 
                            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-glow" 
                            style={{ width: `${Math.min(paidPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Info Row Key Points */}
                      <div className="grid grid-cols-3 gap-3.5 mt-5 bg-slate-950/30 p-3.5 border border-slate-900 rounded-2xl text-[10px] leading-relaxed">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-500 uppercase tracking-widest block">Monthly</span>
                          <span className="font-black text-slate-350 font-mono text-[11px]">
                            ₹{Number(chit.monthlyContribution).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="space-y-0.5 border-l border-slate-900 pl-3">
                          <span className="font-bold text-slate-500 uppercase tracking-widest block">Paid / Outflow</span>
                          <span className="font-black text-slate-350 font-mono text-[11px]">
                            ₹{Number(chit.amountPaidTillDate || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="space-y-0.5 border-l border-slate-900 pl-3">
                          <span className="font-bold text-slate-500 uppercase tracking-widest block">Next Due</span>
                          <span className="font-black text-slate-350 font-mono text-[10px] block truncate">
                            {chit.nextDueDate}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Yield Status Block */}
                      <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-950/20 p-3 border border-slate-900/60 rounded-2xl text-[10px]">
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Payout Status</span>
                          {chit.prizeTaken ? (
                            <span className="font-extrabold text-emerald-450 flex items-center gap-1">
                              ✓ Received ₹{Number(chit.prizeAmountReceived || 0).toLocaleString('en-IN')} (M{chit.prizeTakenMonth})
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-455">Pending Bidding</span>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Expected Yield</span>
                          {expectedYield !== undefined ? (
                            <span className={`font-black font-mono text-[11px] ${Number(expectedYield) >= 0 ? 'text-emerald-455' : 'text-rose-455'}`}>
                              {Number(expectedYield) >= 0 ? '+' : '-'}₹{Math.abs(Number(expectedYield)).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-500 italic">Not Calculated</span>
                          )}
                        </div>
                      </div>

                      {/* Inline Custom Transaction Log Form */}
                      {activeLogFormChitId === chit.id && (
                        <div className="mt-4 p-4 bg-slate-955/50 border border-slate-800 rounded-2xl space-y-3 shadow-3xs animate-fade-in text-left">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rapid Transaction Logger</h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Amount (₹)</label>
                              <input 
                                type="number"
                                placeholder={chit.monthlyContribution.toString()}
                                value={logAmount}
                                onChange={(e) => setLogAmount(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Installment #</label>
                              <input 
                                type="number"
                                placeholder={logChitNumber}
                                value={logChitNumber}
                                onChange={(e) => setLogChitNumber(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300 font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Type</label>
                              <select 
                                value={logType}
                                onChange={(e) => setLogType(e.target.value as any)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300"
                              >
                                <option value="Installment Paid">Installment Paid</option>
                                <option value="Bonus">Bonus / Div</option>
                                <option value="Adjustment">Adjustment</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Date</label>
                              <input 
                                type="date"
                                value={logDate}
                                onChange={(e) => setLogDate(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-300"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Pay Source / Account</label>
                            <select
                              value={paySourceIds[chit.id] || ''}
                              onChange={(e) => setPaySourceIds(prev => ({ ...prev, [chit.id]: e.target.value }))}
                              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300"
                            >
                              <option value="">-- Choose Account --</option>
                              {banks && banks.length > 0 && (
                                <optgroup label="Bank Accounts" className="bg-slate-900">
                                  {banks.map(b => (
                                    <option key={b.id} value={b.id}>{b.bankName} (₹{b.currentBalance.toLocaleString('en-IN')})</option>
                                  ))}
                                </optgroup>
                              )}
                              {cards && cards.length > 0 && (
                                <optgroup label="Credit Cards" className="bg-slate-900">
                                  {cards.map(c => (
                                    <option key={c.id} value={c.id}>{c.cardName} (Limit: ₹{c.creditLimit.toLocaleString('en-IN')})</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setActiveLogFormChitId(null)}
                              className="px-3 py-1 text-[10px] font-bold text-slate-450 hover:text-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLogCustomTx(chit)}
                              className="px-3.5 py-1 bg-violet-650 hover:bg-violet-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 mt-4 border-t border-slate-850 flex flex-wrap gap-2 items-center">
                      {!chit.prizeTaken && (
                        <button
                          onClick={() => handleClaimPrize(chit)}
                          className="px-3.5 py-1.5 text-xs font-bold text-violet-400 bg-violet-950/40 hover:bg-violet-950 border border-violet-900/40 rounded-lg transition-all cursor-pointer shadow-3xs"
                          title="Claim Bid Payout"
                        >
                          Claim Payout
                        </button>
                      )}
                      
                      {!isMatured && (
                        <button
                          onClick={() => {
                            if (activeLogFormChitId === chit.id) {
                              setActiveLogFormChitId(null);
                            } else {
                              setLogAmount(chit.monthlyContribution.toString());
                              setLogChitNumber((Number(chit.installmentsPaid) + 1).toString());
                              setLogType('Installment Paid');
                              setLogDate(new Date().toISOString().split('T')[0]);
                              setActiveLogFormChitId(chit.id);
                            }
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-350 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all cursor-pointer"
                        >
                          {activeLogFormChitId === chit.id ? 'Cancel Logger' : 'Log Amount'}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setViewingPastPaymentsChit(chit);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-950/20 border border-slate-850/50 hover:border-slate-800 rounded-lg transition-all cursor-pointer"
                        title="View logs"
                      >
                        <History className="h-4 w-4" />
                      </button>

                      <div className="flex-1"></div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSyncToCalendar(chit)}
                          disabled={syncingStates[chit.id]}
                          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-violet-400 border border-slate-850/30 transition-all cursor-pointer"
                          title="Sync reminders to Google Calendar"
                        >
                          {syncingStates[chit.id] ? (
                            <span className="text-[10px] font-bold text-violet-400">Syncing...</span>
                          ) : (
                            <CalendarPlus className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditClick(chit)}
                          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-450 hover:text-cyan-400 border border-slate-850/30 transition-all cursor-pointer"
                          title="Edit Chit Details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChit(chit.id)}
                          className="p-1.5 hover:bg-slate-850 rounded-md text-slate-450 hover:text-rose-500 border border-slate-850/30 transition-all cursor-pointer"
                          title="Delete Tracker"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Past Payments Modal */}
      {viewingPastPaymentsChit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/65 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
            <div className="p-4.5 border-b border-slate-800/80 flex justify-between items-center bg-slate-955/50">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <History className="h-5 w-5 text-violet-400 animate-pulse" /> Logs - {viewingPastPaymentsChit.chitName}
              </h3>
              <button 
                onClick={() => setViewingPastPaymentsChit(null)}
                className="text-slate-500 hover:text-slate-350 hover:bg-slate-850 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-slate-900/60 space-y-3.5">
              {transactions.filter(t => t.chitId === viewingPastPaymentsChit.id).length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-6 font-medium italic">No past payments recorded yet.</div>
              ) : (
                transactions
                  .filter(t => t.chitId === viewingPastPaymentsChit.id)
                  .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                  .map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-sm border border-slate-850 bg-slate-950/40 rounded-2xl p-4 shadow-3xs hover:shadow-2xs transition-shadow text-left">
                      <div>
                        <div className="font-extrabold text-slate-200 font-mono">₹{Number(tx.amount).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                          <span>{tx.transactionDate}</span>
                          {tx.chitNumber ? (
                            <>
                              <span>•</span>
                              <span className="font-bold text-slate-400 font-mono">Chit #{tx.chitNumber}</span>
                            </>
                          ) : ''}
                        </div>
                      </div>
                      <div className="text-right flex items-center justify-end gap-3 select-none">
                        <div className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                          tx.type === 'Prize Received' 
                            ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/50' 
                            : 'text-violet-400 bg-violet-950/20 border-violet-900/50'
                        }`}>
                          {tx.type === 'Prize Received' ? 'Prize' : 'Installment'}
                        </div>
                        <button
                          onClick={() => handleDeleteTransaction(tx, viewingPastPaymentsChit)}
                          className="text-slate-500 hover:text-rose-500 transition-colors cursor-pointer p-1 rounded-md hover:bg-slate-850"
                          title="Delete transaction"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            
            <div className="p-4.5 border-t border-slate-800/80 bg-slate-955/50 flex justify-between items-center">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf,.csv"
                  ref={txFileInputRef}
                  onChange={handleTxFileUpload}
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => txFileInputRef.current?.click()}
                  disabled={isParsingTx}
                  className="px-4 py-2 bg-slate-950/40 hover:bg-slate-850 text-violet-400 border border-violet-900/40 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-3xs"
                >
                  {isParsingTx ? 'Parsing...' : 'Upload Statement'}
                </button>
              </div>

              <button
                onClick={() => setViewingPastPaymentsChit(null)}
                className="px-4.5 py-2 bg-gradient-to-r from-violet-650 to-fuchsia-600 hover:from-violet-750 hover:to-fuchsia-750 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-glow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
