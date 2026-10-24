import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn, maskCep, maskCnpj, maskCpf, maskPhone, normalizeEmail } from '../../lib/utils';
import type { PhoneVariant } from '../../lib/utils';

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
  id,
}: FieldWrapProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-bokka-ink-2">
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

export const inputBase =
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
              : 'border-bokka-field-edge',
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
                : 'border-bokka-field-edge',
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

// Todos emitem o valor já no formato canônico (ex.: "123.456.789-09"); vazio vira "".

const maskedInputClass = (error?: string, className?: string) =>
  cn(
    inputBase,
    'tabular-nums',
    error
      ? 'border-bokka-danger focus-visible:outline-bokka-danger'
      : 'border-bokka-field-edge',
    className,
  );

interface MaskedFieldConfig {
  mask: (v: string) => string;
  placeholder: string;
  maxLength: number;
  autoComplete: string;
  /** Padrão 'numeric'; use 'text' quando o campo aceita letras (CNPJ alfanumérico). */
  inputMode?: 'numeric' | 'text';
}

const createMaskedInput = (displayName: string, cfg: MaskedFieldConfig) => {
  const Component = forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedField(
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
          inputMode={cfg.inputMode ?? 'numeric'}
          autoCapitalize={cfg.inputMode === 'text' ? 'characters' : undefined}
          autoComplete={cfg.autoComplete}
          placeholder={cfg.placeholder}
          maxLength={cfg.maxLength}
          value={cfg.mask(value ?? '')}
          onChange={(e) => onChange(cfg.mask(e.target.value))}
          className={maskedInputClass(error, className)}
          {...rest}
        />
      </FieldWrap>
    );
  });
  Component.displayName = displayName;
  return Component;
};

// CPF: 000.000.000-00
export const CpfInput = createMaskedInput('CpfInput', {
  mask: maskCpf,
  placeholder: '000.000.000-00',
  maxLength: 14,
  autoComplete: 'off',
});

// CNPJ: 00.000.000/0000-00 — aceita letras maiúsculas nas 12 primeiras posições (CNPJ alfanumérico)
export const CnpjInput = createMaskedInput('CnpjInput', {
  mask: maskCnpj,
  placeholder: '00.000.000/0000-00',
  maxLength: 18,
  autoComplete: 'off',
  inputMode: 'text',
});

// CEP: 00000-000
export const CepInput = createMaskedInput('CepInput', {
  mask: maskCep,
  placeholder: '00000-000',
  maxLength: 9,
  autoComplete: 'postal-code',
});

// Telefone BR:
//  - celular: (XX) 9XXXX-XXXX — 11 dígitos
//  - fixo: (XX) XXXX-XXXX — 10 dígitos
//  - auto: celular se o número começa com 9 depois do DDD, senão fixo
//  - servico: como auto, e também 0800/0300 ("0800 123 4567")
interface PhoneInputProps extends MaskedInputProps {
  /** Padrão: 'auto'. 'celular' força (XX) 9XXXX-XXXX; 'fixo' força (XX) XXXX-XXXX; 'servico' aceita também 0800/0300. */
  variant?: PhoneVariant;
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
  const defaultPlaceholder = variant === 'fixo' ? '(00) 0000-0000' : '(00) 00000-0000';
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
        value={maskPhone(value ?? '', variant)}
        onChange={(e) => onChange(maskPhone(e.target.value, variant))}
        className={maskedInputClass(error, className)}
        {...rest}
      />
    </FieldWrap>
  );
});

// E-mail: sempre minúsculo e sem espaços nas pontas.
export const EmailInput = forwardRef<HTMLInputElement, MaskedInputProps>(function EmailInput(
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
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={value ?? ''}
        onChange={(e) => onChange(normalizeEmail(e.target.value))}
        className={maskedInputClass(error, className)}
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
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={rest.required}
      className={containerClassName}
      id={inputId}
    >
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
            : 'border-bokka-field-edge',
          className,
        )}
        {...rest}
      />
    </FieldWrap>
  );
});

// ============ SELECT ============

/** Seta dos campos de seleção. Compartilhada por Select e PacienteCombobox. */
export const SelectChevron = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={cn('w-4 h-4 text-bokka-ink-3 pointer-events-none', className)}
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
);

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, containerClassName, options, placeholder, className, id, value, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  // Cadastros vindos da API podem trazer campo nulo; select controlado não aceita null (só '' ou undefined).
  const valor = value === null ? '' : value;
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
        <select
          ref={ref}
          id={inputId}
          value={valor}
          className={cn(
            inputBase,
            'appearance-none pr-9 bg-bokka-surface',
            error
              ? 'border-bokka-danger focus-visible:outline-bokka-danger'
              : 'border-bokka-field-edge',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled hidden={valor !== ''}>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <SelectChevron className="absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
    </FieldWrap>
  );
});
