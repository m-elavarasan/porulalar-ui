import { porulalarStore, increment } from '../lib/store';
import { API_BASE } from '../lib/config';
import { dataService } from '../services/dataService';
import { googleService } from '../services/googleService';
import React, { useRef, useState } from 'react';
import { Sliders, Download, Upload, ShieldCheck, FileJson, AlertOctagon, Trash2, Mail, Link2, CheckCircle } from 'lucide-react';
import { useDialog } from './DialogProvider';

interface SettingsPanelProps {
  userId: string;
  allData: any; // We use any here to easily accept the large combined object from App.tsx
  onRefreshData?: () => void;
}

export default function SettingsPanel({ userId, allData, onRefreshData }: SettingsPanelProps) {
  const { showAlert, showConfirm } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(true);

  // Target Asset Allocations
  const [targetEquity, setTargetEquity] = useState(() => Number(localStorage.getItem('target_equity') || '50'));
  const [targetDebt, setTargetDebt] = useState(() => Number(localStorage.getItem('target_debt') || '20'));
  const [targetGold, setTargetGold] = useState(() => Number(localStorage.getItem('target_gold') || '10'));
  const [targetRealEstate, setTargetRealEstate] = useState(() => Number(localStorage.getItem('target_realestate') || '10'));
  const [targetCash, setTargetCash] = useState(() => Number(localStorage.getItem('target_cash') || '10'));

  // Server-side backups & data portability
  const [backupPassword, setBackupPassword] = useState('');
  const [isServerExporting, setIsServerExporting] = useState(false);
  const [isServerImporting, setIsServerImporting] = useState(false);
  const [isServerPurging, setIsServerPurging] = useState(false);

  const handleServerExport = async () => {
    setIsServerExporting(true);
    try {
      const token = localStorage.getItem('porulalar_access_token');
      const url = `${API_BASE}/api/data/export?password=${encodeURIComponent(backupPassword)}&token=${token}`;
      
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", `porulalar_encrypted_backup.enc`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showAlert('Server-side encrypted backup downloaded successfully.', 'Backup Completed', 'success');
    } catch (e) {
      showAlert('Failed to generate server backup.', 'Error', 'error');
    } finally {
      setIsServerExporting(false);
    }
  };

  const handleServerImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const confirmed = await showConfirm(
      'WARNING: Importing a server-side backup will wipe all your current database records and restore them from the backup. Are you sure you want to proceed?'
    );
    if (!confirmed) return;

    setIsServerImporting(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', file);
      formData.append('password', backupPassword);

      const result = await dataService.importBackup(formData);
      await showAlert(`Successfully imported ${result.count} records from server backup!`, 'Import Complete', 'success');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
      await showAlert(err.message || 'Failed to import server backup.', 'Import Error', 'error');
    } finally {
      setIsServerImporting(false);
    }
  };

  const handleServerPurge = async () => {
    const confirmed = await showConfirm(
      'DANGER ZONE: This is the Panic Button. This will permanently delete ALL your financial data from the backend database (HARD PURGE). This CANNOT be undone. Are you absolutely sure?'
    );
    if (!confirmed) return;

    setIsServerPurging(true);
    try {
      await dataService.purgeUserData();
      await showAlert('All records purged permanently from server.', 'Database Wiped', 'success');
      if (onRefreshData) onRefreshData();
    } catch (e) {
      await showAlert('Purge failed.', 'Error', 'error');
    } finally {
      setIsServerPurging(false);
    }
  };

  const checkGoogleStatus = async () => {
    try {
      const data = await googleService.getStatus();
      setGoogleLinked(data.linked);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingGoogle(false);
    }
  };

  React.useEffect(() => {
    checkGoogleStatus();
  }, []);

  const handleLinkGoogle = () => {
    const token = localStorage.getItem('porulalar_access_token');
    window.location.href = `${API_BASE}/api/google/link?token=${token}`;
  };

  const handleDisconnectGoogle = async () => {
    const confirmed = await showConfirm('Are you sure you want to disconnect your Google Account? This will disable Gmail scanning and calendar reminders.');
    if (!confirmed) return;

    try {
      await googleService.disconnect(userId);
      setGoogleLinked(false);
      await showAlert('Successfully disconnected Google Account.', 'Account Disconnected', 'success');
    } catch (e) {
      await showAlert('Failed to disconnect Google Account.', 'Error', 'error');
    }
  };

  const handleWipeData = async () => {
    const confirmed = await showConfirm(
      'DANGER: This will permanently delete ALL your financial data, transactions, assets, and settings from the database. This action CANNOT be undone. Are you absolutely sure you want to proceed?',
    );
    if (!confirmed) return;

    const secondConfirm = await showConfirm(
      'FINAL WARNING: Type OK to delete everything forever.',
    );
    if (!secondConfirm) return;

    setIsWiping(true);
    let deletedCount = 0;
    try {
      // allData contains arrays of all documents grouped by collection name
      for (const [collectionName, items] of Object.entries(allData)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item && item.id) {
              await porulalarStore.deleteRecord(collectionName, item.id);
              deletedCount++;
            }
          }
        }
      }
      showAlert(`Database reset successfully. Deleted ${deletedCount} records.`, 'Database Wiped', 'success');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error wiping database:', err);
      showAlert('An error occurred while wiping the database.', 'Error', 'error');
    } finally {
      setIsWiping(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        userId: userId,
        data: allData
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `wealth_manager_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      showAlert('Data successfully exported to your device.', 'Export Complete', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to export data.', 'Export Error', 'error');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    const confirmed = await showConfirm(
      'WARNING: Uploading a backup will merge and overwrite existing data with the same IDs. It is recommended to only do this on empty accounts or full restores. Are you sure you want to proceed?'
    );
    if (!confirmed) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const parsed = JSON.parse(jsonStr);

        if (!parsed.data || typeof parsed.data !== 'object') {
          throw new Error("Invalid backup file format.");
        }

        const dataObj = parsed.data;
        let successCount = 0;

        // Helper function to restore a collection
        const restoreCollection = async (collectionName: string, items: any[]) => {
          if (!Array.isArray(items)) return;
          for (const item of items) {
            if (item.id) {
              await porulalarStore.addRecord(collectionName, item);
              successCount++;
            }
          }
        };

        await restoreCollection('expenses', dataObj.expenses);
        await restoreCollection('income', dataObj.income);
        await restoreCollection('loans', dataObj.loans);
        await restoreCollection('emis', dataObj.emis);
        await restoreCollection('chits', dataObj.chits);
        await restoreCollection('investments', dataObj.investments);
        await restoreCollection('assets', dataObj.assets);
        await restoreCollection('goals', dataObj.goals);
        await restoreCollection('budgets', dataObj.budgets);
        await restoreCollection('recurringTransactions', dataObj.recurringTransactions);
        await restoreCollection('netWorthSnapshots', dataObj.netWorthSnapshots);
        await restoreCollection('borrows', dataObj.borrows);
        await restoreCollection('banks', dataObj.banks);
        await restoreCollection('cards', dataObj.cards);
        await restoreCollection('customCategories', dataObj.customCategories);

        if (dataObj.userSettings && dataObj.userSettings.id) {
          // Skip local user settings restore
          successCount++;
        }

        await showAlert(`Successfully restored ${successCount} records!`, 'Import Complete', 'success');
        if (onRefreshData) onRefreshData();

      } catch (err: any) {
        console.error(err);
        await showAlert('Failed to import data. Please ensure the JSON file is valid.', 'Import Error', 'error');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      showAlert('Failed to read the file.', 'File Error', 'error');
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Sliders className="h-6 w-6 text-indigo-500" /> Preferences & Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account data and application preferences.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-8">
        
        {/* Data Management Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <FileJson className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">Data Management</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Export your entire financial ledger to a secure local file, or restore your account from a previous backup. 
            All data is processed strictly on your device and synced with your secure server instances.
          </p>

          <div className="mb-6 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl max-w-md text-left">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Backup Encryption Password</label>
            <input
              type="password"
              placeholder="Enter password for Server export/import"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">If blank, the system default key is used. Required for importing encrypted server backups.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Export Card */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Local JSON Export</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Download a plain text JSON snapshot of all your transactions, assets, EMIs, and settings locally.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="w-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Local JSON
              </button>
            </div>

            {/* Local Import Card */}
            <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="h-5 w-5 text-rose-600" />
                  <h3 className="font-bold text-slate-800">Local JSON Import</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Upload a plain text JSON snapshot to restore your data. <span className="font-semibold text-rose-600">Will merge and overwrite records.</span>
                </p>
              </div>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImport} 
              />
              <button
                onClick={triggerFileInput}
                disabled={isUploading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <span className="animate-pulse">Uploading...</span>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload Local JSON</>
                )}
              </button>
            </div>

            {/* Server Encrypted Export */}
            <div className="bg-indigo-50/30 border border-indigo-100 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Server Encrypted Export</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Download an AES-GCM password-encrypted backup file directly compiled by the database server.
                </p>
              </div>
              <button
                onClick={handleServerExport}
                disabled={isServerExporting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> {isServerExporting ? 'Generating...' : 'Download Encrypted Backup'}
              </button>
            </div>

            {/* Server Decrypted Import */}
            <div className="bg-emerald-50/30 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">Server Decrypted Import</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Upload an encrypted backup. The server will decrypt using your password and clean restore your database.
                </p>
              </div>
              <input 
                type="file" 
                accept=".enc" 
                className="hidden" 
                ref={serverFileInputRef} 
                onChange={handleServerImport} 
              />
              <button
                onClick={() => serverFileInputRef.current?.click()}
                disabled={isServerImporting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Upload className="h-4 w-4" /> {isServerImporting ? 'Restoring...' : 'Upload Encrypted Backup'}
              </button>
            </div>
          </div>
        </div>

        {/* Google Account Integration Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Link2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Google Account Integrations</h2>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-start text-left">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-3xs shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  Gmail & Calendar Synchronization
                  {googleLinked && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 font-sans">
                      <CheckCircle className="h-2.5 w-2.5" />
                      <span>Linked</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                  Allow Porulalar to access your Gmail inbox to parse transaction notifications, spent alerts, and sync liability EMI deadlines to your Google Calendar automatically.
                </p>
              </div>
            </div>

            {checkingGoogle ? (
              <span className="text-xs text-slate-400 font-semibold animate-pulse px-4">Checking connection...</span>
            ) : googleLinked ? (
              <button
                onClick={handleDisconnectGoogle}
                className="w-full md:w-auto bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer border border-slate-200 hover:border-rose-200"
              >
                Disconnect Account
              </button>
            ) : (
              <button
                onClick={handleLinkGoogle}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer hover:shadow-lg flex items-center justify-center gap-1"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link Google Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">Security & Privacy</h2>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-4 items-start">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800 mb-1">Your data is safe and encrypted</h3>
              <p className="text-xs text-emerald-600/80 leading-relaxed">
                Porulalar relies on a secure PostgreSQL database backend. Your data is encrypted, never sold, shared, or analyzed by third-parties, and only accessible to you.
              </p>
            </div>
          </div>
        </div>

        {/* Wealth Intelligence Targets Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Sliders className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">Wealth Intelligence Targets</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Define your target asset allocation percentages. The rebalancing engine will compare your actual portfolio weights and trigger alerts if drift exceeds 5%.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Equity (%)</label>
              <input
                type="number"
                value={targetEquity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetEquity(val);
                  localStorage.setItem('target_equity', val.toString());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Debt (%)</label>
              <input
                type="number"
                value={targetDebt}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetDebt(val);
                  localStorage.setItem('target_debt', val.toString());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Gold (%)</label>
              <input
                type="number"
                value={targetGold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetGold(val);
                  localStorage.setItem('target_gold', val.toString());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Real Estate (%)</label>
              <input
                type="number"
                value={targetRealEstate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetRealEstate(val);
                  localStorage.setItem('target_realestate', val.toString());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cash (%)</label>
              <input
                type="number"
                value={targetCash}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTargetCash(val);
                  localStorage.setItem('target_cash', val.toString());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          {targetEquity + targetDebt + targetGold + targetRealEstate + targetCash !== 100 && (
            <p className="text-xs text-rose-500 font-semibold mt-2">
              Warning: Total target percentages must add up to exactly 100% (Current total: {targetEquity + targetDebt + targetGold + targetRealEstate + targetCash}%).
            </p>
          )}
        </div>

        {/* Danger Zone Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-rose-100 pb-3">
            <AlertOctagon className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-600">Danger Zone & Panic Purge</h2>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Wipe or Hard Purge Database</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Permanently delete all your transactions, budgets, loans, and assets from the browser cache or hard delete them from the PostgreSQL server. <strong>This action cannot be undone.</strong>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={handleWipeData}
                disabled={isWiping}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Wipe Local Cache
              </button>
              <button
                onClick={handleServerPurge}
                disabled={isServerPurging}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <AlertOctagon className="h-3.5 w-3.5" /> {isServerPurging ? 'Purging...' : 'Panic Purge (Server)'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
