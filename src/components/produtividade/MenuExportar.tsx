import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, Download, EyeOff, FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { NOMES_FORMATO, type FormatoExportacao } from '../../lib/exportacao';
import { cn } from '../../lib/utils';

interface MenuExportarProps {
  /** O que será exportado, ex.: "Outubro de 2026 · Consultas realizadas". */
  contexto: string;
  /** Métrica financeira com valores ocultos (ou preferência ainda não confirmada). */
  bloqueado: boolean;
  gerando: FormatoExportacao | null;
  /** Gatilho desabilitado (carregando, erro ou período sem dados), com o motivo. */
  indisponivel?: string;
  onExportar: (formato: FormatoExportacao) => void;
  onMostrarValores: () => void;
}

const ITENS: { formato: FormatoExportacao; titulo: string; apoio: string; icone: ReactNode }[] = [
  {
    formato: 'xlsx',
    titulo: 'Excel (.xlsx)',
    apoio: 'Planilha para editar e somar',
    icone: <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    formato: 'pdf',
    titulo: 'PDF (.pdf)',
    apoio: 'Relatório para imprimir ou enviar',
    icone: <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
  },
  {
    formato: 'csv',
    titulo: 'CSV (.csv)',
    apoio: 'Dados simples separados por ;',
    icone: <FileDown className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />,
  },
];

/** Menu Exportar (Excel, PDF, CSV). Serve ao card Produtividade e, depois, ao Fluxo de caixa. */
export const MenuExportar = ({
  contexto,
  bloqueado,
  gerando,
  indisponivel,
  onExportar,
  onMostrarValores,
}: MenuExportarProps) => {
  const ocupado = gerando !== null;
  const desabilitado = ocupado || !!indisponivel;
  return (
    <Menu>
      <MenuButton
        disabled={desabilitado}
        aria-busy={ocupado}
        aria-label={ocupado ? 'Gerando arquivo' : 'Exportar dados'}
        title={indisponivel}
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bokka-focus disabled:opacity-50 disabled:pointer-events-none',
          'bg-bokka-surface-3 text-bokka-ink-2 hover:bg-bokka-hover-strong',
          'sm:h-8 sm:w-auto sm:rounded-lg sm:border sm:border-bokka-border-strong sm:bg-bokka-surface sm:px-3 sm:hover:bg-bokka-hover',
        )}
      >
        {ocupado ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{ocupado ? 'Gerando...' : 'Exportar'}</span>
        {!ocupado && <ChevronDown className="hidden h-3.5 w-3.5 sm:block" strokeWidth={2} aria-hidden="true" />}
      </MenuButton>
      {indisponivel && <span className="sr-only">{indisponivel}</span>}

      <MenuItems
        transition
        anchor={{ to: 'bottom end', gap: 8, padding: 8 }}
        className="z-50 w-56 origin-top-right overflow-y-auto rounded-xl border border-bokka-border bg-bokka-panel text-bokka-ink shadow-md transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 motion-reduce:transition-none"
      >
        {bloqueado ? (
          <div className="mx-1.5 mt-1.5 flex items-center gap-2 rounded-md bg-bokka-surface-2 px-3 py-2 text-xs text-bokka-ink-2">
            <EyeOff className="h-4 w-4 shrink-0 text-bokka-ink-3" strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0 flex-1">Mostre os valores para exportar</span>
          </div>
        ) : (
          <p className="px-3 pb-1.5 pt-3 text-xs text-bokka-ink-3">{contexto}</p>
        )}
        {bloqueado && (
          <MenuItem>
            <button
              type="button"
              onClick={onMostrarValores}
              className="mx-1.5 mt-1 block w-[calc(100%-0.75rem)] rounded-md px-3 py-1.5 text-left text-xs font-semibold text-bokka-link underline data-[focus]:bg-bokka-hover"
            >
              Mostrar valores
            </button>
          </MenuItem>
        )}
        <div className="p-1.5">
          {ITENS.map((item) => (
            <MenuItem key={item.formato} disabled={bloqueado}>
              <button
                type="button"
                onClick={() => onExportar(item.formato)}
                aria-label={`Exportar em ${NOMES_FORMATO[item.formato]}${bloqueado ? ' (indisponível: mostre os valores)' : ''}`}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left',
                  bloqueado
                    ? 'cursor-not-allowed opacity-50'
                    : 'data-[focus]:bg-bokka-primary-soft',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bokka-surface-3 text-bokka-ink-2',
                    !bloqueado && 'group-data-[focus]:bg-bokka-surface group-data-[focus]:text-bokka-link',
                  )}
                >
                  {item.icone}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-bokka-ink">{item.titulo}</span>
                  <span className="block text-xs text-bokka-ink-2">{item.apoio}</span>
                </span>
              </button>
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
};
