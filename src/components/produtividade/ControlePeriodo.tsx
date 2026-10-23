import { Popover, PopoverButton, PopoverPanel, Switch } from '@headlessui/react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { PERIODOS } from '../../lib/produtividade';
import { cn } from '../../lib/utils';
import type { PeriodoProdutividade } from '../../types';

interface ControlePeriodoProps {
  periodo: PeriodoProdutividade;
  rotulo: string;
  anos: number[];
  anoSelecionado: number;
  desabilitado: boolean;
  anteriorDesabilitado: boolean;
  proximoDesabilitado: boolean;
  comparar: boolean;
  onAnterior: () => void;
  onProximo: () => void;
  onPeriodo: (p: PeriodoProdutividade) => void;
  onAno: (ano: number) => void;
  onComparar: (v: boolean) => void;
}

const seta =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bokka-surface-3 text-bokka-ink-2 transition-colors hover:bg-bokka-hover-strong disabled:opacity-40 disabled:pointer-events-none';

/** Um controle só: ‹ Outubro de 2026 ▾ ›. As setas navegam; o centro abre o painel de período. */
export const ControlePeriodo = ({
  periodo,
  rotulo,
  anos,
  anoSelecionado,
  desabilitado,
  anteriorDesabilitado,
  proximoDesabilitado,
  comparar,
  onAnterior,
  onProximo,
  onPeriodo,
  onAno,
  onComparar,
}: ControlePeriodoProps) => {
  const todos = periodo === 'TODOS';
  const mostrarAnos = (periodo === 'MES' || periodo === 'ANO') && anos.length > 0;
  const anosOrdenados = [...anos].sort((a, b) => b - a);

  return (
    <div className="flex w-full items-center gap-1 sm:w-auto">
      {!todos && (
        <button
          type="button"
          className={seta}
          aria-label="Período anterior"
          onClick={onAnterior}
          disabled={desabilitado || anteriorDesabilitado}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      <Popover className="min-w-0 flex-1 sm:flex-none">
        {({ close }) => (
          <>
            <PopoverButton
              disabled={desabilitado}
              className="inline-flex h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-bokka-ink transition-colors hover:bg-bokka-hover data-[open]:bg-bokka-hover disabled:opacity-60 sm:min-w-[9rem]"
            >
              <span className="truncate" aria-live="polite">
                {rotulo}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-bokka-ink-3" strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">. Escolher período</span>
            </PopoverButton>
            <PopoverPanel
              transition
              className="absolute left-0 right-0 top-full z-40 mt-2 origin-top rounded-xl border border-bokka-border bg-bokka-panel p-3 shadow-md transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 sm:left-auto sm:w-72 motion-reduce:transition-none"
            >
              <div className="space-y-3">
                <div
                  role="group"
                  aria-label="Tipo de período"
                  className="grid grid-cols-4 rounded-lg bg-bokka-surface-3 p-0.5"
                >
                  {PERIODOS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={periodo === p.id}
                      aria-label={p.nome}
                      onClick={() => {
                        onPeriodo(p.id);
                        if (p.id === 'TODOS') close();
                      }}
                      className={cn(
                        'h-8 rounded-md text-xs font-semibold transition-colors',
                        periodo === p.id
                          ? 'bg-bokka-surface text-bokka-link shadow-sm'
                          : 'text-bokka-ink-2 hover:text-bokka-ink',
                      )}
                    >
                      {p.rotulo}
                    </button>
                  ))}
                </div>

                {mostrarAnos && (
                  <div role="group" aria-label="Ano" className="grid max-h-32 grid-cols-4 gap-1.5 overflow-y-auto">
                    {anosOrdenados.map((ano) => (
                      <button
                        key={ano}
                        type="button"
                        aria-pressed={ano === anoSelecionado}
                        onClick={() => onAno(ano)}
                        className={cn(
                          'h-8 rounded-md text-xs font-semibold tabular-nums transition-colors',
                          ano === anoSelecionado
                            ? 'bg-bokka-primary text-bokka-on-primary'
                            : 'bg-bokka-surface-3 text-bokka-ink-2 hover:bg-bokka-hover-strong',
                        )}
                      >
                        {ano}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span id="produtividade-comparar" className="text-sm text-bokka-ink-2">
                      Comparar com o período anterior
                    </span>
                    <Switch
                      checked={comparar && !todos}
                      onChange={onComparar}
                      disabled={todos}
                      aria-labelledby="produtividade-comparar"
                      className="group relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-bokka-ink-3 bg-bokka-surface-3 transition-colors data-[checked]:border-bokka-primary data-[checked]:bg-bokka-primary data-[disabled]:opacity-50"
                    >
                      <span className="inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-bokka-on-primary shadow transition-transform group-data-[checked]:translate-x-[18px] motion-reduce:transition-none" />
                    </Switch>
                  </div>
                  {todos && (
                    <p className="mt-1.5 text-xs text-bokka-ink-3">Sem período anterior para comparar.</p>
                  )}
                </div>
              </div>
            </PopoverPanel>
          </>
        )}
      </Popover>

      {!todos && (
        <button
          type="button"
          className={seta}
          aria-label="Próximo período"
          onClick={onProximo}
          disabled={desabilitado || proximoDesabilitado}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
