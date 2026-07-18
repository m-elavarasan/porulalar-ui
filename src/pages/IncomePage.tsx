import React, { useEffect, useState, useRef, useMemo } from 'react';
import { porulalarStore } from '../lib/store';
import { useAuth } from '../App';
import { debounce } from '../lib/utils';
import IncomePanel from '../components/IncomePanel';

export default function IncomePage() {
  const { user } = useAuth();

  // Data lists
  const [income, setIncome] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  // Pagination & Filter parameters
  const [page, setPage] = useState(1);
  const [totalIncome, setTotalIncome] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const limit = 20;

  const isLoadingRef = useRef(false);

  const fetchIncomeData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      // 1. Fetch paginated income from server
      const filters: Record<string, string> = {};
      if (filterSource !== 'All') filters.category = filterSource; // backend ListHandler checks Category filter parameter
      if (searchQuery) filters.search = searchQuery;
      if (startDateFilter) filters.startDate = startDateFilter;
      if (endDateFilter) filters.endDate = endDateFilter;

      const paginatedRes = await porulalarStore.fetchCollectionPaginated('income', page, limit, filters);
      setIncome(paginatedRes.items || []);
      setTotalIncome(paginatedRes.total || 0);

      // 2. Fetch banks from cache store
      const banksList = await porulalarStore.fetchCollection('banks');
      setBanks(banksList);
    } catch (err) {
      console.error('Error fetching income page data:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const debouncedFetchIncomeData = useMemo(() => {
    return debounce(fetchIncomeData, 100);
  }, [page, searchQuery, filterSource, startDateFilter, endDateFilter]);

  useEffect(() => {
    fetchIncomeData();

    // Subscribe to store updates to auto-refresh on mutations
    const unsubIncome = porulalarStore.subscribe('income', debouncedFetchIncomeData);
    const unsubBanks = porulalarStore.subscribe('banks', debouncedFetchIncomeData);

    return () => {
      unsubIncome();
      unsubBanks();
    };
  }, [page, searchQuery, filterSource, startDateFilter, endDateFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterSource, startDateFilter, endDateFilter]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <IncomePanel
        userId={user.uid}
        income={income}
        banks={banks}
        onRefreshData={fetchIncomeData}
        page={page}
        setPage={setPage}
        totalIncome={totalIncome}
        limit={limit}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterSource={filterSource}
        setFilterSource={setFilterSource}
        startDateFilter={startDateFilter}
        setStartDateFilter={setStartDateFilter}
        endDateFilter={endDateFilter}
        setEndDateFilter={setEndDateFilter}
      />
    </div>
  );
}
