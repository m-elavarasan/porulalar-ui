import React, { useEffect, useState } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import SettingsPanel from '../../components/SettingsPanel';

export default function SettingsPage() {
  const { user } = useAuth();
  const [allData, setAllData] = useState<any>({});

  const loadData = async () => {
    try {
      const collections = [
        'expenses', 'income', 'banks', 'cards', 'loans', 'emis',
        'borrows', 'chits', 'investments', 'assets', 'goals', 'budgets',
        'recurringTransactions', 'netWorthSnapshots', 'customCategories'
      ];
      
      const results = await Promise.all(
        collections.map(c => porulalarStore.fetchCollection(c))
      );

      const combined: Record<string, any[]> = {};
      collections.forEach((c, idx) => {
        combined[c] = results[idx];
      });

      setAllData(combined);
    } catch (err) {
      console.error('Error loading settings data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  return (
    <SettingsPanel
      userId={user.uid}
      allData={allData}
      onRefreshData={loadData}
    />
  );
}
