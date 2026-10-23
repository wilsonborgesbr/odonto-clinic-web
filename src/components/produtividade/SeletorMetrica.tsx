import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown, Wallet } from 'lucide-react';
import { GRUPOS_METRICA, infoMetrica, type MetricaInfo } from '../../lib/produtividade';
import type { MetricaProdutividade } from '../../types';

interface SeletorMetricaProps {
  metrica: MetricaProdutividade;
  disponiveis: MetricaInfo[];
  onChange: (m: MetricaProdutividade) => void;
}

/** O próprio título do card é o seletor. Com uma única métrica permitida vira texto fixo. */
export const SeletorMetrica = ({ metrica, disponiveis, onChange }: SeletorMetricaProps) => {
  const atual = infoMetrica(metrica);

  if (disponiveis.length <= 1) {
    return <p className="text-base font-semibold text-bokka-ink truncate">{atual.rotulo}</p>;
  }

  return (
    <Listbox value={metrica} onChange={onChange}>
      <ListboxButton
        aria-label={`Métrica: ${atual.rotulo}. Alterar métrica`}
        className="-ml-2 inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-base font-semibold text-bokka-ink transition-colors hover:bg-bokka-hover data-[open]:bg-bokka-hover"
      >
        <span className="truncate">{atual.rotulo}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-bokka-ink-3" strokeWidth={2} aria-hidden="true" />
      </ListboxButton>
      <ListboxOptions
        transition
        className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] origin-top-left overflow-y-auto rounded-xl border border-bokka-border bg-bokka-panel p-1.5 shadow-md transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 sm:right-auto sm:w-80 motion-reduce:transition-none"
      >
        {GRUPOS_METRICA.map((grupo) => {
          const itens = disponiveis.filter((m) => m.grupo === grupo);
          if (itens.length === 0) return null;
          return (
            <div key={grupo} role="group" aria-label={grupo}>
              <p
                aria-hidden="true"
                className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-bokka-ink-3"
              >
                {grupo}
              </p>
              {itens.map((m) => (
                <ListboxOption
                  key={m.id}
                  value={m.id}
                  className="group flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-left data-[focus]:bg-bokka-hover"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-bokka-ink group-data-[selected]:font-semibold">
                      {m.rotulo}
                      {m.financeira && (
                        <Wallet className="h-3.5 w-3.5 text-bokka-ink-3" strokeWidth={1.75} aria-hidden="true" />
                      )}
                    </span>
                    <span className="block text-xs text-bokka-ink-2">{m.descricao}</span>
                  </span>
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-bokka-link invisible group-data-[selected]:visible"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </ListboxOption>
              ))}
            </div>
          );
        })}
      </ListboxOptions>
    </Listbox>
  );
};
