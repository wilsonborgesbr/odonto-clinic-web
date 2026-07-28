import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
}

export const Card = ({ className, padded = true, children, ...rest }: CardProps) => (
  <div
    className={cn(
      'bg-bokka-surface border border-bokka-border rounded-xl shadow-sm',
      padded && 'p-5',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const CardHeader = ({ title, subtitle, action, className }: CardHeaderProps) => (
  <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-bokka-ink truncate">{title}</h2>
      {subtitle && <p className="text-xs text-bokka-ink-3 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ============ KPI CARD ============

type KpiTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  tone?: KpiTone;
  delta?: { value: string; positive?: boolean };
  loading?: boolean;
  className?: string;
}

const toneIconClasses: Record<KpiTone, string> = {
  primary: 'bg-bokka-primary-soft text-bokka-primary',
  success: 'bg-bokka-success-soft text-bokka-success-ink',
  warning: 'bg-bokka-warning-soft text-bokka-warning-ink',
  danger: 'bg-bokka-danger-soft text-bokka-danger-ink',
  neutral: 'bg-bokka-neutral-soft text-bokka-neutral-ink',
};

export const KpiCard = ({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  delta,
  loading,
  className,
}: KpiCardProps) => (
  <div
    className={cn(
      'bg-bokka-surface border border-bokka-border rounded-2xl p-5 shadow-sm',
      'flex flex-col gap-4',
      className,
    )}
  >
    <div className="flex items-start justify-between">
      <span className="text-sm font-medium text-bokka-ink-3">{label}</span>
      <span
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          toneIconClasses[tone],
        )}
      >
        {icon}
      </span>
    </div>
    <div>
      {loading ? (
        <span className="inline-block w-20 h-9 rounded-md bg-bokka-surface-3 animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-[30px] font-bold text-bokka-ink tabular-nums leading-none tracking-tight">
            {value}
          </span>
          {delta && (
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                delta.positive ? 'text-bokka-success-ink' : 'text-bokka-danger-ink',
              )}
            >
              {delta.value}
            </span>
          )}
        </div>
      )}
      {hint && <p className="text-xs text-bokka-ink-3 mt-2">{hint}</p>}
    </div>
  </div>
);
