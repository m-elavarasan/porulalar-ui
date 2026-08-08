import { apiClient } from '../lib/apiClient';
import {
  MonthlyCashFlowSummary,
  DecisionRecommendation,
  ChitLoanComparisonResult,
  LoanPrepaymentResult,
  SIPGrowthResult
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
  getCashFlowSummary: async (): Promise<MonthlyCashFlowSummary> => {
    return apiClient.get<MonthlyCashFlowSummary>('/api/cashflow/summary');
  },

  getDecisionEngineRecommendations: async (): Promise<DecisionEngineResponse> => {
    return apiClient.get<DecisionEngineResponse>('/api/analytics/decision-engine');
  },

  getChitIntelligence: async (chitId: string): Promise<ChitIntelligenceResponse> => {
    return apiClient.get<ChitIntelligenceResponse>(`/api/chits/${chitId}/intelligence`);
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

  onboardGmail: async (payload: {
    selectedBanks: string[];
    selectedCards: string[];
    selectedLoans: string[];
    targetEmail: string;
  }): Promise<any> => {
    return apiClient.post('/api/gmail/onboard', payload);
  }
};
