import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import RecurringPanel from '../../components/RecurringPanel';

export default function RecurringPage() {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [recList, catsList] = await Promise.all([
        porulalarStore.fetchCollection('recurringTransactions'),
        porulalarStore.fetchCollection('customCategories')
      ]);
      setRecurringTransactions(recList);
      if (catsList && catsList.length > 0) {
        setCategories(catsList.map((c: any) => c.name));
      }
    } catch (err) {
      console.error('Error loading recurring page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsubRec = porulalarStore.subscribe('recurringTransactions', debouncedLoadData);
    return () => unsubRec();
  }, []);

  if (!user) return null;

  return (
    <RecurringPanel
      userId={user.uid}
      recurringTransactions={recurringTransactions}
      categories={categories.length > 0 ? categories : undefined}
      onRefreshData={loadData}
    />
  );
}
