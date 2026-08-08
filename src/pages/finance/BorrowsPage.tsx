import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import BorrowPanel from '../../components/BorrowPanel';
import { HubHeader } from '../../components/HubHeader';
import { Receipt, ArrowDownLeft, Handshake } from 'lucide-react';

const CASH_FLOW_TABS = [
  { id: 'expenses', label: 'Expenses & Budgets', route: '/expenses', icon: Receipt },
  { id: 'income', label: 'Income Ledger', route: '/income', icon: ArrowDownLeft },
  { id: 'borrows', label: 'Borrow & Lend', route: '/borrows', icon: Handshake },
];

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
    <div className="space-y-6">
      <HubHeader
        title="Cash Flow Management"
        subtitle="Track income, daily expenses, category budgets, and borrow/lend transactions."
        tabs={CASH_FLOW_TABS}
        icon={Handshake}
      />
      <BorrowPanel
        userId={user.uid}
        borrows={borrows}
        banks={banks}
        cards={cards}
        onRefreshData={loadData}
      />
    </div>
  );
}
