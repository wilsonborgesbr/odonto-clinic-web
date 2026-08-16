import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { StatusAgendamentoEnum, StatusFinanceiroEnum } from '../../types';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-bokka-success-soft text-bokka-success-ink',
  warning: 'bg-bokka-warning-soft text-bokka-warning-ink',
  danger: 'bg-bokka-danger-soft text-bokka-danger-ink',
  info: 'bg-bokka-info-soft text-bokka-info-ink',
  neutral: 'bg-bokka-neutral-soft text-bokka-neutral-ink',
  primary: 'bg-bokka-primary-soft text-bokka-primary-ink',
};

const dotClasses: Record<BadgeTone, string> = {
  success: 'bg-bokka-success',
  warning: 'bg-bokka-warning',
  danger: 'bg-bokka-danger',
  info: 'bg-bokka-info',
  neutral: 'bg-bokka-ink-3',
  primary: 'bg-bokka-primary',
};

export const Badge = ({ tone = 'neutral', children, dot, className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
      toneClasses[tone],
      className,
    )}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[tone])} />}
    {children}
  </span>
);

// ============ STATUS BADGES (bind to backend enums) ============

const agendamentoStatusMap: Record<StatusAgendamentoEnum, { tone: BadgeTone; label: string }> = {
  AGENDADO: { tone: 'info', label: 'Agendado' },
  CONFIRMADO: { tone: 'success', label: 'Confirmado' },
  REALIZADO: { tone: 'neutral', label: 'Realizado' },
  FALTOU: { tone: 'warning', label: 'Faltou' },
  CANCELADO: { tone: 'danger', label: 'Cancelado' },
};

export const AgendamentoStatusBadge = ({ status }: { status: StatusAgendamentoEnum }) => {
  const cfg = agendamentoStatusMap[status] ?? { tone: 'neutral' as const, label: status };
  return (
    <Badge tone={cfg.tone} dot>
      {cfg.label}
    </Badge>
  );
};

const financeiroStatusMap: Record<string, { tone: BadgeTone; label: string }> = {
  PENDENTE: { tone: 'warning', label: 'Pendente' },
  PARCIAL: { tone: 'info', label: 'Parcial' },
  PAGO: { tone: 'success', label: 'Pago' },
  ATRASADO: { tone: 'danger', label: 'Atrasado' },
  CANCELADO: { tone: 'neutral', label: 'Cancelado' },
};

export const FinanceiroStatusBadge = ({ status }: { status: StatusFinanceiroEnum | 'PARCIAL' }) => {
  const cfg = financeiroStatusMap[status] ?? { tone: 'neutral' as const, label: status };
  return (
    <Badge tone={cfg.tone} dot>
      {cfg.label}
    </Badge>
  );
};
