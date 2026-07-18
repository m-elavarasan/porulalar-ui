import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with Server Key
const geminiApiKey = process.env.GEMINI_API_KEY;
const aiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!geminiApiKey });
});

/**
 * AI Natural Language Processing Endpoint
 * Processes chat commands and parses financial transactions from user queries.
 */
app.post('/api/chat', async (req, res) => {
  if (!aiClient) {
    return res.status(500).json({
      error: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your Secrets panel.'
    });
  }

  const { message, context } = req.body;

  try {
    const prompt = `
You are an expert Personal Wealth Management AI assistant.
The user sent a chat message: "${message}".

Here is the current context of the user's finances (all their existing records):
${JSON.stringify(context, null, 2)}

Analyze the user's message and determine if it represents a financial command or action, or a general financial question/request.
Map it to one of the following actions:
1. "create_expense": Creates a simple expense. Extracted fields: amount (number), category (e.g. Food, Fuel, Shopping, etc. - pick best fit), subCategory (string), description (string), date (YYYY-MM-DD, default to today 2026-06-23 if not specified).
2. "create_income": Creates a simple income. Extracted fields: amount (number), source (string), description (string), date (YYYY-MM-DD, default to today 2026-06-23).
3. "pay_emi": Records a loan EMI payment. Extracted fields: amount (number), loanName (to match active loans - match by title), date (YYYY-MM-DD).
4. "pay_chit": Records a chit fund payment. Extracted fields: amount (number), chitName (to match active chits - match by title), date (YYYY-MM-DD).
5. "receive_chit": Records receiving a chit auction prize. Extracted fields: amount (number), prizeAmountReceived (number), chitName (match by title).
6. "create_investment": Records an investment contribution. Extracted fields: amount (number), investmentType (Mutual Fund, Stocks, Gold, etc. - pick best fit), investmentName (string).
7. "chat_response": General greeting, report query (like net worth report, budget alerts, warnings, cash flow projection, smart insights).

Return your response in strict JSON format matching this schema:
{
  "action": "create_expense" | "create_income" | "pay_emi" | "pay_chit" | "receive_chit" | "create_investment" | "chat_response",
  "extractedData": { ... any extracted fields appropriate for the action ... },
  "response": "A friendly, conversational explanation of what you parsed and are doing, or the answer to the user's financial question, including custom calculations or insights."
}

Ensure your response is valid JSON and nothing else. No markdown wraps (no \`\`\`json block), just pure raw JSON string.
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '{}';
    // Strip code blocks if gemini returned them anyway
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (err) {
      console.error('Failed to parse Gemini output as JSON:', text);
      res.json({
        action: 'chat_response',
        extractedData: {},
        response: text
      });
    }
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: error.message || 'Error processing AI chat' });
  }
});

/**
 * Gmail Transaction Email Parser Endpoint
 * Converts email snippets into structured expense or income draft transactions using Gemini.
 */
app.post('/api/parse-gmail-messages', async (req, res) => {
  if (!aiClient) {
    return res.status(500).json({
      error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your secrets.'
    });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages body' });
  }

  try {
    const prompt = `
You are a financial transaction extractor.
For each of the following email messages (snippet + date), parse them to identify if they correspond to a financial transaction (Debit/Spend, Credit/Income, or EMI/Chit Payment).

Messages:
${JSON.stringify(messages, null, 2)}

Return a JSON array of parsed items matching the size of the input messages array.
Each parsed item MUST follow this schema:
{
  "id": "original_message_id",
  "snippet": "original_snippet",
  "date": "original_date",
  "parsed": {
    "type": "expense" | "income",
    "amount": number (extracted amount, or 0 if not found),
    "category": string (Food, Fuel, EMI, Chit, Rent, Shopping, Utilities, Salary, Interest Income, Milk Sales, Farm Income, etc.),
    "subCategory": string (sub-category e.g., Petrol, UPI Spend, Direct Transfer, etc.),
    "description": string (who it was paid to or sourced from),
    "sourceOrSub": string (source or sub-category name)
  }
}

Return ONLY a strict JSON array. No markdown code blocks.
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '[]';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(jsonStr);
      res.json({ drafts: parsed });
    } catch (err) {
      console.error('Failed to parse Gmail extracted JSON:', text);
      res.json({ drafts: [] });
    }
  } catch (error: any) {
    console.error('Gmail parser error:', error);
    res.status(500).json({ error: error.message || 'Error parsing Gmail transactions' });
  }
});

/**
 * Proxy endpoint to fetch Gmail transactions securely from server-side to avoid CORS/Iframe restrictions
 */
app.post('/api/fetch-gmail-messages', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'OAuth token is required' });
  }

  try {
    const query = encodeURIComponent('subject:(spent OR debited OR credited OR UPI OR paid OR transaction) OR "UPI Ref" OR "transaction alert"');
    const listRes = await fetch(
      `https://gmail.googleapis.com/v1/users/me/messages?q=${query}&maxResults=8`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error('Gmail API list error in server proxy:', errText);
      return res.status(listRes.status).json({ error: errText || 'Failed to fetch messages list from Gmail API' });
    }

    const listData = (await listRes.json()) as any;
    if (!listData.messages || listData.messages.length === 0) {
      return res.json({ messages: [] });
    }

    const drafts = [];

    for (const msg of listData.messages) {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (detailRes.ok) {
          const detailData = (await detailRes.json()) as any;
          const snippet = detailData.snippet || '';
          const internalDateMs = parseInt(detailData.internalDate || Date.now().toString());
          const date = new Date(internalDateMs).toISOString().split('T')[0];

          drafts.push({
            id: msg.id,
            snippet,
            date,
          });
        }
      } catch (err) {
        console.error('Error fetching details for message:', msg.id, err);
      }
    }

    res.json({ messages: drafts });
  } catch (error: any) {
    console.error('Proxy Gmail fetch error:', error);
    res.status(500).json({ error: error.message || 'Error proxying Gmail API request' });
  }
});

/**
 * Proxy endpoint to create Google Calendar events securely from server-side to avoid CORS/Iframe restrictions
 */
app.post('/api/create-calendar-reminder', async (req, res) => {
  const { token, title, description, dateStr } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'OAuth token is required' });
  }

  try {
    const event = {
      summary: title,
      description: `${description}\n\nCreated automatically by Porulalar AI.`,
      start: {
        date: dateStr,
      },
      end: {
        date: dateStr,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10080 }, // 7 days before
          { method: 'popup', minutes: 4320 },  // 3 days before
          { method: 'popup', minutes: 1440 },  // 1 day before
          { method: 'popup', minutes: 540 },   // On due date at 9:00 AM
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: errText || 'Failed to create calendar event' });
    }

    const data = (await response.json()) as any;
    res.json({ success: true, eventId: data.id });
  } catch (error: any) {
    console.error('Proxy Calendar event creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error proxying Calendar API request' });
  }
});

// Vite Middleware & Asset Serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
