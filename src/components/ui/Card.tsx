import type { HTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn, MASKED_CURRENCY } from '../../lib/utils';
import { useFinancialVisibility } from '../../context/FinancialVisibilityContext';

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

// ============ VISIBILITY TOGGLE (privacidade de valores financeiros) ============

/** Botão de olho que liga/desliga a visibilidade global dos valores financeiros — o mesmo
 * estado (contexto + localStorage) é compartilhado por todo card sensível em qualquer
 * página, então clicar em qualquer um sincroniza todos os outros. */
export const VisibilityToggle = ({ className }: { className?: string }) => {
  const { visible, toggleVisible } = useFinancialVisibility();
  const label = visible ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros';
  return (
    <button
      type="button"
      onClick={toggleVisible}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1.5 tv:p-2 -m-1 text-bokka-ink-3 hover:text-bokka-ink hover:bg-bokka-surface-3 transition-colors shrink-0',
        className,
      )}
      aria-label={label}
      aria-pressed={!visible}
      title={label}
    >
      <span key={visible ? 'on' : 'off'} className="inline-flex animate-[bokka-eye-pop_200ms_ease-out]">
        {visible ? (
          <Eye className="w-3.5 h-3.5 tv:w-4 tv:h-4" strokeWidth={2} />
        ) : (
          <EyeOff className="w-3.5 h-3.5 tv:w-4 tv:h-4" strokeWidth={2} />
        )}
      </span>
    </button>
  );
};

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
  /** Card mostra valor financeiro sensível — ganha o botão de olho e respeita o toggle
   * global de privacidade. Não usar em cards de contagem (agendamentos, confirmadas etc). */
  sensitive?: boolean;
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
  sensitive,
}: KpiCardProps) => {
  const { visible } = useFinancialVisibility();
  const masked = sensitive && !visible;
  return (
    <div
      className={cn(
        '@container bg-bokka-surface border border-bokka-border rounded-2xl p-5 tv:p-7 shadow-sm',
        'flex flex-col gap-4 tv:gap-5 min-w-0',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 min-w-0">
          <span className="text-sm tv:text-base font-medium text-bokka-ink-3 truncate">{label}</span>
          {sensitive && <VisibilityToggle />}
        </span>
        <span
          className={cn(
            'w-9 h-9 tv:w-11 tv:h-11 rounded-lg flex items-center justify-center shrink-0',
            toneIconClasses[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        {loading ? (
          <span className="inline-block w-20 h-9 rounded-md bg-bokka-surface-3 animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2 min-w-0">
            {/* clamp() em cqw prende a fonte à largura real do card (container query), não à
                largura da viewport — evita que o valor monetário vaze do card quando o grid
                espreme colunas (ex: monitor em retrato) e cresce em telas de TV sem precisar
                de mais um breakpoint por contagem de colunas. */}
            <span
              key={masked ? 'masked' : 'visible'}
              className="min-w-0 text-[clamp(1.125rem,9cqw,1.875rem)] tv:text-[clamp(1.75rem,4.5cqw,3rem)] font-bold text-bokka-ink tabular-nums leading-tight tracking-tight break-words animate-[bokka-eye-pop_200ms_ease-out]"
            >
              {masked ? MASKED_CURRENCY : value}
            </span>
            {delta && (
              <span
                className={cn(
                  'text-xs tv:text-sm font-semibold tabular-nums shrink-0',
                  delta.positive ? 'text-bokka-success-ink' : 'text-bokka-danger-ink',
                )}
              >
                {masked ? '••••' : delta.value}
              </span>
            )}
          </div>
        )}
        {hint && <p className="text-xs tv:text-sm text-bokka-ink-3 mt-2">{hint}</p>}
      </div>
    </div>
  );
};
