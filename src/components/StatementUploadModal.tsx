import React, { useState } from 'react';
import { financeService, ParsedStatementItem } from '../services/financeService';
import { porulalarStore } from '../lib/store';
import { FileText, Upload, X, Check, Loader2 } from 'lucide-react';

interface StatementUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function StatementUploadModal({ isOpen, onClose, onImportComplete }: StatementUploadModalProps) {
  const [content, setContent] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedStatementItem[]>([]);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!content.trim()) return;
    setParsing(true);
    try {
      const items = await financeService.parseStatement(content);
      setParsedItems(items);
    } catch (err) {
      console.error('Failed to parse statement:', err);
    } finally {
      setParsing(false);
    }
  };

  const handleImportAll = async () => {
    if (parsedItems.length === 0) return;
    setImporting(true);
    try {
      for (const item of parsedItems) {
        if (item.type === 'Expense') {
          await porulalarStore.addRecord('expenses', {
            date: item.date,
            description: item.description,
            amount: item.amount,
            category: item.category,
            paymentMode: 'Bank Transfer/Card',
          });
        } else {
          await porulalarStore.addRecord('income', {
            date: item.date,
            source: item.description,
            amount: item.amount,
            category: item.category,
          });
        }
      }
      if (onImportComplete) onImportComplete();
      onClose();
    } catch (err) {
      console.error('Error importing statement items:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Import Statement CSV / Text</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {parsedItems.length === 0 ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-400">
              Paste raw CSV text or bank statement lines (Date, Description, Amount, Type).
            </p>
            <textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. 2026-08-01, Swiggy Food, 450, Dr&#10;2026-08-02, Salary Credit, 85000, Cr"
              className="w-full p-3.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={parsing || !content.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Parse Transactions
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-emerald-400 font-medium">
              Successfully parsed {parsedItems.length} draft transaction(s):
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {parsedItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-white">{item.description}</p>
                    <p className="text-slate-400">{item.date} • {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${item.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.type === 'Income' ? '+' : '-'}₹{item.amount.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button onClick={() => setParsedItems([])} className="text-xs font-semibold text-slate-400 hover:text-white">
                Back to Edit
              </button>
              <button
                onClick={handleImportAll}
                disabled={importing}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Import All Transactions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
