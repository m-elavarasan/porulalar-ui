import { apiClient } from '../lib/apiClient';

let activeSchedulerPromise: Promise<any> | null = null;
let lastRunTime = 0;

export const schedulerService = {
  runScheduler: async (userId?: string): Promise<any> => {
    const now = Date.now();
    if (now - lastRunTime < 300000) {
      return { status: 'skipped', reason: 'throttled' };
    }
    if (activeSchedulerPromise) return activeSchedulerPromise;

    activeSchedulerPromise = (async () => {
      try {
        const res = await apiClient.post('/api/scheduler/run', { userId });
        lastRunTime = Date.now();
        return res;
      } finally {
        activeSchedulerPromise = null;
      }
    })();

    return activeSchedulerPromise;
  }
};
