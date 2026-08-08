import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../../lib/store';
import { useAuth } from '../../App';
import { debounce } from '../../lib/utils';
import ExpensePanel from '../../components/ExpensePanel';
import { HubHeader } from '../../components/HubHeader';
import { Receipt, ArrowDownLeft, Handshake } from 'lucide-react';

const CASH_FLOW_TABS = [
  { id: 'expenses', label: 'Expenses & Budgets', route: '/expenses', icon: Receipt },
  { id: 'income', label: 'Income Ledger', route: '/income', icon: ArrowDownLeft },
  { id: 'borrows', label: 'Borrow & Lend', route: '/borrows', icon: Handshake },
];

export default function ExpensesPage() {
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  const limit = 20;

  const isLoadingRef = useRef(false);

  const fetchExpensesData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const filters: Record<string, string> = {};
      if (filterCategory !== 'All') filters.category = filterCategory;
      if (searchQuery) filters.search = searchQuery;
      if (startDateFilter) filters.startDate = startDateFilter;
      if (endDateFilter) filters.endDate = endDateFilter;

      const paginatedRes = await porulalarStore.fetchCollectionPaginated('expenses', page, limit, filters);
      setExpenses(paginatedRes.items || []);
      setTotalExpenses(paginatedRes.total || 0);

      const [budgetsList, banksList, cardsList, catsList] = await Promise.all([
        porulalarStore.fetchCollection('budgets'),
        porulalarStore.fetchCollection('banks'),
        porulalarStore.fetchCollection('cards'),
        porulalarStore.fetchCollection('customCategories')
      ]);

      setBudgets(budgetsList);
      setBanks(banksList);
      setCards(cardsList);
      
      if (catsList && catsList.length > 0) {
        setCategories(catsList.map((c: any) => c.name));
      }
    } catch (err) {
      console.error('Error fetching expenses page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedFetchExpensesData = useMemo(() => {
    return debounce(fetchExpensesData, 100);
  }, [page, searchQuery, filterCategory, startDateFilter, endDateFilter]);

  useEffect(() => {
    fetchExpensesData();

    const unsubExpenses = porulalarStore.subscribe('expenses', debouncedFetchExpensesData);
    const unsubBudgets = porulalarStore.subscribe('budgets', debouncedFetchExpensesData);
    const unsubBanks = porulalarStore.subscribe('banks', debouncedFetchExpensesData);
    const unsubCards = porulalarStore.subscribe('cards', debouncedFetchExpensesData);

    return () => {
      unsubExpenses();
      unsubBudgets();
      unsubBanks();
      unsubCards();
    };
  }, [page, searchQuery, filterCategory, startDateFilter, endDateFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterCategory, startDateFilter, endDateFilter]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <HubHeader
        title="Cash Flow Management"
        subtitle="Track income, daily expenses, category budgets, and borrow/lend transactions."
        tabs={CASH_FLOW_TABS}
        icon={Receipt}
      />
      <ExpensePanel
        userId={user.uid}
        expenses={expenses}
        budgets={budgets}
        banks={banks}
        cards={cards}
        onRefreshData={fetchExpensesData}
        categories={categories.length > 0 ? categories : undefined}
        page={page}
        setPage={setPage}
        totalExpenses={totalExpenses}
        limit={limit}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        startDateFilter={startDateFilter}
        setStartDateFilter={setStartDateFilter}
        endDateFilter={endDateFilter}
        setEndDateFilter={setEndDateFilter}
      />
    </div>
  );
}
