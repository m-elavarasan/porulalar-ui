import { porulalarStore, increment } from '../lib/store';
import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, Calendar, AlertCircle, Plus, CheckCircle2, History, X, Trash, FileText, CalendarPlus, Pencil, Gift, HelpCircle } from 'lucide-react';
import { numberToWords } from '../lib/utils';
import { Chit, Bank, Card } from '../types';
import { createCalendarReminder } from '../lib/googleServices';
import { useDialog } from './DialogProvider';

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
  return (
    <div className="space-y-6">
      {/* Tabs Menu */}
      <div className="flex bg-slate-100/70 backdrop-blur-xs p-1 rounded-xl w-fit gap-1 border border-slate-200/50 shadow-2xs mb-2 select-none">
        <button
          onClick={() => setActiveTab('chits')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${
            activeTab === 'chits'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Chit Funds Ledger
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${
            activeTab === 'calculator'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Dividend & YTM Calculator
        </button>
      </div>

      {activeTab === 'calculator' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-150/60 shadow-premium space-y-6 text-left animate-scale-in">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 animate-pulse" /> Auction Dividend & YTM Yield Estimator
            </h3>
            <p className="text-xs text-slate-500 mt-1">Determine your monthly cash flows and estimate the annualized internal rate of return (YTM Yield %) if you bid for the chit prize in a given month.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-150/60 shadow-2xs">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Chit Value (₹)</label>
              <input 
                type="number" 
                value={calcChitValue} 
                onChange={e => setCalcChitValue(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Members / Months</label>
              <input 
                type="number" 
                value={calcMembers} 
                onChange={e => setCalcMembers(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Auction Discount Bid (₹)</label>
              <input 
                type="number" 
                value={calcBidDiscount} 
                onChange={e => setCalcBidDiscount(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Commission % (Foreman)</label>
              <input 
                type="number" 
                value={calcCommissionPct} 
                onChange={e => setCalcCommissionPct(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Prize Month Bid Target</label>
              <input 
                type="number" 
                min="1"
                max={calcMembers}
                value={calcPrizeMonth} 
                onChange={e => setCalcPrizeMonth(Number(e.target.value))} 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden transition-all focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {(() => {
            const results = calculateChitYTM();
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="p-5 bg-white border border-slate-150/60 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dividend Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-500 font-medium">Foreman Commission</span>
                      <span className="font-mono font-bold text-slate-700">₹{results.commission.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-500 font-medium">Total Member Dividend</span>
                      <span className="font-mono font-bold text-emerald-600">₹{results.dividendPool.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 border-t border-slate-100 mt-2 pt-2 font-semibold text-slate-800">
                      <span>Dividend Per Person</span>
                      <span className="font-mono text-emerald-600">₹{results.dividendPerMember.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-150/60 rounded-2xl space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installment & Payout</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-500 font-medium">Standard Installment</span>
                      <span className="font-mono font-bold text-slate-700">₹{(calcChitValue / calcMembers).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-500 font-medium">Net Contribution (This Month)</span>
                      <span className="font-mono font-bold text-indigo-600">₹{results.netPayment.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 border-t border-slate-100 mt-2 pt-2 font-semibold text-slate-800">
                      <span>Cash Prize Payout</span>
                      <span className="font-mono text-indigo-600">₹{results.prizeMoney.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl flex flex-col justify-between shadow-premium shadow-indigo-500/20 relative overflow-hidden transition-all hover:scale-[1.01]">
                  <div className="absolute right-0 top-0 h-24 w-24 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-200/90">Annualized Yield (YTM)</span>
                    <div className="text-3xl font-black font-mono mt-1 tracking-tight">{results.annualizedYTM.toFixed(2)}%</div>
                  </div>
                  <p className="text-[10px] text-indigo-100/90 leading-relaxed font-medium mt-4 z-10">
                    Bidding in month {calcPrizeMonth} gives you this estimated internal rate of return (annualized yield) when net cash flows are compounded monthly.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'chits' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Summary Deck */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-150/60 shadow-premium flex items-center justify-between transition-all hover:shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Value</span>
                <span className="text-xl font-black text-slate-800 font-mono">₹{statsSummary.totalValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-10 w-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100 shadow-2xs">
                <Landmark className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150/60 shadow-premium flex items-center justify-between transition-all hover:shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Bill</span>
                <span className="text-xl font-black text-slate-800 font-mono">₹{statsSummary.totalMonthly.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-2xs">
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150/60 shadow-premium flex items-center justify-between transition-all hover:shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Contributed</span>
                <span className="text-xl font-black text-slate-800 font-mono">₹{statsSummary.totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150/60 shadow-premium flex items-center justify-between transition-all hover:shadow-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Projected Yield</span>
                <span className={`text-xl font-black font-mono ${statsSummary.totalYield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {statsSummary.totalYield >= 0 ? '+' : '-'}₹{Math.abs(statsSummary.totalYield).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-2xs ${statsSummary.totalYield >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center gap-4 border-b border-slate-150/50 pb-3 mt-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-700 tracking-wider uppercase">Active Trackers ({chits.length})</h2>
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
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-premium shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer hover:-translate-y-[1px] active:translate-y-0"
              id="btn-add-chit"
            >
              <Plus className="h-4 w-4" /> Start Chit Tracker
            </button>
          </div>

          {/* Add Chit Form */}
          {showAddForm && (
            <form onSubmit={handleAddChit} className="bg-white p-6 border border-slate-150/60 rounded-3xl shadow-premium space-y-6 text-left animate-scale-in">
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <Landmark className="text-indigo-500 h-5 w-5" /> {editingChitId ? 'Edit Chit Fund Account' : 'Start New Chit Fund Account'}
                </h3>
                
                <div className="flex items-center gap-3">
                  {startDate && totalTenureMonths && !isNaN(Number(totalTenureMonths)) && (
                    <span className="text-[10px] bg-indigo-50/50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg font-mono font-bold">
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
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Foreman / Organizer Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Shriram Chits, Gokulam"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Processing / Admission Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-slate-750"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold text-slate-700"
                  />
                  {totalChitValue && <div className="text-[10px] text-indigo-500 font-bold mt-1.5 uppercase tracking-wide">{numberToWords(Number(totalChitValue))} Rupees</div>}
                </div>
                <div className="col-span-full md:col-span-2 bg-indigo-50/20 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isShared"
                      checked={isShared} 
                      onChange={(e) => setIsShared(e.target.checked)} 
                      className="w-4 h-4 text-indigo-650 rounded border-slate-350 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="isShared" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      Are you sharing this chit with a partner?
                    </label>
                  </div>
                  
                  {isShared && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-indigo-100 mt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Partner's Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Wife, Friend"
                          value={sharePartnerName}
                          onChange={(e) => setSharePartnerName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-50 outline-hidden font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Your Share Percentage (%)</label>
                        <input
                          type="number"
                          placeholder="50"
                          value={mySharePercentage}
                          onChange={(e) => setMySharePercentage(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-slate-50 outline-hidden font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">No. of Members</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={numberOfMembers}
                    onChange={(e) => handleMembersChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gap (Months)</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    placeholder="e.g. 1"
                    value={gapMonths}
                    onChange={(e) => handleGapChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Total Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={totalTenureMonths}
                    onChange={(e) => setTotalTenureMonths(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-black text-slate-700 focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly Contribution (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Auto-calc"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono font-extrabold text-indigo-650"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-250">
                <div className="md:col-span-2 flex items-center">
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                    If this chit fund was started in the past, enter any initial installments and amounts already paid to initialize correctly:
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Installments Already Paid</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialInstallments}
                    onChange={(e) => setInitialInstallments(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Amount Paid Till Date (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Next Payment Due Date</label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Organizer contact, office address, or account details"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><Plus className="h-4 w-4 text-indigo-500" /> Auto Pay Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/20 p-4.5 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      id="autoPay"
                      checked={autoPay}
                      onChange={(e) => setAutoPay(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="autoPay" className="text-xs font-bold text-slate-750 cursor-pointer">
                      Enable Auto Pay (auto-deduct on Due Date)
                    </label>
                  </div>
                  {autoPay && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Source for Auto Debit/Charge</label>
                      <select
                        value={autoPaySourceId}
                        onChange={(e) => setAutoPaySourceId(e.target.value)}
                        required={autoPay}
                        className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-hidden"
                      >
                        <option value="">-- Auto Pay Source --</option>
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
                              <option key={c.id} value={c.id}>{c.cardName} (O/S: ₹{c.currentOutstanding.toLocaleString('en-IN')})</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowAddForm(false); }}
                  className="px-4.5 py-2 text-xs font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl transition-all cursor-pointer shadow-premium shadow-indigo-500/10"
                >
                  {editingChitId ? 'Update Chit Fund' : 'Add Chit Fund'}
                </button>
              </div>
            </form>
          )}

          {/* Chits List Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chits.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-150/60 p-12 text-center text-slate-400 italic shadow-premium">
                No active chit funds tracked. Add chits to calculate payouts and expected yields.
              </div>
            ) : (
              [...chits].sort((a, b) => {
                if (!a.nextDueDate) return 1;
                if (!b.nextDueDate) return -1;
                return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
              }).map((chit) => {
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
                const nextDueCalculated = chit.nextDueDate;

                return (
                  <div key={chit.id} className="bg-white rounded-2xl border border-slate-150/70 p-5 shadow-premium hover:shadow-glow hover:-translate-y-[1px] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-80" />
                    <div>
                      <div className="flex justify-between items-start mb-3 mt-1 text-left">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/50 shadow-3xs">
                              {chit.organizer}
                            </span>
                            {chit.isShared && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50/70 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100 shadow-3xs font-semibold">
                                Shared ({chit.mySharePercentage}%)
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-sm mt-2 tracking-tight group-hover:text-indigo-600 transition-colors">{chit.chitName}</h4>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Tenure: {chit.totalTenureMonths} Months • Gap: {chit.gapMonths || 1} M</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Payout Value</span>
                          <div className="text-sm font-mono font-black text-slate-800">₹{displayChitValue.toLocaleString('en-IN')}</div>
                        </div>
                      </div>

                      {/* Payment Progress Bar */}
                      <div className="space-y-1.5 mt-4">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-450 font-medium font-sans">Paid: {chit.installmentsPaid} / {chit.numberOfMembers} Months</span>
                          <span className="font-bold text-indigo-600">{Math.round((chit.installmentsPaid / chit.numberOfMembers) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-3xs">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500 shadow-glow"
                            style={{ width: `${Math.min((chit.installmentsPaid / chit.numberOfMembers) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Payment summary grid */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-4 rounded-xl border border-slate-150/40 font-mono text-xs mt-4 text-left">
                        <div>
                          <span className="text-slate-400 block mb-0.5 text-[9px] uppercase tracking-wider font-sans">My Contribution</span>
                          <span className="font-bold text-slate-700">₹{displayMonthly.toLocaleString('en-IN')}/mo</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 text-[9px] uppercase tracking-wider font-sans">Paid Till Date</span>
                          <span className="font-bold text-slate-800">₹{totalContributed.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="col-span-2 border-t border-slate-100/80 pt-2 flex justify-between">
                          <span className="text-slate-450 font-sans font-medium">Next Bill Due Date:</span>
                          <span className="font-bold text-indigo-600">{nextDueCalculated || 'Completed'}</span>
                        </div>
                      </div>

                      {/* Expected Yield approximation */}
                      <div className="mt-3 bg-slate-50/40 p-3 rounded-xl border border-slate-150/30">
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-slate-500 font-medium">Expected Yield:</span>
                          <span className={`font-extrabold font-mono text-sm ${approxExpectedYield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {approxExpectedYield >= 0 ? '+' : '-'}₹{Math.abs(approxExpectedYield).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 text-center italic mt-1 font-semibold">
                          {chit.prizeTaken
                            ? "Payout Value - (Invested + Remaining Installments)"
                            : "Chit Value - (Invested + Remaining Installments)"}
                        </div>
                      </div>

                      {/* Inline Custom Transaction Log Form (Fixed UI bug: custom log form rendering) */}
                      {activeLogFormChitId === chit.id && (
                        <div className="mt-4 p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3 shadow-2xs animate-fade-in text-left">
                          <div className="flex justify-between items-center pb-1.5 border-b border-amber-100">
                            <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Log Manual Installment</h5>
                            <button 
                              type="button" 
                              onClick={() => setActiveLogFormChitId(null)}
                              className="text-amber-500 hover:text-amber-700 font-bold text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Amount (₹)</label>
                              <input 
                                type="number"
                                placeholder={chit.monthlyContribution.toString()}
                                value={logAmount}
                                onChange={(e) => setLogAmount(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Installment #</label>
                              <input 
                                type="number"
                                placeholder={logChitNumber}
                                value={logChitNumber}
                                onChange={(e) => setLogChitNumber(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Type</label>
                              <select 
                                value={logType}
                                onChange={(e) => setLogType(e.target.value as any)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
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
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-705"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Pay Source / Account</label>
                            <select
                              value={paySourceIds[chit.id] || ''}
                              onChange={(e) => setPaySourceIds(prev => ({ ...prev, [chit.id]: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
                            >
                              <option value="">-- Choose Account --</option>
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

                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveLogFormChitId(null)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-md text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLogCustomTx(chit)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold shadow-3xs"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 mt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                      {!chit.prizeTaken && (
                        <button
                          onClick={() => handleClaimPrize(chit)}
                          className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 hover:border-indigo-200 rounded-lg transition-all cursor-pointer shadow-3xs"
                          title="Claim Bid Payout"
                        >
                          Claim Payout
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (activeLogFormChitId === chit.id) {
                            setActiveLogFormChitId(null);
                          } else {
                            setActiveLogFormChitId(chit.id);
                            setLogChitNumber((chit.installmentsPaid + 1).toString());
                          }
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-105 border border-amber-100 hover:border-amber-200 rounded-lg transition-all cursor-pointer shadow-3xs"
                        title="Log Custom Added Amount"
                      >
                        Log Amount
                      </button>
                      <div className="flex-1"></div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingPastPaymentsChit(chit)}
                          className="p-2 text-slate-500 hover:text-indigo-650 rounded-lg bg-slate-50/50 hover:bg-indigo-50 border border-slate-150/40 hover:border-indigo-100 transition-all cursor-pointer shadow-3xs"
                          title="View Past Payments"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSyncToCalendar(chit)}
                          disabled={syncingStates[chit.id]}
                          className="p-2 text-slate-500 hover:text-indigo-650 rounded-lg bg-slate-50/50 hover:bg-indigo-50 border border-slate-150/40 hover:border-indigo-100 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
                          title="Sync Due Date to Calendar"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(chit)}
                          className="p-2 text-slate-500 hover:text-indigo-650 rounded-lg bg-slate-50/50 hover:bg-indigo-50 border border-slate-150/40 hover:border-indigo-100 transition-all cursor-pointer shadow-3xs"
                          title="Edit chit details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChit(chit.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg bg-slate-50/50 hover:bg-rose-50 border border-slate-150/40 hover:border-rose-100 transition-all cursor-pointer shadow-3xs"
                          title="Delete chit"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100/80 animate-scale-in">
            <div className="p-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-500" /> Logs - {viewingPastPaymentsChit.chitName}
              </h3>
              <button 
                onClick={() => setViewingPastPaymentsChit(null)}
                className="text-slate-400 hover:text-slate-650 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-white space-y-3.5">
              {transactions.filter(t => t.chitId === viewingPastPaymentsChit.id).length === 0 ? (
                <div className="text-center text-slate-450 text-xs py-6 font-medium italic">No past payments recorded yet.</div>
              ) : (
                transactions
                  .filter(t => t.chitId === viewingPastPaymentsChit.id)
                  .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                  .map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-sm border border-slate-150/60 bg-slate-50/50 rounded-2xl p-4 shadow-3xs hover:shadow-2xs transition-shadow text-left">
                      <div>
                        <div className="font-extrabold text-slate-700 font-mono">₹{Number(tx.amount).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                          <span>{tx.transactionDate}</span>
                          {tx.chitNumber ? (
                            <>
                              <span>•</span>
                              <span className="font-bold text-slate-500">Chit #{tx.chitNumber}</span>
                            </>
                          ) : ''}
                        </div>
                      </div>
                      <div className="text-right flex items-center justify-end gap-3 select-none">
                        <div className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border ${tx.type === 'Prize Received' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-indigo-700 bg-indigo-50 border-indigo-100'}`}>
                          {tx.type === 'Prize Received' ? 'Prize' : 'Installment'}
                        </div>
                        <button
                          onClick={() => handleDeleteTransaction(tx, viewingPastPaymentsChit)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-md hover:bg-rose-50"
                          title="Delete transaction"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            
            <div className="p-4.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
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
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-3xs"
                >
                  {isParsingTx ? 'Parsing...' : 'Upload Statement'}
                </button>
              </div>

              <button
                onClick={() => setViewingPastPaymentsChit(null)}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-premium shadow-indigo-500/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}  </div>
        </div>
      )}
    </div>
  );
}
