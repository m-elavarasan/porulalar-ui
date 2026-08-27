import { apiClient } from './apiClient';

const COLLECTION_MAP: Record<string, string> = {
  expenses: 'expenses',
  income: 'income',
  banks: 'banks',
  cards: 'cards',
  loans: 'loans',
  emis: 'emis',
  borrows: 'borrows',
  chits: 'chits',
  investments: 'investments',
  assets: 'assets',
  goals: 'goals',
  budgets: 'budgets',
  recurringTransactions: 'recurring',
  netWorthSnapshots: 'networth',
  customCategories: 'categories',
  bankTransfers: 'bank-transfers',
  chitTransactions: 'chitTransactions',
  chit_transactions: 'chit_transactions',
  emi_transactions: 'emi_transactions',
  loan_transactions: 'loan_transactions',
};


class PorulalarStore {
  private cache: Record<string, any[]> = {};
  private status: Record<string, 'idle' | 'loading' | 'loaded'> = {};
  private lastFetched: Record<string, number> = {};
  private activePromises: Record<string, Promise<any[]>> = {};
  private listeners: Record<string, Set<(data: any[]) => void>> = {};
  private CACHE_TTL_MS = 60000;
  private isBootstrapped = false;
  private bootstrapPromise: Promise<void> | null = null;

  getCache(collectionName: string): any[] {
    return this.cache[collectionName] || [];
  }

  async bootstrap(force = false): Promise<void> {
    if (!force && this.isBootstrapped) return;
    if (this.bootstrapPromise) return this.bootstrapPromise;

    // Mark collections as loading to prevent individual concurrent fetches
    Object.keys(COLLECTION_MAP).forEach((coll) => {
      if (this.status[coll] !== 'loaded') {
        this.status[coll] = 'loading';
      }
    });

    this.bootstrapPromise = (async () => {
      try {
        const res = await apiClient.get<Record<string, any[]>>('/api/bootstrap');
        if (res) {
          Object.entries(res).forEach(([collName, items]) => {
            this.cache[collName] = items || [];
            this.status[collName] = 'loaded';
            this.lastFetched[collName] = Date.now();
            this.notify(collName);
          });
          if (res.categories && !this.cache['customCategories']) {
            this.cache['customCategories'] = res.categories;
            this.status['customCategories'] = 'loaded';
            this.lastFetched['customCategories'] = Date.now();
          }
          this.isBootstrapped = true;
        }
      } catch (err) {
        console.error('Failed to bootstrap store:', err);
        Object.keys(COLLECTION_MAP).forEach((coll) => {
          if (this.status[coll] === 'loading') {
            this.status[coll] = 'idle';
          }
        });
      } finally {
        this.bootstrapPromise = null;
      }
    })();

    return this.bootstrapPromise;
  }

  subscribe(collectionName: string, callback: (data: any[]) => void) {
    if (!this.listeners[collectionName]) {
      this.listeners[collectionName] = new Set();
    }
    this.listeners[collectionName].add(callback);
    
    // Trigger initial callback if loaded, otherwise fetch (which will await bootstrap if active)
    if (this.status[collectionName] === 'loaded' && this.cache[collectionName]) {
      callback(this.cache[collectionName]);
    } else {
      this.fetchCollection(collectionName).then(data => callback(data));
    }

    return () => {
      this.listeners[collectionName].delete(callback);
    };
  }

  private notify(collectionName: string) {
    const data = this.cache[collectionName] || [];
    if (this.listeners[collectionName]) {
      this.listeners[collectionName].forEach(cb => cb(data));
    }
  }

