import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, RefreshCw, X } from 'lucide-react';

export const PWABanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Just now');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-2">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 font-medium px-4 py-2 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff size={14} />
            <span>You are currently offline. Changes will automatically sync when connection returns.</span>
          </div>
          <span className="text-[11px] opacity-80 font-mono">Last sync: {lastSync}</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showBanner && (
        <div className="mx-4 my-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-base">
              P
            </div>
            <div>
              <h4 className="font-bold text-sm">Install Porulalar Wealth App</h4>
              <p className="opacity-90">Add to your home screen for quick offline access & instant push alerts.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="px-3.5 py-1.5 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 transition-saas flex items-center gap-1.5"
            >
              <Download size={14} />
              Install
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white transition-saas"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
