import { apiClient } from '../lib/apiClient';

export const analyticsService = {
  calculateXIRR: async (investments: any[]): Promise<any> => {
    return apiClient.post('/api/analytics/xirr', { investments });
  },

  getXIRRs: async (): Promise<any> => {
    return apiClient.get('/api/analytics/xirr');
  },

  getAssetAllocation: async (params: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams(params);
    return apiClient.get(`/api/analytics/asset-allocation?${query.toString()}`);
  },

  estimateTax: async (payload: { grossIncome: number; deductions80C: number; deductions80D: number; otherDeductions: number }): Promise<any> => {
    return apiClient.post('/api/analytics/tax-estimator', payload);
  },

  getFinancialHealth: async (): Promise<any> => {
    return apiClient.get('/api/analytics/financial-health');
  }
};
