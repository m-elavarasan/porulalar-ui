import { apiClient } from '../lib/apiClient';

export interface GmailDraft {
  id: string;
  snippet: string;
  date: string;
  parsed?: {
    type: 'expense' | 'income';
    amount: number;
    category: string;
    subCategory: string;
    description: string;
    sourceOrSub?: string;
  };
}

export const googleService = {
  getStatus: async (): Promise<{ linked: boolean; email?: string }> => {
    return apiClient.get('/api/google/status');
  },

  disconnect: async (userId: string): Promise<any> => {
    return apiClient.post('/api/google/disconnect', { userId });
  },

  createCalendarReminder: async (
    token: string,
    title: string,
    description: string,
    dateStr: string
  ): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      const event = {
        summary: title,
        description: description,
        start: { date: dateStr },
        end: { date: dateStr },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 * 7 },
            { method: 'popup', minutes: 24 * 60 * 3 },
            { method: 'popup', minutes: 24 * 60 * 1 },
            { method: 'popup', minutes: 9 * 60 },
          ],
        },
      };
      const res = await apiClient.post<any>('/api/create-calendar-reminder', event, {
        'Authorization': `Bearer ${token}`
      });
      return { success: true, eventId: res.id };
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  },

  fetchGmailTransactions: async (token: string): Promise<GmailDraft[]> => {
    try {
      const query = encodeURIComponent("category:updates (payment OR spent OR paid OR debited OR credited OR received OR transfer)");
      const listData = await apiClient.get<any>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=5`,
        { 'Authorization': `Bearer ${token}` }
      );

      if (!listData.messages || listData.messages.length === 0) {
        return [];
      }

      const drafts: GmailDraft[] = [];
      for (const msg of listData.messages) {
        try {
          const msgData = await apiClient.get<any>(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { 'Authorization': `Bearer ${token}` }
          );
          
          const dateHeader = msgData.payload?.headers?.find((h: any) => h.name === 'Date');
          let emailDate = new Date().toISOString().split('T')[0];
          if (dateHeader) {
            emailDate = new Date(dateHeader.value).toISOString().split('T')[0];
          }

          drafts.push({
            id: msgData.id,
            snippet: msgData.snippet || '',
            date: emailDate,
          });
        } catch (e) {
          console.error(`Error fetching Gmail message ${msg.id}:`, e);
        }
      }

      return drafts;
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      return [];
    }
  },

  fetchGmailMessagesBackend: async (userId: string, query?: string): Promise<any> => {
    return apiClient.post('/api/fetch-gmail-messages', { userId, query });
  },

  parseGmailMessagesBackend: async (userId: string, options: { messages?: any[]; fileUrl?: string; rawText?: string }): Promise<any> => {
    return apiClient.post('/api/parse-gmail-messages', { userId, ...options });
  }
};
