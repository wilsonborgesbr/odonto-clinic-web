import { useId, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface InputOtpProps {
  /** Só dígitos, de 0 a `length` caracteres. */
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Texto visível acima das casas; também nomeia o grupo para o leitor de tela. */
  label: string;
  /** Mensagem de erro: aparece abaixo, é anunciada pelo leitor de tela e marca as casas como inválidas. */
  error?: string;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const soDigitos = (v: string): string => v.replace(/\D/g, '');

/**
 * Campo de código com uma casa por dígito (ex.: 6). Só aceita números, avança sozinho ao digitar,
 * Backspace volta, setas navegam e colar "849 201" ou "849-201" limpa e preenche as casas.
 * `autocomplete="one-time-code"` deixa o celular sugerir o código recebido por SMS.
 */
export const InputOtp = ({
  value,
  onChange,
  length = 6,
  label,
  error,
  hint,
  disabled,
  autoFocus,
  className,
}: InputOtpProps) => {
  const id = useId();
  const labelId = `${id}-rotulo`;
  const erroId = `${id}-erro`;
  const dicaId = `${id}-dica`;
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const casas = Array.from({ length }, (_, i) => value[i] ?? '');

  const focar = (i: number) => {
    const alvo = refs.current[Math.max(0, Math.min(length - 1, i))];
    alvo?.focus();
    alvo?.select();
  };

  /**
   * Coloca `digitos` a partir da casa `inicio` e leva o foco para depois do último dígito colocado.
   * O valor é sempre contíguo (sem casa vazia no meio), então clicar numa casa além da próxima livre
   * escreve na próxima livre.
   */
  const preencher = (inicio: number, digitos: string) => {
    const ini = Math.min(inicio, value.length);
    const novo = (value.slice(0, ini) + digitos + value.slice(ini + digitos.length)).slice(0, length);
    onChange(novo);
    focar(ini + digitos.length);
  };

  const aoDigitar = (i: number, bruto: string) => {
    let digitos = soDigitos(bruto);
    if (digitos === '') {
      // Apagou o conteúdo da casa: os dígitos seguintes andam uma casa para trás.
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    // Casa já preenchida + dígito novo ("52"): vale só o novo.
    if (digitos.length === 2 && casas[i] && digitos.startsWith(casas[i])) digitos = digitos[1];
    preencher(i, digitos);
  };

  const aoTeclar = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !casas[i] && i > 0) {
      e.preventDefault();
      onChange(value.slice(0, i - 1) + value.slice(i));
      focar(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focar(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focar(i + 1);
    }
  };

  const aoColar = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digitos = soDigitos(e.clipboardData.getData('text')).slice(0, length);
    if (!digitos) return;
    // Código completo cola desde a primeira casa, não importa em qual casa o cursor estava.
    preencher(digitos.length === length ? 0 : i, digitos);
  };

  const descrito = [error ? erroId : null, hint ? dicaId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span id={labelId} className="text-sm font-medium text-bokka-ink-2">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} aria-describedby={descrito} className="flex gap-2">
        {casas.map((digito, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            enterKeyHint="done"
            aria-label={`${label}, dígito ${i + 1} de ${length}`}
            aria-invalid={!!error}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            value={digito}
            onChange={(e) => aoDigitar(i, e.target.value)}
            onKeyDown={(e) => aoTeclar(i, e)}
            onPaste={(e) => aoColar(i, e)}
            onFocus={(e) => e.target.select()}
            className={cn(
              'min-w-0 flex-1 h-12 rounded-md border bg-bokka-surface text-bokka-ink text-center text-xl font-semibold tabular-nums transition-colors',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
              'disabled:bg-bokka-surface-3 disabled:text-bokka-ink-3 disabled:cursor-not-allowed',
              error
                ? 'border-bokka-danger focus-visible:outline-bokka-danger'
                : 'border-bokka-border-strong focus-visible:outline-bokka-primary-ring',
            )}
          />
        ))}
      </div>
      {error && (
        <span id={erroId} role="alert" className="text-xs text-bokka-danger-ink font-medium">
          {error}
        </span>
      )}
      {hint && (
        <span id={dicaId} className="text-xs text-bokka-ink-3">
          {hint}
        </span>
      )}
    </div>
  );
};
