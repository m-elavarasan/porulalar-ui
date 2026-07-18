import Papa from 'papaparse';
import { PDFParse } from 'pdf-parse';

// Configure the worker for browser environments
PDFParse.setWorker('https://cdn.jsdelivr.net/npm/pdf-parse@latest/dist/pdf-parse/web/pdf.worker.mjs');

export interface ParsedLoanData {
  loanName?: string;
  lenderName?: string;
  borrowedAmount?: string;
  interestRate?: string;
  tenureMonths?: string;
  emiAmount?: string;
  monthsAlreadyPaid?: string;
  principalAlreadyPaid?: string;
  startDate?: string;
}

export interface ParsedChitData {
  chitName?: string;
  organizer?: string;
  totalChitValue?: string;
  monthlyContribution?: string;
  totalTenureMonths?: string;
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
}

/**
 * Reads a PDF file, extracts raw text using pdf-parse, and attempts to find Loan Details via Regex.
 */
export async function parseLoanPDF(file: File): Promise<ParsedLoanData> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
  const pdfData = await parser.getText();
  await parser.destroy();
  const fullText = pdfData.text;

  const data: ParsedLoanData = {};

  // Find EMI
  const emiMatch = fullText.match(/(?:emi|installment).*?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
  if (emiMatch) data.emiAmount = emiMatch[1].replace(/,/g, '');

  // Find Loan Amount / Principal
  const principalMatch = fullText.match(/(?:loan amount|principal|sanctioned).*?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
  if (principalMatch) data.borrowedAmount = principalMatch[1].replace(/,/g, '');

  // Find Tenure
  const tenureMatch = fullText.match(/(?:tenure|period|months).*?(\d{2,3})\s*(?:months)?/i);
  if (tenureMatch) data.tenureMonths = tenureMatch[1];

  // Find Interest Rate
  const rateMatch = fullText.match(/(?:interest|rate|roi).*?(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
  if (rateMatch) data.interestRate = rateMatch[1];

  // Bank / Lender Name Guesses
  const bankMatch = fullText.match(/(HDFC|SBI|ICICI|Axis|Bajaj|Kotak|Muthoot|Manappuram|Bank of Baroda|PNB|Canara|IDFC)[a-z\s]*/i);
  if (bankMatch) data.lenderName = bankMatch[0].trim();

  // Date Guesses (DD-MM-YYYY or DD/MM/YYYY)
  const dateMatch = fullText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dateMatch) {
    // Format to YYYY-MM-DD for standard input fields
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    data.startDate = `${year}-${month}-${day}`;
  }

  // Loan Name generic extraction (if 'Loan' is mentioned near the bank)
  const loanNameMatch = fullText.match(/(?:personal|home|auto|car|education|gold)\s+loan/i);
  if (loanNameMatch) {
    data.loanName = loanNameMatch[0].charAt(0).toUpperCase() + loanNameMatch[0].slice(1).toLowerCase();
  } else if (data.lenderName) {
    data.loanName = `${data.lenderName} Loan`;
  }

  return data;
}

/**
 * Reads a CSV file using PapaParse and tries to extract loan details if presented in a key-value tabular format.
 */
export function parseLoanCSV(file: File): Promise<ParsedLoanData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data: ParsedLoanData = {};
        const rows = results.data as string[][];

        rows.forEach(row => {
          const rowStr = row.join(' ').toLowerCase();
          
          if (rowStr.includes('emi') || rowStr.includes('installment')) {
            const num = row.find(cell => !isNaN(Number(cell.replace(/,/g, ''))) && Number(cell.replace(/,/g, '')) > 0);
            if (num) data.emiAmount = num.replace(/,/g, '');
          }
          if (rowStr.includes('loan amount') || rowStr.includes('principal')) {
            const num = row.find(cell => !isNaN(Number(cell.replace(/,/g, ''))) && Number(cell.replace(/,/g, '')) > 0);
            if (num) data.borrowedAmount = num.replace(/,/g, '');
          }
          if (rowStr.includes('tenure') || rowStr.includes('months')) {
            const num = row.find(cell => !isNaN(Number(cell)) && Number(cell) > 0 && Number(cell) <= 360);
            if (num) data.tenureMonths = num;
          }
          if (rowStr.includes('interest') || rowStr.includes('rate')) {
             const num = row.find(cell => !isNaN(parseFloat(cell)) && parseFloat(cell) < 100);
             if (num) data.interestRate = num;
          }
        });

        resolve(data);
      },
      error: reject
    });
  });
}

/**
 * Reads a PDF file and extracts Chit Fund details.
 */
export async function parseChitPDF(file: File): Promise<ParsedChitData> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
  const pdfData = await parser.getText();
  await parser.destroy();
  const fullText = pdfData.text;

  const data: ParsedChitData = {};

  // Find Chit Value
  const chitValueMatch = fullText.match(/(?:chit value|sala|total value).*?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
  if (chitValueMatch) data.totalChitValue = chitValueMatch[1].replace(/,/g, '');

  // Find Monthly Contribution / Subscription
  const monthlyMatch = fullText.match(/(?:subscription|monthly|installment|contribution).*?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?)/i);
  if (monthlyMatch) data.monthlyContribution = monthlyMatch[1].replace(/,/g, '');

  // Find Tenure (Months)
  const tenureMatch = fullText.match(/(?:duration|months|tenure).*?(\d{2,3})\s*(?:months)?/i);
  if (tenureMatch) data.totalTenureMonths = tenureMatch[1];

  // Organizer Name Guesses (e.g., Gokulam, Shriram, Margadarsi, Kapil)
  const orgMatch = fullText.match(/(Shriram|Margadarsi|Kapil|Gokulam|Chits|Chit Funds)[a-z\s]*/i);
  if (orgMatch) data.organizer = orgMatch[0].trim();

  // generic chit name
  if (data.totalChitValue) {
    data.chitName = `${Number(data.totalChitValue)/100000}L Chit`;
  }

  return data;
}

