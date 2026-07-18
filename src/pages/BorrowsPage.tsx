import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import BorrowPanel from '../components/BorrowPanel';

export default function BorrowsPage() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [borrowsList, banksList, cardsList] = await Promise.all([
        porulalarStore.fetchCollection('borrows'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards')
      ]);
      setBorrows(borrowsList);
      setBanks(banksList);
      setCards(cardsList);
    } catch (err) {
      console.error('Error loading borrows page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsub = porulalarStore.subscribe('borrows', debouncedLoadData);
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <BorrowPanel
      userId={user.uid}
      borrows={borrows}
      banks={banks}
      cards={cards}
      onRefreshData={loadData}
    />
  );
}
