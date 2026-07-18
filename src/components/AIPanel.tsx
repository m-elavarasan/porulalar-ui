import { porulalarStore, increment } from '../lib/store';
import React, { useState, useEffect } from 'react';
import { Send, Bot, Sparkles, User, ShieldAlert, Check, X, RefreshCw, Mail, Calendar, TrendingUp } from 'lucide-react';
import { fetchGmailTransactions, GmailDraft } from '../lib/googleServices';
import { useDialog } from './DialogProvider';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actionProposal?: {
    action: string;
    extractedData: any;
  };
}

interface AIPanelProps {
  userId: string;
  accessToken: string | null;
  onRefreshData: () => void;
  expenses: any[];
  income: any[];
  loans: any[];
  chits: any[];
  investments: any[];
  assets: any[];
  goals: any[];
  budgets: any[];
}

export default function AIPanel({
  userId,
  accessToken,
  onRefreshData,
  expenses,
  income,
  loans,
  chits,
  investments,
  assets,
  goals,
  budgets,
}: AIPanelProps) {
  const { showAlert } = useDialog();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your Porulalar AI. You can write natural language commands to log transactions, ask about your net worth, request cash flow forecasts, or analyze your spending. Try saying: 'Spent 250 on coffee' or 'Paid EMI 22030'.",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [gmailDrafts, setGmailDrafts] = useState<GmailDraft[]>([]);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'gmail'>('chat');
  const [gmailSubTab, setGmailSubTab] = useState<'auto' | 'paste'>('auto');
  const [manualSnippet, setManualSnippet] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [isParsingManual, setIsParsingManual] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/google/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setGoogleLinked(data.linked);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkStatus();
  }, []);

  // Trigger scanning of Gmail transactions on tab switch
  useEffect(() => {
    if (activeTab === 'gmail' && googleLinked && gmailDrafts.length === 0) {
      handleSyncGmail();
    }
  }, [activeTab, googleLinked]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
    };

    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = inputText;
    setInputText('');
    setLoading(true);

    try {
      // Package up user's financial data to provide rich context
      const context = {
        expenses: expenses.slice(0, 50), // Send recent expenses
        income: income.slice(0, 50),
        loans: loans.map(l => ({ id: l.id, loanName: l.loanName, loanType: l.loanType, outstanding: l.principalOutstanding, emi: l.emiAmount })),
        chits: chits.map(c => ({ id: c.id, chitName: c.chitName, total: c.totalChitValue, nextDue: c.nextDueDate })),
        investments: investments.map(i => ({ name: i.investmentName, value: i.currentValue, type: i.investmentType })),
        budgets,
        goals,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend, context }),
      });

      if (!res.ok) {
        throw new Error('AI Server responded with an error');
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.response,
      };

      if (data.action && data.action !== 'chat_response') {
        aiMsg.actionProposal = {
          action: data.action,
          extractedData: data.extractedData,
        };
      }

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `Sorry, I encountered an error while processing your request: ${error.message || 'Unknown server error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Confirms and executes an AI-proposed financial action
  const handleConfirmAction = async (msgId: string, action: string, data: any) => {
    try {
      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];

      if (action === 'create_expense') {
        await porulalarStore.addRecord('expenses', {
          userId,
          date: data.date || todayStr,
          category: data.category || 'Other',
          subCategory: data.subCategory || 'UPI',
          amount: Number(data.amount),
          paymentMethod: data.paymentMethod || 'UPI',
          description: data.description || 'AI Extracted Expense',
          tags: ['AI'],
          createdAt: now,
          updatedAt: now,
        });
      } else if (action === 'create_income') {
        await porulalarStore.addRecord('income', {
          userId,
          date: data.date || todayStr,
          source: data.source || 'AI Sourced',
          amount: Number(data.amount),
          description: data.description || 'AI Extracted Income',
          recurring: false,
          createdAt: now,
        });
      } else if (action === 'pay_emi') {
        // Find active loan matching the loanName
        const targetLoan = loans.find(
          (l) => l.loanName.toLowerCase().includes(data.loanName?.toLowerCase() || '') && l.status === 'Active'
        );

        if (targetLoan) {
          const loanId = targetLoan.id;
          const paidAmount = Number(data.amount || targetLoan.emiAmount);
          await porulalarStore.updateRecord('loans', loanId, {
            amountPaidTillDate: (targetLoan.amountPaidTillDate || 0) + paidAmount,
            principalOutstanding: Math.max(0, (targetLoan.principalOutstanding || 0) - paidAmount),
            remainingEMIs: Math.max(0, (targetLoan.remainingEMIs || 1) - 1),
            nextDueDate: new Date(new Date(targetLoan.nextDueDate).setMonth(new Date(targetLoan.nextDueDate).getMonth() + 1)).toISOString().split('T')[0],
          });
          // Log EMI as an expense
          await porulalarStore.addRecord('expenses', {
            userId,
            date: data.date || todayStr,
            category: 'EMI',
            subCategory: targetLoan.loanName,
            amount: paidAmount,
            paymentMethod: 'Auto-Debit',
            description: `EMI Paid for ${targetLoan.loanName}`,
            tags: ['EMI', 'AI'],
            createdAt: now,
            updatedAt: now,
          });
        } else {
          const matchedLoan = loans.find(l => l.loanName.toLowerCase().includes(data.loanName.toLowerCase()));
          if (!matchedLoan) {
            await showAlert(`No active loan found matching "${data.loanName}". I'll just log this as a standard expense.`, 'Notice', 'warning');
          }  
          await porulalarStore.addRecord('expenses', {
            userId,
            date: todayStr,
            category: 'EMI',
            subCategory: data.loanName || 'Loan',
            amount: Number(data.amount),
            paymentMethod: 'UPI',
            description: `EMI Payment: ${data.loanName}`,
            tags: ['EMI', 'AI'],
            createdAt: now,
            updatedAt: now,
          });
        }
      } else if (action === 'pay_chit') {
        const targetChit = chits.find(
          (c) => c.chitName.toLowerCase().includes(data.chitName?.toLowerCase() || '') && c.status === 'Active'
        );

        if (targetChit) {
          const chitId = targetChit.id;
          const paidAmount = Number(data.amount || targetChit.monthlyContribution);
          await porulalarStore.updateRecord('chits', chitId, {
            amountPaidTillDate: (targetChit.amountPaidTillDate || 0) + paidAmount,
            installmentsPaid: (targetChit.installmentsPaid || 0) + 1,
            installmentsRemaining: Math.max(0, (targetChit.installmentsRemaining || 1) - 1),
            nextDueDate: new Date(new Date(targetChit.nextDueDate).setMonth(new Date(targetChit.nextDueDate).getMonth() + 1)).toISOString().split('T')[0],
          });
          // Log chit payment as investment/expense transaction
          await porulalarStore.addRecord('expenses', {
            userId,
            date: data.date || todayStr,
            category: 'Chit',
            subCategory: targetChit.chitName,
            amount: paidAmount,
            paymentMethod: 'UPI',
            description: `Chit Contribution: ${targetChit.chitName}`,
            tags: ['Chit', 'AI'],
            createdAt: now,
            updatedAt: now,
          });
        } else {
          const matchedChit = chits.find(c => c.chitName.toLowerCase().includes(data.chitName.toLowerCase()));
          if (!matchedChit) {
            await showAlert(`No active chit found matching "${data.chitName}". I'll just log this as a standard expense.`, 'Notice', 'warning');
          }  
          await porulalarStore.addRecord('expenses', {
            userId,
            date: todayStr,
            category: 'Chit',
            subCategory: data.chitName || 'Chit',
            amount: Number(data.amount),
            paymentMethod: 'UPI',
            description: `Chit Payment: ${data.chitName}`,
            tags: ['Chit', 'AI'],
            createdAt: now,
            updatedAt: now,
          });
        }
      } else if (action === 'receive_chit') {
        const targetChit = chits.find(
          (c) => c.chitName.toLowerCase().includes(data.chitName?.toLowerCase() || '') && c.status === 'Active'
        );

        if (targetChit) {
          const chitId = targetChit.id;
          const prizeAmount = Number(data.prizeAmountReceived || data.amount);
          await porulalarStore.updateRecord('chits', chitId, {
            prizeTaken: true,
            prizeAmountReceived: prizeAmount,
            prizeTakenMonth: (targetChit.installmentsPaid || 1),
          });
          // Log received prize as Income
          await porulalarStore.addRecord('income', {
            userId,
            date: todayStr,
            source: 'Chit Received',
            amount: prizeAmount,
            description: `Prize payout from ${targetChit.chitName}`,
            recurring: false,
            createdAt: now,
          });
        } else {
          await showAlert(`No active chit found matching "${data.chitName}".`, 'Error', 'error');
          return;
        }
      } else if (action === 'create_investment') {
        await porulalarStore.addRecord('investments', {
          userId,
          investmentType: data.investmentType || 'Mutual Fund',
          investmentName: data.investmentName || 'AI Extracted Fund',
          platform: data.platform || 'Other',
          investedAmount: Number(data.amount),
          currentValue: Number(data.amount),
          monthlyContribution: 0,
          startDate: todayStr,
          lastUpdated: todayStr,
          gainLoss: 0,
          returnPercentage: 0,
          notes: 'Added via AI command',
        });
      }

      // Update message state to show completion
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, text: `${m.text} (✅ Action confirmed and successfully logged in the system!)`, actionProposal: undefined } : m
        )
      );

      onRefreshData();
    } catch (err: any) {
      console.error("Action execution error:", err);
      await showAlert('Failed to log transaction: ' + err.message, 'Error', 'error');
    }
  };

  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    try {
      const fetchRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/fetch-gmail-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
        },
        body: JSON.stringify({})
      });

      if (!fetchRes.ok) {
        const errData = await fetchRes.json();
        await showAlert(errData.error || 'Failed to fetch messages from Google. Link your Google account in Settings.', 'Gmail Sync Required', 'warning');
        return;
      }

      const fetchResult = await fetchRes.json();
      const messagesFetched = fetchResult.messages || [];
      if (messagesFetched.length === 0) {
        setGmailDrafts([]);
        await showAlert('No recent financial transaction emails found in updates folder.', 'Sync Complete', 'info');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/parse-gmail-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
        },
        body: JSON.stringify({ messages: messagesFetched }),
      });

      if (res.ok) {
        const data = await res.json();
        setGmailDrafts(data.drafts || []);
      } else {
        throw new Error('Failed to parse gmail snippets');
      }
    } catch (err: any) {
      console.error(err);
      await showAlert('Gmail transaction sync failed. Please link your Google Account in Settings.', 'Sync Error', 'error');
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleParseManualSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSnippet.trim()) return;

    setIsParsingManual(true);
    try {
      const manualMsg = {
        id: 'manual_' + Date.now(),
        snippet: manualSnippet,
        date: manualDate,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/parse-gmail-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
        },
        body: JSON.stringify({ messages: [manualMsg] }),
      });

      if (res.ok) {
        const data = await res.json();
        const drafts = data.drafts || [];
        const parsedData = drafts.length > 0 ? drafts[0] : null;
        
        if (!parsedData || !parsedData.parsed || parsedData.parsed.action === 'unknown') {
          await showAlert('Could not parse any financial transaction from the text. Make sure it contains values and is financial.', 'Parse Failed', 'warning');
        } else {
          setGmailDrafts((prev) => [parsedData, ...prev]);
          setManualSnippet('');
        }
      } else {
        await showAlert('Parsing failed. Ensure Gemini API key is configured.', 'Parse Failed', 'error');
      }
    } catch (err: any) {
      console.error("Manual parse error:", err);
      await showAlert('Error parsing statement: ' + err.message, 'Error', 'error');
    } finally {
      setIsParsingManual(false);
    }
  };

  const handleLoadDemoEmails = async () => {
    setSyncingGmail(true);
    try {
      const demoMessages = [
        {
          id: 'demo_1',
          snippet: "Your HDFC Credit Card xx9876 has been swiped for ₹2,450.00 at STARBUCKS COFFEE on 2026-06-25. Balance: ₹43,210.00.",
          date: '2026-06-25',
        },
        {
          id: 'demo_2',
          snippet: "Dear Customer, ₹45,000.00 has been credited to your ICICI Bank account xx123 towards June Salary on 2026-06-24.",
          date: '2026-06-24',
        },
        {
          id: 'demo_3',
          snippet: "SBI Alert: Your a/c no. xx567 is debited by ₹350.00 on 2026-06-23 towards SWIGGY. UPI Ref no 61827394.",
          date: '2026-06-23',
        },
        {
          id: 'demo_4',
          snippet: "HPCL PETROLEUM ALERT: ₹1,500.00 paid for fuel using HDFC Bank Debit Card xx345 on 2026-06-22.",
          date: '2026-06-22',
        }
      ];

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/parse-gmail-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('porulalar_access_token')}`
        },
        body: JSON.stringify({ messages: demoMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        setGmailDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleAddGmailDraft = async (draftId: string, parsed: any, date: string) => {
    try {
      const now = new Date().toISOString();
      if (parsed.type === 'expense') {
        const expenseObj = {
          userId,
          date,
          category: parsed.category || 'Other',
          subCategory: parsed.subCategory || 'UPI',
          amount: Number(parsed.amount),
          paymentMethod: 'UPI',
          description: parsed.description || 'Imported from Gmail/Alert',
          tags: ['Gmail Sync'],
          createdAt: now,
          updatedAt: now,
        };

        await porulalarStore.addRecord('expenses', expenseObj);
      } else {
        const incomeObj = {
          userId,
          date,
          source: parsed.description || 'Gmail Credit',
          amount: Number(parsed.amount),
          description: `Credited on ${date} (Imported from Gmail/Alert)`,
          recurring: false,
          createdAt: now,
        };

        await porulalarStore.addRecord('income', incomeObj);
      }

      // Optimistic update
      setGmailDrafts((prev) => prev.filter((d) => d.id !== draftId));
      onRefreshData();
    } catch (err) {
      console.error(err);
      await showAlert('Failed to import transaction', 'Error', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-[600px] flex flex-col" id="ai-manager-panel">
      {/* Header Tabs */}
      <div className="flex bg-slate-50 border-b border-slate-100 p-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'chat'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-ai-chat"
        >
          <Sparkles className="h-4 w-4" />
          AI Financial Advisor
        </button>
        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'gmail'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-100'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-gmail-sync"
        >
          <Mail className="h-4 w-4" />
          Gmail Transaction Sync
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-700 border border-slate-100 shadow-xs rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* AI Action Proposal */}
                  {msg.actionProposal && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs uppercase tracking-wide">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        AI Financial Action Draft
                      </div>
                      <div className="text-sm text-slate-700 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100 font-mono text-xs">
                        <div><span className="text-slate-400">Action:</span> {msg.actionProposal.action}</div>
                        {Object.entries(msg.actionProposal.extractedData).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-slate-400">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.actionProposal!.action, msg.actionProposal!.extractedData)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Check className="h-3 w-3" /> Approve & Save
                        </button>
                        <button
                          onClick={() => {
                            setMessages((prev) =>
                              prev.map((m) =>
                                m.id === msg.id ? { ...m, actionProposal: undefined, text: m.text + ' (Action proposal cancelled)' } : m
                              )
                            );
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-4 text-sm text-slate-400 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                  Analyzing finances & formulating response...
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. Spent 450 on lunch today or Show net worth"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </>
      ) : (
        /* Gmail Sync tab */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          {/* Sub-tabs header */}
          <div className="flex border-b border-slate-100 bg-white p-1 gap-1">
            <button
              onClick={() => setGmailSubTab('auto')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                gmailSubTab === 'auto'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Google Inbox / Demo Scan
            </button>
            <button
              onClick={() => setGmailSubTab('paste')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                gmailSubTab === 'paste'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Paste Alert or Statement
            </button>
          </div>

          {gmailSubTab === 'auto' ? (
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Scan Bank Alerts from Gmail</h3>
                  <p className="text-[11px] text-slate-500">Retrieves transaction emails, parses them with AI, and creates ready-to-log drafts.</p>
                </div>
                {googleLinked && (
                  <button
                    onClick={handleSyncGmail}
                    disabled={syncingGmail}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncingGmail ? 'animate-spin' : ''}`} />
                    {syncingGmail ? 'Scanning...' : 'Scan Gmail'}
                  </button>
                )}
              </div>

              {!googleLinked && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-left">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Gmail API Authorization Required
                    </div>
                    <p className="text-[10px] text-slate-500">Link your Google Account in the settings configuration panel to sync actual emails. Or, click below to try our Offline Simulator!</p>
                  </div>
                  <button
                    onClick={handleLoadDemoEmails}
                    disabled={syncingGmail}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shrink-0 border border-indigo-200/50"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncingGmail ? 'animate-spin' : ''}`} />
                    {syncingGmail ? 'Simulating...' : 'Try Demo Alerts'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleParseManualSnippet} className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Paste Bank SMS or Statement</h3>
                <p className="text-[11px] text-slate-500">Paste any transaction SMS, receipt snippet, or statement line. Our AI will instantly parse it.</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={manualSnippet}
                    onChange={(e) => setManualSnippet(e.target.value)}
                    placeholder="e.g. Your Credit Card xx4321 was swiped for ₹1,299 at Netflix on 2026-06-25."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    required
                  />
                </div>
                <div className="w-28 shrink-0 flex flex-col justify-between gap-1">
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isParsingManual || !manualSnippet.trim()}
                    className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    {isParsingManual ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI Parse
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Consolidated Draft List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {gmailDrafts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Mail className="h-10 w-10 text-slate-300 mb-2" />
                {syncingGmail ? (
                  <p className="text-sm">AI extracting information from alerts...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">No imported drafts queue</p>
                    <p className="text-xs max-w-xs mt-1">Scan your Google inbox, load demo alerts, or paste statement strings above to create transaction proposals.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parsed Proposals Queue ({gmailDrafts.length})</span>
                  <button
                    onClick={() => setGmailDrafts([])}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600"
                  >
                    Clear All
                  </button>
                </div>

                {gmailDrafts.map((draft) => (
                  <div key={draft.id} className="bg-white border border-slate-100 shadow-xs rounded-xl p-3.5 space-y-3 flex flex-col transition-all hover:border-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">{draft.date}</div>
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg mt-1 select-none italic">
                          "{draft.snippet}"
                        </div>
                      </div>
                    </div>

                    {draft.parsed && draft.parsed.amount > 0 ? (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            draft.parsed.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {draft.parsed.type}
                          </span>
                          <div className="font-bold text-xs text-slate-800 mt-1 truncate">
                            {draft.parsed.description}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {draft.parsed.category} &bull; {draft.parsed.subCategory || 'UPI'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            ₹{Number(draft.parsed.amount).toLocaleString('en-IN')}
                          </div>
                          <button
                            onClick={() => handleAddGmailDraft(draft.id, draft.parsed, draft.date)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md mt-2 flex items-center gap-1 transition-all ml-auto cursor-pointer"
                          >
                            <Check className="h-3 w-3" /> Log Draft
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">
                        No financial transaction parsed in this snippet. Make sure it has a clear amount.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
