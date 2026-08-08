import React, { useState } from 'react';
import { v2Service } from '../services/v2Service';
import { Mail, CheckCircle2, Shield, Sparkles, X, Building2, CreditCard, Landmark } from 'lucide-react';

interface GmailOnboardingModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AVAILABLE_BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank', 'IDFC First Bank'];
const AVAILABLE_CARDS = ['HDFC Regalia / Infinia', 'ICICI Amazon Pay', 'SBI SimplyClick', 'Axis Flipkart', 'OneCard', 'Amex Platinum'];
const AVAILABLE_LOANS = ['HDFC Home Loan', 'Bajaj Finance', 'Tata Capital', 'SBI Personal Loan', 'ICICI Auto Loan'];

export const GmailOnboardingModal: React.FC<GmailOnboardingModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedBanks, setSelectedBanks] = useState<string[]>(['HDFC Bank', 'ICICI Bank']);
  const [selectedCards, setSelectedCards] = useState<string[]>(['HDFC Regalia / Infinia']);
  const [selectedLoans, setSelectedLoans] = useState<string[]>(['Bajaj Finance']);
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [configured, setConfigured] = useState<boolean>(false);

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await v2Service.onboardGmail({
        selectedBanks,
        selectedCards,
        selectedLoans,
        targetEmail: targetEmail || 'user@gmail.com'
      });
      setConfigured(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-500/10 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Gmail Financial Statement Setup
              </h2>
              <p className="text-xs text-slate-400">Zero-noise automated statement detection & balance extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {configured ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Financial Statement Ingestion Active!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Porulalar will now automatically detect credit card statements, bank balance alerts, loan EMI confirmations, and salary credits. Shopping emails are strictly ignored.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 text-sm transition"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Select Financial Providers */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                      <Landmark className="w-4 h-4 text-blue-400" /> Which banks do you use?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_BANKS.map((bank) => {
                        const sel = selectedBanks.includes(bank);
                        return (
                          <button
                            key={bank}
                            onClick={() => toggleItem(selectedBanks, setSelectedBanks, bank)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                              sel
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {bank}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-purple-400" /> Which credit cards do you own?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_CARDS.map((card) => {
                        const sel = selectedCards.includes(card);
                        return (
                          <button
                            key={card}
                            onClick={() => toggleItem(selectedCards, setSelectedCards, card)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                              sel
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {card}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-amber-400" /> Which loan providers?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_LOANS.map((loan) => {
                        const sel = selectedLoans.includes(loan);
                        return (
                          <button
                            key={loan}
                            onClick={() => toggleItem(selectedLoans, setSelectedLoans, loan)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                              sel
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {loan}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition flex items-center gap-2"
                    >
                      Next: Connect Email <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Confirm Target Email & Ingestion Scope */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Email Address Receiving Financial Statements</label>
                    <input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Shield className="w-4 h-4 text-emerald-400" /> Ingestion Scope & Privacy Guarantee
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                      <li>Only credit card statements, bank balance alerts, EMIs, and salary credits are processed.</li>
                      <li>Shopping receipts (Amazon, Flipkart, Swiggy, Uber) are strictly filtered out.</li>
                      <li>Balances and due dates update automatically in your CFO dashboard with confidence scores.</li>
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition"
                    >
                      {loading ? 'Configuring Ingestion...' : 'Activate Gmail Sync'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
