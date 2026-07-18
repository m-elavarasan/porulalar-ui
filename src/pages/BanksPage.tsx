import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import BanksPanel from '../components/BanksPanel';

export default function BanksPage() {
  const { user } = useAuth();
  const [banks, setBanks] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const banksList = await porulalarStore.fetchCollection('banks');
      setBanks(banksList);
    } catch (err) {
      console.error('Error loading banks page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsub = porulalarStore.subscribe('banks', debouncedLoadData);
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <BanksPanel
      userId={user.uid}
      banks={banks}
      onRefreshData={loadData}
    />
  );
}
