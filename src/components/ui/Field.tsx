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

// ============ CURRENCY INPUT ============

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  currencyPrefix?: string;
  allowEmpty?: boolean;
}

const formatBrl = (value: number): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Input monetário no padrão brasileiro. O usuário digita apenas dígitos —
 * cada tecla vira mais um centavo. Ex.: digitando "4526" → mostra "45,26".
 * Store: número em reais (não em centavos). Backend recebe Double.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      label,
      hint,
      error,
      containerClassName,
      value,
      onChange,
      currencyPrefix = 'R$',
      allowEmpty = true,
      className,
      id,
      placeholder = '0,00',
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const display =
      value == null || (value === 0 && allowEmpty) ? '' : formatBrl(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      if (!digits) {
        onChange(allowEmpty ? undefined : 0);
        return;
      }
      const cents = parseInt(digits, 10);
      onChange(cents / 100);
    };

    return (
      <FieldWrap
        label={label}
        hint={hint}
        error={error}
        required={rest.required}
        className={containerClassName}
        id={inputId}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bokka-ink-3 text-sm font-semibold pointer-events-none">
            {currencyPrefix}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            className={cn(
              inputBase,
              'pl-10 tabular-nums text-right',
              error
                ? 'border-bokka-danger focus-visible:outline-bokka-danger'
                : 'border-bokka-border-strong',
              className,
            )}
            value={display}
            onChange={handleChange}
            {...rest}
          />
        </div>
      </FieldWrap>
    );
  },
);

// ============ INPUTS MASCARADOS BR ============

interface MaskedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  value: string | undefined | null;
  onChange: (value: string) => void;
}

const onlyDigits = (s: string) => s.replace(/\D/g, '');

// CPF: XXX.XXX.XXX-XX (11 dígitos)
const formatCpf = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const CpfInput = forwardRef<HTMLInputElement, MaskedInputProps>(function CpfInput(
  { label, hint, error, containerClassName, value, onChange, className, id, ...rest },
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
      className={containerClassName}
      id={inputId}
    >
      <input
        ref={ref}
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        maxLength={14}
        value={formatCpf(value ?? '')}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        className={cn(
          inputBase,
          'tabular-nums',
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

// CEP: XXXXX-XXX (8 dígitos)
const formatCep = (v: string): string => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

export const CepInput = forwardRef<HTMLInputElement, MaskedInputProps>(function CepInput(
  { label, hint, error, containerClassName, value, onChange, className, id, ...rest },
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
      className={containerClassName}
      id={inputId}
    >
      <input
        ref={ref}
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        maxLength={9}
        value={formatCep(value ?? '')}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        className={cn(
          inputBase,
          'tabular-nums',
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

// Telefone/celular BR:
//  - Fixo: (XX) XXXX-XXXX — 10 dígitos
//  - Celular: (XX) XXXXX-XXXX — 11 dígitos (9 como primeiro do número)
const formatPhoneBr = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

interface PhoneInputProps extends MaskedInputProps {
  /** Padrão: 'celular'. Use 'fixo' para (XX) XXXX-XXXX ou 'auto' para detectar. */
  variant?: 'celular' | 'fixo' | 'auto';
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    label,
    hint,
    error,
    containerClassName,
    value,
    onChange,
    variant = 'auto',
    className,
    id,
    placeholder,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const defaultPlaceholder =
    variant === 'fixo' ? '(00) 0000-0000' : '(00) 00000-0000';
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      className={containerClassName}
      id={inputId}
    >
      <input
        ref={ref}
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder ?? defaultPlaceholder}
        maxLength={15}
        value={formatPhoneBr(value ?? '')}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        className={cn(
          inputBase,
          'tabular-nums',
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
