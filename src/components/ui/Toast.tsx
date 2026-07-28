import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Info, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const iconMap: Record<'success' | 'error' | 'info' | 'warning', ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-bokka-success" />,
  error: <XCircle className="w-5 h-5 text-bokka-danger" />,
  info: <Info className="w-5 h-5 text-bokka-primary" />,
  warning: <AlertCircle className="w-5 h-5 text-bokka-warning" />,
};

const buildCustom = (
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  opts?: ToastOptions,
) =>
  toast.custom(
    (t) => (
      <div
        className={`bg-bokka-surface border border-bokka-border rounded-xl shadow-md px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-md transition-all ${
          t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
      >
        <span className="shrink-0 pt-0.5">{iconMap[type]}</span>
        <span className="text-sm text-bokka-ink flex-1 font-medium leading-relaxed">
          {message}
        </span>
        {opts?.actionLabel && opts.onAction && (
          <button
            type="button"
            className="text-sm font-semibold text-bokka-primary hover:text-bokka-primary-hover px-2 py-1 -mr-1 rounded-md whitespace-nowrap"
            onClick={() => {
              opts.onAction!();
              toast.dismiss(t.id);
            }}
          >
            {opts.actionLabel}
          </button>
        )}
      </div>
    ),
    { duration: opts?.duration ?? (opts?.actionLabel ? 8000 : 4000) },
  );

export const bokkaToast = {
  success: (message: string, opts?: ToastOptions) => buildCustom('success', message, opts),
  error: (message: string, opts?: ToastOptions) => buildCustom('error', message, opts),
  info: (message: string, opts?: ToastOptions) => buildCustom('info', message, opts),
  warning: (message: string, opts?: ToastOptions) => buildCustom('warning', message, opts),
};

// Compat com API antiga: useToast().success('...') etc.
export const useToast = () => bokkaToast;

// Provider vazio pra compat com App.tsx antigo; o Toaster real vem do main.tsx
export const ToastProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
