import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import InvestmentsPanel from '../../components/InvestmentsPanel';
import { HubHeader } from '../../components/HubHeader';
import { PiggyBank, Award } from 'lucide-react';

const PORTFOLIO_TABS = [
  { id: 'investments', label: 'SIP Investments', route: '/investments', icon: PiggyBank },
  { id: 'assets-goals', label: 'Assets & Goals', route: '/assets-goals', icon: Award },
];

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
    <div className="space-y-6">
      <HubHeader
        title="Portfolio & Asset Management"
        subtitle="Track mutual funds, SIPs, gold, real estate assets, and long-term financial targets."
        tabs={PORTFOLIO_TABS}
        icon={PiggyBank}
      />
      <InvestmentsPanel
        userId={user.uid}
        investments={investments}
        banks={banks}
        cards={cards}
        onRefreshData={loadData}
      />
    </div>
  );
}
