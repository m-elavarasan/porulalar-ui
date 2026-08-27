import {
  CFOOverviewResponse,
  CFOInsightItem,
  ScenarioInputVariables,
  ScenarioOutputResult,
  CFOSummaryResponse,
  CFOAdviceItem,
  ChitSimRequest,
  ChitSimResult,
  ChitCompareRequest,
  ChitCompareResult,
  ChitLoanStrategyRequest,
  ChitLoanStrategyResult,
  LandSimRequest,
  LandSimResult,
  AffordabilityRequest,
  AffordabilityResult,
  MultiOptionCompareRequest,
  MultiOptionCompareResult
} from '../types';
import { apiClient } from '../lib/apiClient';

export const cfoService = {
  getCFOOverview: async (): Promise<CFOOverviewResponse> => {
    return apiClient.get<CFOOverviewResponse>('/api/cfo/overview');
  },

  getCFOInsights: async (): Promise<CFOInsightItem[]> => {
    return apiClient.get<CFOInsightItem[]>('/api/cfo/insights');
  },

  runScenarioSimulation: async (input: ScenarioInputVariables): Promise<ScenarioOutputResult> => {
    return apiClient.post<ScenarioOutputResult>('/api/scenarios/run', input);
  },

  getCFOSummary: async (): Promise<CFOSummaryResponse> => {
    return apiClient.get<CFOSummaryResponse>('/api/cfo/summary');
  },

  getAdviceList: async (): Promise<CFOAdviceItem[]> => {
    return apiClient.get<CFOAdviceItem[]>('/api/advice');
  },

  simulateLoanPrepayment: async (input: any) => {
    return apiClient.post('/api/simulator/loan', input);
  },

  simulateChit: async (input: ChitSimRequest): Promise<ChitSimResult> => {
    return apiClient.post<ChitSimResult>('/api/simulator/chit', input);
  },

  compareChits: async (input: ChitCompareRequest): Promise<ChitCompareResult> => {
    return apiClient.post<ChitCompareResult>('/api/chits/compare', input);
  },

  simulateChitLoanStrategy: async (input: ChitLoanStrategyRequest): Promise<ChitLoanStrategyResult> => {
    return apiClient.post<ChitLoanStrategyResult>('/api/simulator/chit-loan-strategy', input);
  },

  simulateInvestment: async (input: any) => {
    return apiClient.post('/api/simulator/investment', input);
  },

  simulateLand: async (input: LandSimRequest): Promise<LandSimResult> => {
    return apiClient.post<LandSimResult>('/api/simulator/land', input);
  },

  evaluateAffordability: async (input: AffordabilityRequest): Promise<AffordabilityResult> => {
    return apiClient.post<AffordabilityResult>('/api/simulator/affordability', input);
  },

  compareMultiOptions: async (input: MultiOptionCompareRequest): Promise<MultiOptionCompareResult> => {
    return apiClient.post<MultiOptionCompareResult>('/api/simulator/compare', input);
  },
};

