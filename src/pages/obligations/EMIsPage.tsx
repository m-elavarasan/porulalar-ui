import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import EMIsPanel from '../../components/EMIsPanel';
import { HubHeader } from '../../components/HubHeader';
import { Briefcase, Clock, Percent, Activity } from 'lucide-react';

const OBLIGATIONS_TABS = [
  { id: 'loans', label: 'Liability Loans', route: '/loans', icon: Briefcase },
  { id: 'emis', label: 'EMI Reminders', route: '/emis', icon: Clock },
  { id: 'chits', label: 'Chit Funds', route: '/chits', icon: Percent },
  { id: 'simulators', label: 'Simulators', route: '/simulators', icon: Activity },
];

export default function EMIsPage() {
  const { user } = useAuth();
  const [emis, setEmis] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [emisList, banksList, cardsList] = await Promise.all([
        porulalarStore.fetchCollection('emis'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards')
      ]);
      setEmis(emisList);
      setBanks(banksList);
      setCards(cardsList);
    } catch (err) {
      console.error('Error loading EMIs page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsub = porulalarStore.subscribe('emis', debouncedLoadData);
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <HubHeader
        title="Obligations & Chit Funds"
        subtitle="Manage long-term loans, EMI schedules, chit fund investments, and financial payoff simulators."
        tabs={OBLIGATIONS_TABS}
        icon={Clock}
      />
      <EMIsPanel
        userId={user.uid}
        emis={emis}
        banks={banks}
        cards={cards}
        onRefreshData={loadData}
      />
    </div>
  );
}
