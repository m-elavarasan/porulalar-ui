import { apiClient } from '../lib/apiClient';

export const bankService = {
  createAAConsent: async (bankName: string, phoneNumber: string): Promise<any> => {
    return apiClient.post('/api/integrations/aa/consent', { bankName, phoneNumber });
  },

  fetchAAData: async (consentId: string, bankName: string): Promise<any> => {
    return apiClient.post('/api/integrations/aa/fetch', { consentId, bankName });
  },

  searchMutualFunds: async (query: string): Promise<any> => {
    return apiClient.get(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
  },

  fetchMFDetails: async (schemeCode: string): Promise<any> => {
    return apiClient.get(`https://api.mfapi.in/mf/${schemeCode}`);
  },

  fetchExternalUrlProxy: async (url: string): Promise<any> => {
    return apiClient.get(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
  }
};