  async fetchCollection(collectionName: string, forceRefresh = false): Promise<any[]> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) return [];

    const now = Date.now();
    if (!forceRefresh && this.status[collectionName] === 'loaded' && (now - (this.lastFetched[collectionName] || 0) < this.CACHE_TTL_MS)) {
      return this.cache[collectionName];
    }

    if (!forceRefresh && this.bootstrapPromise) {
      await this.bootstrapPromise;
      if (this.status[collectionName] === 'loaded') {
        return this.cache[collectionName] || [];
      }
    }

    if (this.status[collectionName] === 'loading' && this.activePromises[collectionName]) {
      return this.activePromises[collectionName];
    }

    this.status[collectionName] = 'loading';
    this.activePromises[collectionName] = (async () => {
      try {
        const data = await apiClient.get<any[]>(`/api/${path}`);
        this.cache[collectionName] = data;
        this.status[collectionName] = 'loaded';
        this.lastFetched[collectionName] = Date.now();
        this.notify(collectionName);
        return data;
      } catch (err) {
        console.error(`Store error fetching ${collectionName}:`, err);
        this.status[collectionName] = 'idle';
        return this.cache[collectionName] || [];
      } finally {
        delete this.activePromises[collectionName];
      }
    })();

    return this.activePromises[collectionName];
  }

  async fetchCollectionPaginated(
    collectionName: string,
    page: number,
    limit: number,
    filters: Record<string, string> = {}
  ): Promise<{ items: any[]; total: number }> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) return { items: [], total: 0 };

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    return apiClient.get<{ items: any[]; total: number }>(`/api/${path}?${queryParams.toString()}`);
  }

  validateRecordInput(collectionName: string, data: any) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid input payload: data must be an object.');
    }

    // 1. Credit Cards
    if (collectionName === 'cards') {
      if (!data.cardName || typeof data.cardName !== 'string' || data.cardName.trim() === '') {
        throw new Error('Card Name is required.');
      }
      if (!data.bankName || typeof data.bankName !== 'string' || data.bankName.trim() === '') {
        throw new Error('Bank Name is required.');
      }
      if (data.cardNumber && typeof data.cardNumber === 'string' && !/^\d{4,16}$/.test(data.cardNumber.trim())) {
        throw new Error('Card Number must be 4 to 16 digits.');
      }
      if (data.expiryDate && typeof data.expiryDate === 'string' && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate.trim())) {
        throw new Error('Expiry Date must be in MM/YY format (e.g. 12/28).');
      }
      if (data.creditLimit !== undefined && (typeof data.creditLimit !== 'number' || data.creditLimit < 0)) {
        throw new Error('Credit Limit must be a non-negative number.');
      }
      if (data.currentOutstanding !== undefined && (typeof data.currentOutstanding !== 'number' || data.currentOutstanding < 0)) {
        throw new Error('Current Outstanding cannot be negative.');
      }
    }

    // 2. Bank Accounts
    if (collectionName === 'banks') {
      if (!data.bankName || typeof data.bankName !== 'string' || data.bankName.trim() === '') {
        throw new Error('Bank Name is required.');
      }
      if (data.currentBalance !== undefined && (typeof data.currentBalance !== 'number' || data.currentBalance < 0)) {
        throw new Error('Current Balance cannot be negative.');
      }
    }

    // 3. Expenses
    if (collectionName === 'expenses') {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error('Expense Amount must be a positive number (> 0).');
      }
      if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
        throw new Error('Expense Category is required.');
      }
    }

    // 4. Income
    if (collectionName === 'income') {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error('Income Amount must be a positive number (> 0).');
      }
      if (!data.source || typeof data.source !== 'string' || data.source.trim() === '') {
        throw new Error('Income Source is required.');
      }
    }

    // 5. Liability Loans
    if (collectionName === 'loans') {
      if (!data.loanName || typeof data.loanName !== 'string' || data.loanName.trim() === '') {
        throw new Error('Loan Name is required.');
      }
      if (!data.lenderName || typeof data.lenderName !== 'string' || data.lenderName.trim() === '') {
        throw new Error('Lender Name is required.');
      }
      if (typeof data.borrowedAmount !== 'number' || data.borrowedAmount <= 0) {
        throw new Error('Borrowed Amount must be a positive number.');
      }
    }

    // 6. EMI Reminders
    if (collectionName === 'emis') {
      if (!data.itemName || typeof data.itemName !== 'string' || data.itemName.trim() === '') {
        throw new Error('Item/Loan Name for EMI is required.');
      }
      if (typeof data.emiAmount !== 'number' || data.emiAmount <= 0) {
        throw new Error('EMI Installment Amount must be positive.');
      }
    }

    // 7. Borrow / Lend
    if (collectionName === 'borrows') {
      if (!data.personName || typeof data.personName !== 'string' || data.personName.trim() === '') {
        throw new Error('Person Name is required.');
      }
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error('Borrow/Lend Amount must be a positive number.');
      }
    }

    // 8. Chit Funds
    if (collectionName === 'chits') {
      if (!data.chitName || typeof data.chitName !== 'string' || data.chitName.trim() === '') {
        throw new Error('Chit Name is required.');
      }
      if (typeof data.monthlyContribution !== 'number' || data.monthlyContribution <= 0) {
        throw new Error('Monthly Contribution must be a positive number.');
      }
    }

    // 9. SIP & Investments
    if (collectionName === 'investments') {
      if (!data.investmentName || typeof data.investmentName !== 'string' || data.investmentName.trim() === '') {
        throw new Error('Investment Name is required.');
      }
      if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount < 0)) {
        throw new Error('Investment Amount cannot be negative.');
      }
    }

    // 10. Capital Assets
    if (collectionName === 'assets') {
      if (!data.assetName || typeof data.assetName !== 'string' || data.assetName.trim() === '') {
        throw new Error('Asset Name is required.');
      }
      if (typeof data.currentValue !== 'number' || data.currentValue <= 0) {
        throw new Error('Asset Current Value must be a positive number.');
      }
    }

    // 11. Goals
    if (collectionName === 'goals') {
      if (!data.goalName || typeof data.goalName !== 'string' || data.goalName.trim() === '') {
        throw new Error('Goal Name is required.');
      }
      if (typeof data.targetAmount !== 'number' || data.targetAmount <= 0) {
        throw new Error('Goal Target Amount must be a positive number.');
      }
    }

    // 12. Recurring Autopay Transactions
    if (collectionName === 'recurring' || collectionName === 'recurringTransactions') {
      if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        throw new Error('Recurring Autopay Title is required.');
      }
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error('Autopay Amount must be a positive number.');
      }
    }

    // 13. Monthly Budgets
    if (collectionName === 'budgets') {
      if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
        throw new Error('Budget Category is required.');
      }
      if (typeof data.monthlyCap !== 'number' || data.monthlyCap <= 0) {
        throw new Error('Monthly Cap Limit must be a positive number.');
      }
    }

    // 14. Custom Categories
    if (collectionName === 'categories' || collectionName === 'customCategories') {
      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        throw new Error('Category Name is required.');
      }
    }

    // 15-17. Transaction Payment Sub-Records
    if (['chitTransactions', 'chit_transactions', 'emi_transactions', 'loan_transactions'].includes(collectionName)) {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        throw new Error('Transaction payment amount must be positive.');
      }
    }
  }

  async addRecord(collectionName: string, data: any): Promise<any> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) throw new Error(`Unknown collection ${collectionName}`);

    this.validateRecordInput(collectionName, data);

    const result = await apiClient.post<any>(`/api/${path}`, data);

    // Update cache
    if (!this.cache[collectionName]) this.cache[collectionName] = [];
    this.cache[collectionName] = [result, ...this.cache[collectionName]];
    this.status[collectionName] = 'loaded';
    this.notify(collectionName);
    return result;
  }

  async updateRecord(collectionName: string, id: string, updates: any): Promise<void> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) throw new Error(`Unknown collection ${collectionName}`);

    await apiClient.put(`/api/${path}/${id}`, updates);

    // Update cache
    if (this.cache[collectionName]) {
      this.cache[collectionName] = this.cache[collectionName].map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      this.notify(collectionName);
    }
  }

  async deleteRecord(collectionName: string, id: string): Promise<void> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) throw new Error(`Unknown collection ${collectionName}`);

    await apiClient.delete(`/api/${path}/${id}`);

    // Update cache
    if (this.cache[collectionName]) {
      this.cache[collectionName] = this.cache[collectionName].filter(item => item.id !== id);
      this.notify(collectionName);
    }
  }

  async fetchRecordById(collectionName: string, id: string): Promise<any> {
    const cachedList = this.cache[collectionName] || [];
    const match = cachedList.find(item => item.id === id);
    if (match) return match;
    
    this.status[collectionName] = 'idle';
    const fresh = await this.fetchCollection(collectionName);
    return fresh.find(item => item.id === id);
  }

  invalidate(collectionName: string) {
    this.status[collectionName] = 'idle';
  }

  clear() {
    this.cache = {};
    this.status = {};
    this.lastFetched = {};
    this.activePromises = {};
    this.listeners = {};
    this.isBootstrapped = false;
    this.bootstrapPromise = null;
  }
}

export const porulalarStore = new PorulalarStore();

export function increment(value: number) {
  return { __type: 'increment', value };
}
