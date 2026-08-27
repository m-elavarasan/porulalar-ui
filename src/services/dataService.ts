import { apiClient } from '../lib/apiClient';

export const dataService = {
  importBackup: async (backupData: any): Promise<any> => {
    return apiClient.post('/api/data/import', backupData);
  },

  purgeUserData: async (): Promise<any> => {
    return apiClient.delete('/api/data/purge');
  },

  seedHumanData: async (): Promise<any> => {
    return apiClient.post('/api/seed/human-data', {});
  }
};
