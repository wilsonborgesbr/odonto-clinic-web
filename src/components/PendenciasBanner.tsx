import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { PENDENCIAS_DISPENSADO_KEY } from '../lib/api';
import { ROTA_PENDENCIAS, usePodeVerPendencias } from '../hooks/usePodeVerPendencias';
import { usePendenciasCadastro } from '../services/cadastroService';

const lerDispensado = (): number => {
  try {
    return Number(sessionStorage.getItem(PENDENCIAS_DISPENSADO_KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * Aviso discreto e não bloqueante: "N cadastros com dados a corrigir". Pode ser dispensado na
 * sessão; volta se aparecerem mais pendências do que havia quando foi dispensado.
 */
export const PendenciasBanner = () => {
  const habilitado = usePodeVerPendencias();
  const { data } = usePendenciasCadastro({ enabled: habilitado });
  const { pathname } = useLocation();
  const [dispensado, setDispensado] = useState(lerDispensado);

  const total = data?.total ?? 0;
  if (!habilitado || total === 0 || total <= dispensado || pathname === ROTA_PENDENCIAS) {
    return null;
  }

  const dispensar = () => {
    try {
      sessionStorage.setItem(PENDENCIAS_DISPENSADO_KEY, String(total));
    } catch {
      /* sem sessionStorage: o aviso só some até a próxima navegação completa */
    }
    setDispensado(total);
  };

  return (
    <div
      role="status"
      className="mb-4 flex items-center gap-3 rounded-lg border border-bokka-warning/30 bg-bokka-warning-soft px-3 py-2 text-sm text-bokka-warning-ink"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold">
          {total} {total === 1 ? 'cadastro' : 'cadastros'} com dados a corrigir
        </span>{' '}
        <Link to={ROTA_PENDENCIAS} className="whitespace-nowrap font-semibold underline underline-offset-2">
          Ver e corrigir
        </Link>
      </p>
      <button
        type="button"
        onClick={dispensar}
        aria-label="Dispensar aviso"
        className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-bokka-warning/15"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
};
