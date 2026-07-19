import { apiClient } from '../lib/apiClient';

export const dashboardService = {
  getStats: async (): Promise<any> => {
    return apiClient.get('/api/dashboard/stats');
  }
};
