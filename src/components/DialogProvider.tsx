import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, Info, X } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogOptions {
  title?: string;
  message: string;
  defaultValue?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface DialogContextValue {
  showAlert: (message: string, title?: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showPrompt: (message: string, title?: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('alert');
  const [options, setOptions] = useState<DialogOptions>({ message: '' });
  const [inputValue, setInputValue] = useState('');
  
  // Resolve function stores the promise resolver
  const [resolveFn, setResolveFn] = useState<((value: any) => void) | null>(null);

  const showAlert = useCallback((message: string, title?: string, type: 'info' | 'success' | 'warning' | 'error' = 'warning') => {
    return new Promise<void>((resolve) => {
      setDialogType('alert');
      setOptions({ message, title, type });
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setDialogType('confirm');
      setOptions({ message, title, type: 'warning' });
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const showPrompt = useCallback((message: string, title?: string, defaultValue: string = '') => {
    return new Promise<string | null>((resolve) => {
      setDialogType('prompt');
      setOptions({ message, title, defaultValue, type: 'info' });
      setInputValue(defaultValue);
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleClose = (value: any = null) => {
    setIsOpen(false);
    if (resolveFn) {
      resolveFn(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClose(inputValue);
  };

  const getIcon = () => {
    if (dialogType === 'prompt' || dialogType === 'confirm') return <HelpCircle className="h-6 w-6 text-indigo-500" />;
    
    switch (options.type) {
      case 'success': return <CheckCircle className="h-6 w-6 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-6 w-6 text-rose-500" />;
      case 'info': return <Info className="h-6 w-6 text-sky-500" />;
      case 'warning':
      default: return <AlertCircle className="h-6 w-6 text-amber-500" />;
    }
  };

  const getTitle = () => {
    if (options.title) return options.title;
    if (dialogType === 'prompt') return 'Input Required';
    if (dialogType === 'confirm') return 'Confirmation';
    
    switch (options.type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'info': return 'Information';
      case 'warning':
      default: return 'Warning';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => dialogType === 'alert' ? handleClose() : handleClose(dialogType === 'confirm' ? false : null)}
          />
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-2 bg-slate-50 rounded-full border border-slate-100">
                  {getIcon()}
                </div>
                
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-slate-900 text-lg">{getTitle()}</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                    {options.message}
                  </p>
                  
                  {dialogType === 'prompt' && (
                    <form onSubmit={handleSubmit} className="mt-4">
                      <input
                        type="text"
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Enter value..."
                      />
                    </form>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              {dialogType === 'alert' ? (
                <button
                  onClick={() => handleClose()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
                >
                  OK
                </button>
              ) : dialogType === 'confirm' ? (
                <>
                  <button
                    onClick={() => handleClose(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleClose(null)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
