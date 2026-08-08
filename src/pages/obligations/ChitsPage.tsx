import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import ChitsPanel from '../../components/ChitsPanel';
import { HubHeader } from '../../components/HubHeader';
import { Briefcase, Clock, Percent, Activity } from 'lucide-react';

const OBLIGATIONS_TABS = [
  { id: 'loans', label: 'Liability Loans', route: '/loans', icon: Briefcase },
  { id: 'emis', label: 'EMI Reminders', route: '/emis', icon: Clock },
  { id: 'chits', label: 'Chit Funds', route: '/chits', icon: Percent },
  { id: 'simulators', label: 'Simulators', route: '/simulators', icon: Activity },
];

export default function ChitsPage() {
  const { user } = useAuth();
  const [chits, setChits] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [chitsList, banksList, cardsList] = await Promise.all([
        porulalarStore.fetchCollection('chits'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards')
      ]);
      setChits(chitsList);
      setBanks(banksList);
      setCards(cardsList);
    } catch (err) {
      console.error('Error loading chits page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsub = porulalarStore.subscribe('chits', debouncedLoadData);
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <HubHeader
        title="Obligations & Chit Funds"
        subtitle="Manage long-term loans, EMI schedules, chit fund investments, and financial payoff simulators."
        tabs={OBLIGATIONS_TABS}
        icon={Percent}
      />
      <ChitsPanel
        userId={user.uid}
        chits={chits}
        banks={banks}
        cards={cards}
        accessToken={null}
        onRefreshData={loadData}
      />
    </div>
  );
}
