import { useEffect, useId, useState } from 'react';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { Check } from 'lucide-react';
import { FieldWrap, SelectChevron, inputBase } from './ui/Field';
import { usePaciente, usePacientes } from '../services/pacienteService';
import { cn, formatCpf } from '../lib/utils';

interface PacienteOption {
  id: string;
  nomeCompleto: string;
  cpf?: string;
}

interface PacienteComboboxProps {
  value: string;
  onChange: (pacienteId: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  containerClassName?: string;
}

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 250;

/**
 * Seleção de paciente com busca por nome no backend (`GET /api/pacientes?nome=`).
 * Não depende de carregar a lista inteira — funciona com qualquer quantidade de pacientes.
 */
export const PacienteCombobox = ({
  value,
  onChange,
  label = 'Paciente',
  hint,
  error,
  required,
  disabled,
  placeholder = 'Digite o nome para buscar…',
  containerClassName,
}: PacienteComboboxProps) => {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [picked, setPicked] = useState<PacienteOption | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const listQ = usePacientes({ pagina: 0, tamanho: PAGE_SIZE, nome: debouncedQuery });

  // Valor inicial (edição) ou vindo de fora: resolve o nome pelo id, sem depender da lista.
  const needsLookup = !!value && picked?.id !== value;
  const lookupQ = usePaciente(needsLookup ? value : undefined);

  const current: PacienteOption | null = !value
    ? null
    : picked?.id === value
      ? picked
      : lookupQ.data?.id
        ? { id: value, nomeCompleto: lookupQ.data.nomeCompleto, cpf: lookupQ.data.cpf }
        : null;

  const items = listQ.data?.content ?? [];
  const total = listQ.data?.totalElements ?? items.length;
  const searching = query !== debouncedQuery || listQ.isFetching;

  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
      id={inputId}
    >
      <Combobox<PacienteOption | null>
        value={current}
        onChange={(opt) => {
          setPicked(opt);
          onChange(opt?.id ?? '');
        }}
        onClose={() => setQuery('')}
        by="id"
        disabled={disabled}
        immediate
      >
        <div className="relative">
          <ComboboxInput
            id={inputId}
            className={cn(
              inputBase,
              'pr-9',
              error
                ? 'border-bokka-danger focus-visible:outline-bokka-danger'
                : 'border-bokka-border-strong',
            )}
            displayValue={(o: PacienteOption | null) => o?.nomeCompleto ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <ComboboxButton
            className="absolute inset-y-0 right-0 flex items-center px-3 disabled:cursor-not-allowed"
            aria-label="Abrir lista de pacientes"
          >
            <SelectChevron />
          </ComboboxButton>
          {/* Dispara a validação nativa do form quando nenhum paciente foi escolhido. */}
          {required && (
            <input
              tabIndex={-1}
              aria-hidden="true"
              required
              value={value}
              onChange={() => {}}
              className="absolute bottom-0 left-0 h-0 w-full opacity-0 pointer-events-none"
            />
          )}
        </div>

        <ComboboxOptions
          anchor="bottom start"
          className="z-[60] w-(--input-width) max-h-64 overflow-auto rounded-md border border-bokka-border bg-bokka-surface shadow-md py-1 mt-1 text-sm focus:outline-none [--anchor-gap:4px]"
        >
          {listQ.isError ? (
            <div className="px-3 py-2 text-bokka-danger-ink">Erro ao buscar pacientes.</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-2 text-bokka-ink-3">
              {searching ? 'Buscando…' : 'Nenhum paciente encontrado.'}
            </div>
          ) : (
            items.map((p) => (
              <ComboboxOption
                key={p.id}
                value={{ id: p.id, nomeCompleto: p.nomeCompleto, cpf: p.cpf }}
                className="group flex cursor-pointer items-center gap-2 px-3 py-2 text-bokka-ink data-focus:bg-bokka-primary-soft"
              >
                <span className="min-w-0 flex-1 truncate">{p.nomeCompleto}</span>
                {p.cpf && (
                  <span className="shrink-0 text-xs text-bokka-ink-3 tabular-nums">
                    {formatCpf(p.cpf)}
                  </span>
                )}
                <Check
                  className="invisible w-4 h-4 shrink-0 text-bokka-primary group-data-selected:visible"
                  aria-hidden="true"
                />
              </ComboboxOption>
            ))
          )}
          {total > items.length && (
            <div className="border-t border-bokka-border px-3 py-2 text-xs text-bokka-ink-3">
              Mostrando {items.length} de {total} — digite para refinar a busca.
            </div>
          )}
        </ComboboxOptions>
      </Combobox>
    </FieldWrap>
  );
};
