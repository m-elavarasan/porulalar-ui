import React, { useEffect, useState, useRef } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import AIPanel from '../components/AIPanel';

export default function AIPage() {
  const { user, token } = useAuth();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [chits, setChits] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  const isLoadingRef = useRef(false);

  const loadData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const [
        expList,
        incList,
        loansList,
        chitsList,
        invList,
        assetsList,
        goalsList,
        budgetsList
      ] = await Promise.all([
        porulalarStore.fetchCollection('expenses'),
        porulalarStore.fetchCollection('income'),
        porulalarStore.fetchCollection('loans'),
        porulalarStore.fetchCollection('chits'),
        porulalarStore.fetchCollection('investments'),
        porulalarStore.fetchCollection('assets'),
        porulalarStore.fetchCollection('goals'),
        porulalarStore.fetchCollection('budgets')
      ]);

      setExpenses(expList);
      setIncome(incList);
      setLoans(loansList);
      setChits(chitsList);
      setInvestments(invList);
      setAssets(assetsList);
      setGoals(goalsList);
      setBudgets(budgetsList);
    } catch (err) {
      console.error('Error loading AI page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  return (
    <AIPanel
      userId={user.uid}
      accessToken={token}
      onRefreshData={loadData}
      expenses={expenses}
      income={income}
      loans={loans}
      chits={chits}
      investments={investments}
      assets={assets}
      goals={goals}
      budgets={budgets}
    />
  );
}
