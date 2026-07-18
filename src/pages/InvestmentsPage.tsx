import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import InvestmentsPanel from '../components/InvestmentsPanel';

export default function InvestmentsPage() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [invList, banksList, cardsList] = await Promise.all([
        porulalarStore.fetchCollection('investments'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards')
      ]);
      setInvestments(invList);
      setBanks(banksList);
      setCards(cardsList);
    } catch (err) {
      console.error('Error loading investments page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsub = porulalarStore.subscribe('investments', debouncedLoadData);
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <InvestmentsPanel
      userId={user.uid}
      investments={investments}
      banks={banks}
      cards={cards}
      onRefreshData={loadData}
    />
  );
}
