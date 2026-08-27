import React, { useState } from 'react';
import {
  ExpensesPage,
  IncomePage,
  BanksPage,
  CardsPage,
  LoansPage,
  EMIsPage,
  ChitsPage,
  AssetsGoalsPage,
  BorrowsPage,
  RecurringPage
} from './index';
import { Database, Wallet, CreditCard, Receipt, Building2, PiggyBank, Target, Repeat, Handshake } from 'lucide-react';

export const DataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'banks' | 'cards' | 'expenses' | 'income' | 'loans' | 'emis' | 'chits' | 'assets' | 'borrows' | 'recurring'>('banks');

  const tabs = [
    { id: 'banks', label: 'Banks', icon: Building2 },
    { id: 'cards', label: 'Credit Cards', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'income', label: 'Income', icon: Wallet },
    { id: 'loans', label: 'Loans', icon: Handshake },
    { id: 'emis', label: 'EMIs', icon: Repeat },
    { id: 'chits', label: 'Chits', icon: PiggyBank },
    { id: 'assets', label: 'Assets & Goals', icon: Target },
    { id: 'borrows', label: 'Borrows', icon: Handshake },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">LEDGER & ACCOUNTS</span>
        <h1 className="text-3xl font-extrabold font-crowz-header text-slate-900">DATA COMMAND & ACCOUNTS</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-saas ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        {activeTab === 'banks' && <BanksPage />}
        {activeTab === 'cards' && <CardsPage />}
        {activeTab === 'expenses' && <ExpensesPage />}
        {activeTab === 'income' && <IncomePage />}
        {activeTab === 'loans' && <LoansPage />}
        {activeTab === 'emis' && <EMIsPage />}
        {activeTab === 'chits' && <ChitsPage />}
        {activeTab === 'assets' && <AssetsGoalsPage />}
        {activeTab === 'borrows' && <BorrowsPage />}
        {activeTab === 'recurring' && <RecurringPage />}
      </div>
    </div>
  );
};
