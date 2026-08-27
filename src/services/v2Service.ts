import { apiClient } from '../lib/apiClient';
import {
  MonthlyCashFlowSummary,
  DecisionRecommendation,
  ChitLoanComparisonResult,
  LoanPrepaymentResult,
  SIPGrowthResult,
  WealthOverviewData,
  Recommendation,
  GoalProjectionSummary,
  DebtVsInvestResult,
  PurchaseAffordabilityResult,
  IncomeChangeResult
} from '../types';

export interface DecisionEngineResponse {
  summary: MonthlyCashFlowSummary;
  recommendations: DecisionRecommendation[];
}

export interface ChitIntelligenceResponse {
  chitId: string;
  chitName: string;
  comparisons: ChitLoanComparisonResult[];
}

export const v2Service = {
  // ─── Unified Wealth Decision Engine Endpoints ──────────────────────────────
  getWealthOverview: async (): Promise<WealthOverviewData> => {
    return apiClient.get<WealthOverviewData>('/api/wealth/overview');
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    return apiClient.get<Recommendation[]>('/api/wealth/recommendations');
  },

  updateRecommendationStatus: async (id: string, status: string): Promise<any> => {
    return apiClient.put(`/api/wealth/recommendations/${id}/status`, { status });
  },

  getGoalProjections: async (): Promise<GoalProjectionSummary> => {
    return apiClient.get<GoalProjectionSummary>('/api/wealth/goals/projection');
  },

  // ─── Interactive Multi-Scenario Decision Simulators ────────────────────────
  runDebtVsInvestSimulator: async (payload: {
    surplusAmount: number;
    loanInterestRate: number;
    loanPrincipalLeft: number;
    remainingTenureYears: number;
    expectedReturnRate?: number;
  }): Promise<DebtVsInvestResult> => {
    return apiClient.post<DebtVsInvestResult>('/api/simulators/run', {
      type: 'DEBT_VS_INVEST',
      debtVsInvest: payload
    });
  },

  runPurchaseAffordabilitySimulator: async (payload: {
    itemName: string;
    totalCost: number;
    downPayment: number;
    proposedTenureMonths: number;
    estimatedInterestRate: number;
    currentLiquidCash: number;
    monthlyFreeCashFlow: number;
    emergencyBufferReq: number;
  }): Promise<PurchaseAffordabilityResult> => {
    return apiClient.post<PurchaseAffordabilityResult>('/api/simulators/run', {
      type: 'PURCHASE_AFFORDABILITY',
      purchaseAffordability: payload
    });
  },

  runIncomeChangeSimulator: async (payload: {
    currentMonthlyIncome: number;
    newMonthlyIncome: number;
    investAllocationPct: number;
  }): Promise<IncomeChangeResult> => {
    return apiClient.post<IncomeChangeResult>('/api/simulators/run', {
      type: 'INCOME_CHANGE',
      incomeChange: payload
    });
  },

  runLoanPrepaymentSimulator: async (payload: {
    principalOutstanding: number;
    interestRate: number;
    remainingTenureMonths: number;
    emiAmount: number;
    prepaymentAmount: number;
    prepaymentType: 'REDUCE_TENURE' | 'REDUCE_EMI';
  }): Promise<LoanPrepaymentResult> => {
    return apiClient.post<LoanPrepaymentResult>('/api/simulators/run', {
      type: 'LOAN_PREPAYMENT',
      loanPrepayment: payload
    });
  },

  runSIPGrowthSimulator: async (payload: {
    monthlyInvestment: number;
    expectedReturnRate: number;
    durationYears: number;
    stepUpPercentage: number;
  }): Promise<SIPGrowthResult> => {
    return apiClient.post<SIPGrowthResult>('/api/simulators/run', {
      type: 'SIP_GROWTH',
      sipGrowth: payload
    });
  },

  // ─── Legacy & Supporting Endpoints ─────────────────────────────────────────
  getCashFlowSummary: async (): Promise<MonthlyCashFlowSummary> => {
    return apiClient.get<MonthlyCashFlowSummary>('/api/cashflow/summary');
  },

  getDecisionEngineRecommendations: async (): Promise<DecisionEngineResponse> => {
    return apiClient.get<DecisionEngineResponse>('/api/analytics/decision-engine');
  },

  getChitIntelligence: async (chitId: string): Promise<ChitIntelligenceResponse> => {
    return apiClient.get<ChitIntelligenceResponse>(`/api/chits/${chitId}/intelligence`);
  },

  onboardGmail: async (payload: {
    selectedBanks: string[];
    selectedCards: string[];
    selectedLoans: string[];
    targetEmail: string;
  }): Promise<any> => {
    return apiClient.post('/api/gmail/onboard', payload);
  }
};
