import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import LoansPanel from '../components/LoansPanel';

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [loansList, banksList, cardsList] = await Promise.all([
        porulalarStore.fetchCollection('loans'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards')
      ]);
      setLoans(loansList);
      setBanks(banksList);
      setCards(cardsList);
    } catch (err) {
      console.error('Error loading loans page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsub = porulalarStore.subscribe('loans', debouncedLoadData);
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <LoansPanel
      userId={user.uid}
      loans={loans}
      banks={banks}
      cards={cards}
      accessToken={null}
      onRefreshData={loadData}
    />
  );
}
