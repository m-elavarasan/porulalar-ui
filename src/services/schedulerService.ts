import { apiClient } from '../lib/apiClient';

export const schedulerService = {
  runScheduler: async (userId?: string): Promise<any> => {
    return apiClient.post('/api/scheduler/run', { userId });
  }
};
