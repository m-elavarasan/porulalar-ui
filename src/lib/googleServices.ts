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

/**
 * Creates a Google Calendar event for a financial due date
 * with specific reminder overrides: 7 days, 3 days, 1 day, and due date.
 */
export async function createCalendarReminder(
  token: string,
  title: string,
  description: string,
  dateStr: string // YYYY-MM-DD
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const event = {
      summary: title,
      description: description,
      start: {
        date: dateStr,
      },
      end: {
        date: dateStr, // All day event
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 * 7 }, // 7 days before
          { method: 'popup', minutes: 24 * 60 * 3 }, // 3 days before
          { method: 'popup', minutes: 24 * 60 * 1 }, // 1 day before
          { method: 'popup', minutes: 9 * 60 },      // 9 AM on the day of the event
        ],
      },
    };

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const response = await fetch(`${apiBase}/api/create-calendar-reminder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to create calendar event');
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Fetches recent financial transaction emails from the user's Gmail inbox
 */
export async function fetchGmailTransactions(token: string): Promise<GmailDraft[]> {
  try {
    // 1. Search for recent transaction-like emails
    const query = encodeURIComponent("category:updates (payment OR spent OR paid OR debited OR credited OR received OR transfer)");
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!listRes.ok) {
      console.error('Failed to fetch Gmail message list:', await listRes.text());
      return [];
    }

    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // 2. Fetch full details for each message
    const drafts: GmailDraft[] = [];
    for (const msg of listData.messages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        
        // Find Date header
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
      }
    }

    return drafts;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}
