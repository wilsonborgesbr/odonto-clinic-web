import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/utils';

interface FieldWrapProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}

export const FieldWrap = ({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldWrapProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && (
      <label className="text-sm font-medium text-bokka-ink-2">
        {label}
        {required && <span className="text-bokka-danger ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <span className="text-xs text-bokka-danger-ink font-medium">{error}</span>
    ) : hint ? (
      <span className="text-xs text-bokka-ink-3">{hint}</span>
    ) : null}
  </div>
);

// ============ INPUT ============

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  containerClassName?: string;
  fullWidth?: boolean;
}

const inputBase =
  'w-full bg-bokka-surface text-bokka-ink placeholder:text-bokka-ink-3 border rounded-md h-10 px-3 text-sm transition-colors ' +
  'focus:outline-none focus-visible:outline-2 focus-visible:outline-bokka-primary-ring focus-visible:outline-offset-2 ' +
  'disabled:bg-bokka-surface-3 disabled:text-bokka-ink-3 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailingIcon, containerClassName, fullWidth = true, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      className={cn(fullWidth && 'w-full', containerClassName)}
      id={inputId}
    >
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bokka-ink-3 pointer-events-none w-4 h-4 flex items-center">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            leadingIcon && 'pl-9',
            trailingIcon && 'pr-9',
            error
              ? 'border-bokka-danger focus-visible:outline-bokka-danger'
              : 'border-bokka-border-strong',
            className,
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-bokka-ink-3 w-4 h-4 flex items-center">
            {trailingIcon}
          </span>
        )}
      </div>
    </FieldWrap>
  );
});

// ============ TEXTAREA ============

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, containerClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrap label={label} hint={hint} error={error} required={rest.required} className={containerClassName}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rest.rows ?? 3}
        className={cn(
          'w-full bg-bokka-surface text-bokka-ink placeholder:text-bokka-ink-3 border rounded-md p-3 text-sm transition-colors leading-relaxed',
          'focus:outline-none focus-visible:outline-2 focus-visible:outline-bokka-primary-ring focus-visible:outline-offset-2',
          'disabled:bg-bokka-surface-3 disabled:text-bokka-ink-3 disabled:cursor-not-allowed resize-y',
          error
            ? 'border-bokka-danger focus-visible:outline-bokka-danger'
            : 'border-bokka-border-strong',
          className,
        )}
        {...rest}
      />
    </FieldWrap>
  );
});

// ============ SELECT ============

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, containerClassName, options, placeholder, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldWrap label={label} hint={hint} error={error} required={rest.required} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            'appearance-none pr-9 bg-bokka-surface',
            error
              ? 'border-bokka-danger focus-visible:outline-bokka-danger'
              : 'border-bokka-border-strong',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled hidden={rest.value !== ''}>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bokka-ink-3 pointer-events-none"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </FieldWrap>
  );
});
