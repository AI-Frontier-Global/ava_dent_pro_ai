import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };

const ToastCtx = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const config: Record<ToastType, { icon: typeof CheckCircle2; bg: string; text: string; ring: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-success-50', text: 'text-success-800', ring: 'ring-success-200' },
  error: { icon: AlertCircle, bg: 'bg-error-50', text: 'text-error-800', ring: 'ring-error-200' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-800', ring: 'ring-blue-200' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col gap-2">
        {toasts.map((t) => {
          const c = config[t.type];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-xl ${c.bg} px-4 py-3 shadow-elev-1 ring-1 ${c.ring} animate-modal-in`}
            >
              <Icon size={20} className={c.text} />
              <span className={`text-sm font-bold ${c.text}`}>{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="mr-2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
