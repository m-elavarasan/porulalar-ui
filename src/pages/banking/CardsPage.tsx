import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import CardsPanel from '../../components/CardsPanel';

export default function CardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [cardsList, banksList] = await Promise.all([
        porulalarStore.fetchCollection('cards'),
        porulalarStore.fetchCollection('banks')
      ]);
      setCards(cardsList);
      setBanks(banksList);
    } catch (err) {
      console.error('Error loading cards page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsubCards = porulalarStore.subscribe('cards', debouncedLoadData);
    const unsubBanks = porulalarStore.subscribe('banks', debouncedLoadData);
    return () => {
      unsubCards();
      unsubBanks();
    };
  }, []);

  if (!user) return null;

  return (
    <CardsPanel
      userId={user.uid}
      cards={cards}
      banks={banks}
      onRefreshData={loadData}
    />
  );
}
