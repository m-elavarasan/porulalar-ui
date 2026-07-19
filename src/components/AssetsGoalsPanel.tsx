import { porulalarStore, increment } from '../lib/store';
import { analyticsService } from '../services/analyticsService';
import React, { useState, useEffect } from 'react';
import { Plus, Trash, Shield, Medal, CheckCircle, Calendar, Edit, PiggyBank, TrendingUp, AlertTriangle, Percent, Award, ShieldAlert } from 'lucide-react';
import { Asset, Goal } from '../types';
import { useDialog } from './DialogProvider';

interface AssetsGoalsPanelProps {
  userId: string;
  assets: Asset[];
  goals: Goal[];
  onRefreshData: () => void;
}

const ASSET_TYPES = ['Agricultural Land', 'House', 'Gold', 'Vehicle', 'Bank Balance', 'Cash', 'Other'];

export default function AssetsGoalsPanel({ userId, assets, goals, onRefreshData }: AssetsGoalsPanelProps) {
  const { showAlert, showConfirm, showPrompt } = useDialog();

  const [activeTab, setActiveTab] = useState<'tracking' | 'rebalancing' | 'tax'>('tracking');
  
  // Rebalancing stats states
  const [allocationData, setAllocationData] = useState<any>(null);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  
  // Tax estimator states
  const [grossIncome, setGrossIncome] = useState(1000000);
  const [deductions80C, setDeductions80C] = useState(150000);
  const [deductions80D, setDeductions80D] = useState(25000);
  const [otherDeductions, setOtherDeductions] = useState(50000);
  const [taxResult, setTaxResult] = useState<any>(null);
  const [loadingTax, setLoadingTax] = useState(false);
  const fetchAllocation = async () => {
    setLoadingAllocation(true);
    try {
      // Read targets set in settings panel
      const targetEq = Number(localStorage.getItem('target_equity') || '50');
      const targetDe = Number(localStorage.getItem('target_debt') || '20');
      const targetGo = Number(localStorage.getItem('target_gold') || '10');
      const targetRe = Number(localStorage.getItem('target_realestate') || '10');
      const targetCa = Number(localStorage.getItem('target_cash') || '10');

      const queryParams = new URLSearchParams({
        equity: targetEq.toString(),
        debt: targetDe.toString(),
        gold: targetGo.toString(),
        realestate: targetRe.toString(),
        cash: targetCa.toString(),
      });

      const data = await analyticsService.getAssetAllocation({
        userId,
        equity: targetEq.toString(),
        debt: targetDe.toString(),
        gold: targetGo.toString(),
        realestate: targetRe.toString(),
        cash: targetCa.toString(),
      });
      setAllocationData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAllocation(false);
    }
  };

  const estimateTax = async () => {
    setLoadingTax(true);
    try {
      const data = await analyticsService.estimateTax({
        grossIncome,
        deductions80C,
        deductions80D,
        otherDeductions
      });
      setTaxResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTax(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rebalancing') {
      fetchAllocation();
    } else if (activeTab === 'tax') {
      estimateTax();
    }
  }, [activeTab]);
  // Asset Form State
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('Agricultural Land');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseValue, setPurchaseValue] = useState('');
  const [currentEstimatedValue, setCurrentEstimatedValue] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalNotes, setGoalNotes] = useState('');

  // Form toggles
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !purchaseValue || !currentEstimatedValue) return;

    try {
      const pVal = Number(purchaseValue);
      const cVal = Number(currentEstimatedValue);

      if (isNaN(pVal) || pVal < 0 || isNaN(cVal) || cVal < 0) {
        await showAlert('Please enter valid positive numbers for asset values.', 'Validation Error', 'error');
        return;
      }

      const app = cVal - pVal;

      await porulalarStore.addRecord('assets', {
        userId,
        assetName,
        assetType,
        purchaseDate,
        purchaseValue: pVal,
        currentEstimatedValue: cVal,
        appreciation: app,
        notes: assetNotes,
      });

      setAssetName('');
      setPurchaseValue('');
      setCurrentEstimatedValue('');
      setAssetNotes('');
      setShowAssetForm(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;

    try {
      const tAmt = Number(targetAmount);
      const cAmt = Number(currentAmount) || 0;

      if (isNaN(tAmt) || tAmt <= 0) {
        await showAlert('Please enter a valid target amount greater than 0.', 'Validation Error', 'error');
        return;
      }
      if (isNaN(cAmt) || cAmt < 0) {
        await showAlert('Please enter a valid positive initial savings amount.', 'Validation Error', 'error');
        return;
      }

      const prog = tAmt > 0 ? (cAmt / tAmt) * 100 : 0;

      await porulalarStore.addRecord('goals', {
        userId,
        goalName,
        targetAmount: tAmt,
        currentAmount: cAmt,
        targetDate,
        progress: prog,
        notes: goalNotes,
      });

      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('');
      setGoalNotes('');
      setShowGoalForm(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this asset record?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('assets', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this goal?');
    if (!confirmed) return;
    try {
      await porulalarStore.deleteRecord('goals', id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFundsToGoal = async (goal: Goal) => {
    const amtStr = await showPrompt(`Add funds to your "${goal.goalName}" goal (Target: ₹${goal.targetAmount.toLocaleString('en-IN')}):`, 'Add Funds');
    if (!amtStr || isNaN(Number(amtStr))) return;
    const addAmt = Number(amtStr);

    try {
      const goalRef = goal.id;
      const updatedAmount = (goal.currentAmount || 0) + addAmt;
      const progress = goal.targetAmount > 0 ? (updatedAmount / goal.targetAmount) * 100 : 0;

      await porulalarStore.updateRecord('goals', goalRef, {
        currentAmount: updatedAmount,
        progress,
      });

      // Optional: Ask user if they want to log this as a savings/investment expense
      const addAsExpense = await showConfirm(`Would you like to log this ₹${addAmt.toLocaleString('en-IN')} contribution as an investment expense in your tracker?`, 'Log as Expense?');
      if (addAsExpense) {
        await porulalarStore.addRecord('expenses', {
          userId,
          date: new Date().toISOString().split('T')[0],
          category: 'Investment',
          subCategory: goal.goalName,
          amount: addAmt,
          paymentMethod: 'UPI',
          description: `Goal savings: ${goal.goalName}`,
          tags: ['Goal Contribution'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-left">
      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-4 mb-4">
        <button
          onClick={() => setActiveTab('tracking')}
          className={`pb-2.5 text-sm font-bold border-b-2 cursor-pointer transition-all ${activeTab === 'tracking' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Assets & Goals
        </button>
        <button
          onClick={() => setActiveTab('rebalancing')}
          className={`pb-2.5 text-sm font-bold border-b-2 cursor-pointer transition-all ${activeTab === 'rebalancing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Rebalancing Alerts
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`pb-2.5 text-sm font-bold border-b-2 cursor-pointer transition-all ${activeTab === 'tax' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Tax Estimator (FY 2025-26)
        </button>
      </div>

      {activeTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Assets Tracking */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Shield className="text-indigo-500 h-5 w-5" /> Asset Tracker
              </h3>
              <button
                onClick={() => setShowAssetForm(!showAssetForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                id="btn-add-asset"
              >
                <Plus className="h-4 w-4" /> Add Asset
              </button>
            </div>

            {showAssetForm && (
              <form onSubmit={handleAddAsset} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Asset Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Farm Land, Home"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Asset Type</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    >
                      {ASSET_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Purchase Date</label>
                    <input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Purchase (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500000"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Market Value (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 750000"
                      value={currentEstimatedValue}
                      onChange={(e) => setCurrentEstimatedValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAssetForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    Save Asset
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {assets.length === 0 ? (
                <p className="text-sm text-slate-400 italic bg-white p-6 rounded-2xl border border-slate-100 text-center animate-fade-in">
                  No assets tracked. Log properties, land, vehicles, or cash to start tracking net worth.
                </p>
              ) : (
                assets.map((asset) => {
                  const app = (asset.currentEstimatedValue ?? asset.purchaseValue) - asset.purchaseValue;
                  const appPercent = asset.purchaseValue > 0 ? (app / asset.purchaseValue) * 100 : 0;

                  return (
                    <div key={asset.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col space-y-3 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                            {asset.assetType}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">{asset.assetName}</h4>
                          <span className="text-[10px] text-slate-400">Purchased: {asset.purchaseDate}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-50 pt-2.5">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Purchase Value</span>
                          <div className="text-xs font-mono font-bold text-slate-700">₹{asset.purchaseValue.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Est. Market Value</span>
                          <div className="text-sm font-mono font-black text-slate-800">₹{asset.currentEstimatedValue.toLocaleString('en-IN')}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl text-xs">
                        <span className="text-slate-500 font-medium">Appreciation</span>
                        <span className={`font-bold flex items-center gap-1 ${app >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {app >= 0 ? '+' : ''}₹{app.toLocaleString('en-IN')} ({appPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Goals Tracking */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Medal className="text-amber-500 h-5 w-5" /> Financial Goals
              </h3>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                id="btn-add-goal"
              >
                <Plus className="h-4 w-4" /> Set Goal
              </button>
            </div>

            {showGoalForm && (
              <form onSubmit={handleAddGoal} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-xs space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Goal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New Home, Farm Tractor"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Date</label>
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Target Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Current Savings (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000 (optional)"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white outline-hidden focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-sm text-slate-400 italic bg-white p-6 rounded-2xl border border-slate-100 text-center">
                  No long term goals defined. Set target amounts for house, farm expansions, or child marriage.
                </p>
              ) : (
                goals.map((goal) => {
                  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                  const isCompleted = percent >= 100;

                  return (
                    <div key={goal.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col space-y-3 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{goal.goalName}</h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" /> Target Date: {goal.targetDate}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddFundsToGoal(goal)}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg transition-all cursor-pointer"
                            title="Add savings contribution"
                          >
                            Add Funds
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar of financial goal */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-400">₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                          <span className="font-bold text-amber-600">{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {isCompleted && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2 font-semibold animate-bounce">
                          <CheckCircle className="h-4 w-4 text-emerald-500" /> Goal Achieved! Great job budgeting your finances!
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rebalancing' && (
        <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" /> Portfolio Allocation & Drift Alerts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Asset allocation weights calculated in real-time from bank balances, investments, gold, and properties.</p>
            </div>
            <button
              onClick={fetchAllocation}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all"
            >
              Recalculate Drift
            </button>
          </div>

          {loadingAllocation ? (
            <div className="py-12 text-center text-slate-400 font-medium animate-pulse">Calculating allocation drift...</div>
          ) : allocationData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual allocation indicators */}
                <div className="space-y-4">
                  {Object.entries(allocationData.actuals).map(([category, val]: any) => {
                    const target = allocationData.targets[category] || 0;
                    const drift = allocationData.drift[category] || 0;
                    const isDriftWarning = Math.abs(drift) > 5;
                    const percentage = allocationData.percentages[category] || 0;
                    
                    return (
                      <div key={category} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-700 capitalize">{category === 'realestate' ? 'Real Estate' : category}</span>
                          <span className="text-xs font-mono font-bold text-slate-500">₹{val.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Actual: {percentage.toFixed(1)}%</span>
                          <span>Target: {target}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isDriftWarning ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold mt-1">
                          <span className={drift >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            Drift: {drift >= 0 ? '+' : ''}{drift.toFixed(1)}%
                          </span>
                          {isDriftWarning && (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Drifting &gt; 5%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Alerts/Insights card */}
                <div className="bg-indigo-50/30 border border-indigo-100 p-6 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Award className="h-4.5 w-4.5 text-indigo-600" /> Rebalancing Insights
                    </h4>
                    {allocationData.alerts && allocationData.alerts.length > 0 ? (
                      <div className="space-y-3">
                        {allocationData.alerts.map((alert: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-start p-3 bg-white border border-rose-100 rounded-xl">
                            <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">{alert}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2.5 items-start p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                        <p className="text-xs leading-relaxed font-bold">Your asset distribution is perfectly aligned with targets! No drift exceeds the 5% threshold.</p>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-4">
                    Note: Targets can be adjusted inside Preferences & Settings. Drift calculations are updated instantly as asset values fluctuate.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic py-6">Could not load portfolio allocation calculations.</p>
          )}
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm animate-fade-in text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Percent className="h-5 w-5 text-indigo-600" /> India Tax Slab Estimator (FY 2025-26)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Compare Tax Outgo side-by-side between the Old Tax Regime and the New Tax Regime (Union Budget FY 2025-26 / AY 2026-27 rules).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Side */}
            <div className="md:col-span-1 space-y-4 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">Income & Deductions</h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Gross Annual Income (₹)</label>
                <input
                  type="number"
                  value={grossIncome}
                  step="50000"
                  onChange={(e) => setGrossIncome(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sec 80C (EPF/ELSS/PPF) (₹)</label>
                <input
                  type="number"
                  value={deductions80C}
                  max="150000"
                  onChange={(e) => setDeductions80C(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sec 80D (Health Premium) (₹)</label>
                <input
                  type="number"
                  value={deductions80D}
                  max="75000"
                  onChange={(e) => setDeductions80D(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Other Deductions (HRA/Interest) (₹)</label>
                <input
                  type="number"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                onClick={estimateTax}
                disabled={loadingTax}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {loadingTax ? 'Calculating...' : 'Recalculate Estimates'}
              </button>
            </div>

            {/* Calculations Comparison Side */}
            <div className="md:col-span-2 space-y-6">
              {taxResult ? (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Old Regime Card */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Old Tax Regime</span>
                      <div className="text-xl font-black text-slate-800 mt-1">₹{taxResult.oldRegime.totalTax.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-400 mt-2">Taxable Income: ₹{taxResult.oldRegime.taxableIncome.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Standard Deduction: ₹50,000 applied</div>
                    </div>
                    {/* New Regime Card */}
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">New Tax Regime</span>
                      <div className="text-xl font-black text-indigo-700 mt-1">₹{taxResult.newRegime.totalTax.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-400 mt-2">Taxable Income: ₹{taxResult.newRegime.taxableIncome.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Standard Deduction: ₹75,000 applied</div>
                    </div>
                  </div>

                  {/* Recommendation Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-center">
                    <Award className="h-6 w-6 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">{taxResult.recommendation}</h4>
                      <p className="text-[11px] text-emerald-600/90 font-medium">Under the FY 2025-26 rules, you save substantial money by switching to this option.</p>
                    </div>
                  </div>

                  {/* Regime breakdown table */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Estimated Slabs & Cess</h5>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-200/60 font-semibold text-slate-600">
                      <span>Breakdown</span>
                      <span>Old Regime</span>
                      <span>New Regime</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                      <span>Base Income Tax</span>
                      <span>₹{taxResult.oldRegime.baseTax.toLocaleString('en-IN')}</span>
                      <span>₹{taxResult.newRegime.baseTax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-200/60">
                      <span>4% Health & Education Cess</span>
                      <span>₹{taxResult.oldRegime.cess.toLocaleString('en-IN')}</span>
                      <span>₹{taxResult.newRegime.cess.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 font-bold text-slate-800">
                      <span>Total Estimated Liability</span>
                      <span>₹{taxResult.oldRegime.totalTax.toLocaleString('en-IN')}</span>
                      <span>₹{taxResult.newRegime.totalTax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium">Click recalculate to evaluate tax outgo estimates.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
