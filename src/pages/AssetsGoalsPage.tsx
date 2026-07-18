import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import AssetsGoalsPanel from '../components/AssetsGoalsPanel';

export default function AssetsGoalsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [assetsList, goalsList] = await Promise.all([
        porulalarStore.fetchCollection('assets'),
        porulalarStore.fetchCollection('goals')
      ]);
      setAssets(assetsList);
      setGoals(goalsList);
    } catch (err) {
      console.error('Error loading assets/goals page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedLoadData = useMemo(() => {
    return debounce(loadData, 100);
  }, []);

  useEffect(() => {
    loadData();
    const unsubAssets = porulalarStore.subscribe('assets', debouncedLoadData);
    const unsubGoals = porulalarStore.subscribe('goals', debouncedLoadData);
    return () => {
      unsubAssets();
      unsubGoals();
    };
  }, []);

  if (!user) return null;

  return (
    <AssetsGoalsPanel
      userId={user.uid}
      assets={assets}
      goals={goals}
      onRefreshData={loadData}
    />
  );
}
