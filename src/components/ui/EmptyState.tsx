import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-10 px-6' : 'py-16 px-6',
      className,
    )}
  >
    <div className="w-14 h-14 rounded-full bg-bokka-primary-soft text-bokka-primary flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-bokka-ink mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-bokka-ink-3 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
