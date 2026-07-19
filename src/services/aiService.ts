import { apiClient } from '../lib/apiClient';

export interface ChatResponse {
  response: string;
  action?: string;
  extractedData?: any;
}

export const aiService = {
  sendMessage: async (message: string, context: any): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>('/api/chat', { message, context });
  }
};
