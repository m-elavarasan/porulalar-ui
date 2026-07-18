// Centralized Redux/Pinia-like state management store for caching and offline-first mutations.

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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('porulalar_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

class PorulalarStore {
  private cache: Record<string, any[]> = {};
  private status: Record<string, 'idle' | 'loading' | 'loaded'> = {};
  private activePromises: Record<string, Promise<any[]>> = {};
  private listeners: Record<string, Set<(data: any[]) => void>> = {};

  subscribe(collectionName: string, callback: (data: any[]) => void) {
    if (!this.listeners[collectionName]) {
      this.listeners[collectionName] = new Set();
    }
    this.listeners[collectionName].add(callback);
    
    // Trigger initial callback if loaded, otherwise fetch
    if (this.status[collectionName] === 'loaded') {
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

  async fetchCollection(collectionName: string): Promise<any[]> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) return [];

    if (this.status[collectionName] === 'loaded') {
      return this.cache[collectionName];
    }

    if (this.status[collectionName] === 'loading' && this.activePromises[collectionName]) {
      return this.activePromises[collectionName];
    }

    this.status[collectionName] = 'loading';
    this.activePromises[collectionName] = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/${path}`, {
          headers: getHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.cache[collectionName] = data;
        this.status[collectionName] = 'loaded';
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

    const res = await fetch(`${API_BASE}/api/${path}?${queryParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  }

  async addRecord(collectionName: string, data: any): Promise<any> {
    const path = COLLECTION_MAP[collectionName];
    if (!path) throw new Error(`Unknown collection ${collectionName}`);

    const res = await fetch(`${API_BASE}/api/${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Add failed: ${res.statusText}`);
    const result = await res.json();

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

    const res = await fetch(`${API_BASE}/api/${path}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);

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

    const res = await fetch(`${API_BASE}/api/${path}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);

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
    this.activePromises = {};
    this.listeners = {};
  }
}

export const porulalarStore = new PorulalarStore();

export function increment(value: number) {
  return { __type: 'increment', value };
}
