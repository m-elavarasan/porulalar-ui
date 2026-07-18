export interface Expense {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  category: string;
  subCategory: string;
  amount: number;
  paymentMethod: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  source: string;
  amount: number;
  description: string;
  recurring: boolean;
  linkedBankId?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  loanName: string;
  loanType: string;
  lenderName: string;
  borrowedAmount: number;
  interestRate: number; // percentage (e.g., 8.5)
  loanStartDate: string; // YYYY-MM-DD
  loanEndDate: string; // YYYY-MM-DD
  tenureMonths: number;
  emiAmount: number;
  totalInterestPayable: number;
  totalAmountPayable: number;
  amountPaidTillDate: number;
  principalOutstanding: number;
  remainingEMIs: number;
  nextDueDate: string; // YYYY-MM-DD
  prepayments: number;
  status: 'Active' | 'Closed';
  notes: string;
  processingFee?: number;
  autoPay?: boolean;
  autoPaySourceId?: string;
  createdAt: string;
}

export interface Chit {
  id: string;
  userId: string;
  chitName: string;
  organizer: string;
  totalChitValue: number;
  numberOfMembers: number;
  monthlyContribution: number;
  totalTenureMonths: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  amountPaidTillDate: number;
  installmentsPaid: number;
  installmentsRemaining: number;
  prizeTaken: boolean;
  prizeAmountReceived: number;
  prizeTakenMonth: number;
  discountReceived: number;
  expectedProfit: number;
  nextDueDate: string; // YYYY-MM-DD
  status: 'Active' | 'Completed';
  notes: string;
  createdAt: string;
  isShared?: boolean;
  sharePartnerName?: string;
  mySharePercentage?: number;
  prizeTakenDate?: string;
  autoPay?: boolean;
  autoPaySourceId?: string;
  gapMonths?: number;
}

export interface ChitTransaction {
  id: string;
  chitId: string;
  transactionDate: string; // YYYY-MM-DD
  amount: number;
  type: 'Installment Paid' | 'Prize Received' | 'Bonus' | 'Adjustment';
}

export interface Investment {
  id: string;
  userId: string;
  investmentType: string; // Mutual Fund, Stocks, Gold, FD, RD, PPF, NPS, etc.
  investmentName: string;
  platform: string;
  investedAmount: number;
  currentValue: number;
  monthlyContribution: number;
  startDate: string; // YYYY-MM-DD
  lastUpdated: string; // YYYY-MM-DD
  gainLoss: number;
  returnPercentage: number;
  notes: string;
  isLiveTracked?: boolean;
  units?: number;
  schemeCode?: string;
  tickerSymbol?: string;
  isRecurringSip?: boolean;
  sipDate?: string;
  autoPay?: boolean;
  autoPaySourceId?: string;
}

export interface Asset {
  id: string;
  userId: string;
  assetName: string;
  assetType: string; // Agricultural Land, House, Gold, Vehicle, Bank Balance, Cash, etc.
  purchaseDate: string; // YYYY-MM-DD
  purchaseValue: number;
  currentEstimatedValue: number;
  appreciation: number;
  notes: string;
}

export interface Goal {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  progress: number; // percentage (e.g., 45)
  notes: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: number; // 1-12
  year: number; // YYYY
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  schedule: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string; // Category for expense, Source for income
  sourceOrSubCategory: string; // Sub-category for expense
  description: string;
  nextDueDate: string; // YYYY-MM-DD
  lastProcessedDate: string | null; // YYYY-MM-DD
  active: boolean;
}

export interface NetWorthSnapshot {
  id: string;
  userId: string;
  monthYear: string; // YYYY-MM
  assetsValue: number;
  investmentsValue: number;
  liabilitiesValue: number;
  netWorth: number;
  createdAt: string;
}


export interface Bank {
  id: string;
  userId: string;
  bankName: string;
  accountType: string;
  accountNumber?: string;
  currentBalance: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Card {
  id: string;
  userId: string;
  cardName: string;
  cardType: 'Credit' | 'Debit';
  cardNumber: string; // Last 4 digits
  expiryDate: string; // MM/YY
  bankName: string;
  creditLimit?: number; // For credit cards
  currentOutstanding?: number; // For credit cards
  statementBalance?: number; // Generated bill amount
  statementDate?: string; // Day of month (1-31)
  dueDate?: string; // Full date YYYY-MM-DD or day of month
  status: 'Active' | 'Blocked' | 'Closed';
  autoPay?: boolean;
  autoPaySourceId?: string;
  createdAt: string;
}

export interface Borrow {
  id: string;
  userId: string;
  personName: string;
  amount: number;
  amountSettled?: number;
  transactionType: 'Credit' | 'Debit';
  linkedBankId: string;
  date: string;
  status: 'Active' | 'Settled';
  notes?: string;
  createdAt: string;
}

export interface EMI {
  id: string;
  userId: string;
  itemName: string;
  lenderName: string;
  financier?: string;
  emiAmount: number;
  totalAmount?: number;
  totalEMIs?: number;
  totalMonths?: number;
  paidEMIs?: number;
  monthsPaid?: number;
  startDate?: string;
  nextDueDate: string;
  processingFee?: number;
  status: 'Active' | 'Completed';
  autoPay?: boolean;
  autoPaySourceId?: string;
  createdAt: string;
}
