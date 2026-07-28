import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-bokka-primary text-white hover:bg-bokka-primary-hover active:bg-bokka-primary-hover shadow-sm',
  secondary:
    'bg-bokka-surface text-bokka-ink border border-bokka-border-strong hover:bg-bokka-surface-3 active:bg-bokka-surface-3',
  ghost:
    'bg-transparent text-bokka-ink-2 hover:bg-bokka-surface-3 hover:text-bokka-ink',
  danger:
    'bg-bokka-danger text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-5 text-base gap-2 rounded-lg',
};

const iconSizeMap: Record<Size, string> = {
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    iconRight,
    fullWidth,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap',
        'transition-colors duration-150 ease-out',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className={cn(iconSizeMap[size], 'animate-spin')} />
      ) : (
        icon && <span className={cn(iconSizeMap[size], 'shrink-0 inline-flex items-center justify-center')}>{icon}</span>
      )}
      {children}
      {!loading && iconRight && (
        <span className={cn(iconSizeMap[size], 'shrink-0 inline-flex items-center justify-center')}>{iconRight}</span>
      )}
    </button>
  );
});
