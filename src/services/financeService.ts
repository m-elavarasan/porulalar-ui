import { apiClient } from '../lib/apiClient';

export interface BudgetAlertItem {
  category: string;
  allocatedBudget: number;
  spentAmount: number;
  percentageSpent: number;
  status: 'OK' | 'WARNING' | 'EXCEEDED';
  message: string;
}

export interface CardOptimizerItem {
  cardId: string;
  cardName: string;
  bankName: string;
  billingCycleDate: number;
  remainingGraceDays: number;
  creditLimit: number;
  availableCredit: number;
  isRecommendedChoice: boolean;
  recommendationReason: string;
}

export interface ParsedStatementItem {
  date: string;
  description: string;
  amount: number;
  type: 'Expense' | 'Income';
  category: string;
}

export const financeService = {
  getBudgetAlerts: async (): Promise<BudgetAlertItem[]> => {
    const res: any = await apiClient.get('/api/budgets/alerts');
    return res?.data || res || [];
  },

  getCardOptimizer: async (): Promise<CardOptimizerItem[]> => {
    const res: any = await apiClient.get('/api/cards/optimizer');
    return res?.data || res || [];
  },

  parseStatement: async (content: string, bankId?: string): Promise<ParsedStatementItem[]> => {
    const res: any = await apiClient.post('/api/statements/parse', { content, bankId });
    return res?.data || res || [];
  }
};