/**
 * Reads a CSV file using PapaParse and tries to extract Chit details.
 */
export function parseChitCSV(file: File): Promise<ParsedChitData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data: ParsedChitData = {};
        const rows = results.data as string[][];

        rows.forEach(row => {
          const rowStr = row.join(' ').toLowerCase();
          
          if (rowStr.includes('chit value') || rowStr.includes('total value')) {
            const num = row.find(cell => !isNaN(Number(cell.replace(/,/g, ''))) && Number(cell.replace(/,/g, '')) > 0);
            if (num) data.totalChitValue = num.replace(/,/g, '');
          }
          if (rowStr.includes('subscription') || rowStr.includes('monthly') || rowStr.includes('contribution')) {
            const num = row.find(cell => !isNaN(Number(cell.replace(/,/g, ''))) && Number(cell.replace(/,/g, '')) > 0);
            if (num) data.monthlyContribution = num.replace(/,/g, '');
          }
          if (rowStr.includes('duration') || rowStr.includes('months') || rowStr.includes('tenure')) {
            const num = row.find(cell => !isNaN(Number(cell)) && Number(cell) > 0 && Number(cell) <= 360);
            if (num) data.totalTenureMonths = num;
          }
        });

        resolve(data);
      },
      error: reject
    });
  });
}

/**
 * Extracts a list of past transactions from a PDF. 
 * Looks for lines containing a date and an amount.
 */
export async function parseTransactionsPDF(file: File): Promise<ParsedTransaction[]> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
  const pdfData = await parser.getText();
  await parser.destroy();
  const lines = pdfData.text.split('\n');

  const transactions: ParsedTransaction[] = [];
  
  // Date: DD-MM-YYYY, DD/MM/YYYY, DD-MMM-YYYY, DD MMM YYYY, etc.
  const dateRegex = /\b(\d{1,2})[\/\- ]([a-zA-Z]{3,9}|\d{1,2})[\/\- ](\d{2,4})\b/;

  for (const line of lines) {
    // User requested "Only use Debit" - skip common Credit / Receipt keywords in statements
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('receipt') || 
      lowerLine.includes('payment') || 
      lowerLine.match(/\bcr\b/) || 
      lowerLine.match(/\bcredit\b/)
    ) {
      continue;
    }

    const dMatch = line.match(dateRegex);
    if (dMatch) {
      // Clean up date parts
      let year = dMatch[3];
      if (year.length === 2) year = `20${year}`;
      let month = dMatch[2];
      
      // Convert text month to number if needed
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const mIndex = monthNames.findIndex(m => month.toLowerCase().startsWith(m));
      if (mIndex !== -1) {
        month = (mIndex + 1).toString();
      }
      month = month.padStart(2, '0');
      const day = dMatch[1].padStart(2, '0');
      
      // Find all numbers in the line that could be amounts (ignore the date part by removing it first)
      const lineWithoutDate = line.replace(dMatch[0], '');
      const potentialAmounts = [...lineWithoutDate.matchAll(/([\d,]+(?:\.\d{1,2})?)/g)]
        .map(m => Number(m[1].replace(/,/g, '')))
        .filter(n => !isNaN(n) && n > 0 && n !== Number(year)); // Filter out zeroes and stray years

      if (potentialAmounts.length > 0) {
        // We'll pick the first significant number > 100, or just the first number
        const amt = potentialAmounts.find(n => n > 100) || potentialAmounts[0];
        
        transactions.push({
          date: `${year}-${month}-${day}`,
          amount: amt,
          description: line.substring(0, 70).trim().replace(dMatch[0], '').trim(), 
        });
      }
    }
  }

  return transactions;
}

/**
 * Extracts a list of past transactions from a CSV.
 */
export function parseTransactionsCSV(file: File): Promise<ParsedTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const transactions: ParsedTransaction[] = [];
        const rows = results.data as string[][];

        const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;

        rows.forEach(row => {
          let dateStr = '';
          let amount = 0;
          let description = '';

          row.forEach(cell => {
            const trimmed = cell.trim();
            const dMatch = trimmed.match(dateRegex);
            if (dMatch && !dateStr) {
              const year = dMatch[3].length === 2 ? `20${dMatch[3]}` : dMatch[3];
              const month = dMatch[2].padStart(2, '0');
              const day = dMatch[1].padStart(2, '0');
              dateStr = `${year}-${month}-${day}`;
            } else if (!isNaN(Number(trimmed.replace(/,/g, ''))) && Number(trimmed.replace(/,/g, '')) > 0 && !amount) {
              amount = Number(trimmed.replace(/,/g, ''));
            } else if (trimmed && !description && !dMatch && isNaN(Number(trimmed.replace(/,/g, '')))) {
              description = trimmed;
            }
          });

          if (dateStr && amount > 0) {
            transactions.push({
              date: dateStr,
              amount,
              description: description || 'Imported Transaction'
            });
          }
        });

        resolve(transactions);
      },
      error: reject
    });
  });
}
