import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  show: (t: Omit<Toast, 'id'>) => void;
  success: (message: string, opts?: Partial<Toast>) => void;
  error: (message: string, opts?: Partial<Toast>) => void;
  info: (message: string, opts?: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...t }]);
      const timeout = t.actionLabel ? 8000 : 4000;
      setTimeout(() => dismiss(id), timeout);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (m, o) => show({ type: 'success', message: m, ...o }),
    error: (m, o) => show({ type: 'error', message: m, ...o }),
    info: (m, o) => show({ type: 'info', message: m, ...o }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border rounded-lg shadow-sm px-4 py-3 text-sm flex items-start gap-3 ${typeStyles[t.type]}`}
          >
            <span className="flex-1">{t.message}</span>
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => {
                  t.onAction!();
                  dismiss(t.id);
                }}
                className="font-semibold underline underline-offset-2 hover:opacity-80"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="text-current opacity-50 hover:opacity-100"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
};
