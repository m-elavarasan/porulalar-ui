import { apiClient } from '../lib/apiClient';

export interface CascadeResult {
  expenseCreated?: boolean;
  bankBalanceUpdate?: boolean;
  entityUpdated?: boolean;
  amountDeducted?: number;
  bankName?: string;
  message: string;
}

export interface UpcomingPayment {
  id: string;
  type: 'EMI' | 'Loan' | 'Chit' | 'CreditCard';
  name: string;
  amount: number;
  dueDate: string;
  autoPay: boolean;
  autoPayBank?: string;
  status: string;
}

export interface LoanComputeResult {
  emiAmount: number;
  totalInterestPayable: number;
  totalAmountPayable: number;
  loanEndDate: string;
  principalOutstanding: number;
  remainingEMIs: number;
  nextDueDate: string;
}

export interface ChitComputeResult {
  monthlyContribution: number;
  endDate: string;
  installmentsRemaining: number;
  expectedPayout: number;
  nextDueDate: string;
}

export interface EMIComputeResult {
  emiAmount: number;
  nextDueDate: string;
}

export const smartService = {
  // One-click payment actions
  payEMI: (emiId: string, bankId?: string) =>
    apiClient.post<CascadeResult>(`/api/smart/pay-emi/${emiId}`, { bankId }),

  payLoan: (loanId: string, bankId?: string) =>
    apiClient.post<CascadeResult>(`/api/smart/pay-loan/${loanId}`, { bankId }),

  payChit: (chitId: string, bankId?: string) =>
    apiClient.post<CascadeResult>(`/api/smart/pay-chit/${chitId}`, { bankId }),

  payCard: (cardId: string, bankId?: string, payFull = true) =>
    apiClient.post<CascadeResult>(`/api/smart/pay-card/${cardId}`, { bankId, payFull }),

  // Auto-compute previews
  computeLoan: (borrowedAmount: number, interestRate: number, tenureMonths: number, loanStartDate?: string) =>
    apiClient.post<LoanComputeResult>('/api/smart/compute-loan', {
      borrowedAmount, interestRate, tenureMonths, loanStartDate: loanStartDate || new Date().toISOString().split('T')[0],
    }),

  computeChit: (totalChitValue: number, numberOfMembers: number, totalTenureMonths: number, startDate?: string) =>
    apiClient.post<ChitComputeResult>('/api/smart/compute-chit', {
      totalChitValue, numberOfMembers, totalTenureMonths, startDate: startDate || new Date().toISOString().split('T')[0],
    }),

  computeEMI: (totalAmount: number, totalEMIs: number, startDate?: string) =>
    apiClient.post<EMIComputeResult>('/api/smart/compute-emi', {
      totalAmount, totalEMIs, startDate: startDate || new Date().toISOString().split('T')[0],
    }),

  // Category auto-detect
  suggestCategory: async (description: string): Promise<string> => {
    const result = await apiClient.get<{ category: string }>(`/api/smart/suggest-category?description=${encodeURIComponent(description)}`);
    return result.category;
  },

  // Upcoming payments timeline
  getUpcomingPayments: () =>
    apiClient.get<UpcomingPayment[]>('/api/smart/upcoming-payments'),
};
