import type { ReactNode } from 'react';

interface PainelEstadoProps {
  icone: ReactNode;
  titulo: string;
  texto?: string;
  children?: ReactNode;
  /** Erro: role="alert"; vazio: role="status". */
  alerta?: boolean;
}

/** Estado vazio ou de erro que ocupa a área do gráfico (chip com ícone, título, texto e ação). */
export const PainelEstado = ({ icone, titulo, texto, children, alerta }: PainelEstadoProps) => (
  <div
    role={alerta ? 'alert' : 'status'}
    className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center"
  >
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bokka-surface-3 text-bokka-ink-3">
      {icone}
    </span>
    <p className="text-sm font-semibold text-bokka-ink">{titulo}</p>
    {texto && <p className="text-xs text-bokka-ink-3">{texto}</p>}
    {children}
  </div>
);
