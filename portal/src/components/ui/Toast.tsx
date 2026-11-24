import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const value: ToastContextType = {
    toast: addToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl border text-xs shadow-apple-md backdrop-blur-xl animate-scale-in transition-all ${
              t.type === 'success'
                ? 'bg-white/95 border-[#34c759]/30 text-[#1d1d1f]'
                : t.type === 'error'
                ? 'bg-white/95 border-[#ff3b30]/30 text-[#dc2626]'
                : 'bg-white/95 border-black/10 text-[#1d1d1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#ff3b30] shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#0071e3] shrink-0" />}
              <span className="font-semibold text-xs leading-snug">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full hover:bg-black/5 transition-colors ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (msg: string) => console.log(msg),
      success: (msg: string) => console.log(msg),
      error: (msg: string) => console.log(msg),
    };
  }
  return ctx;
};
