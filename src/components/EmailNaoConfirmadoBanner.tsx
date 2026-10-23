import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Mail, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EMAIL_AVISO_DISPENSADO_KEY } from '../lib/api';
import { useReenviarConfirmacao } from '../services/authService';
import { useUsuarioMe } from '../services/usuarioService';

const ESPERA_REENVIO_MS = 60_000;

const jaDispensado = (): boolean => {
  try {
    return sessionStorage.getItem(EMAIL_AVISO_DISPENSADO_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Aviso discreto para o proprietário: o e-mail do cadastro ainda não foi confirmado. Permite reenviar
 * o link (o backend limita os pedidos) e pode ser dispensado na sessão.
 */
export const EmailNaoConfirmadoBanner = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const ehDono = user?.role === 'PROPRIETARIO';
  const meQ = useUsuarioMe({ enabled: ehDono });
  const reenviarM = useReenviarConfirmacao();
  const [dispensado, setDispensado] = useState(jaDispensado);
  const [reenviadoEm, setReenviadoEm] = useState<number | null>(null);

  // Depois de 60 s o botão volta (o texto "Enviamos o link" some junto)
  useEffect(() => {
    if (reenviadoEm === null) return;
    const t = window.setTimeout(() => setReenviadoEm(null), ESPERA_REENVIO_MS);
    return () => window.clearTimeout(t);
  }, [reenviadoEm]);

  if (!ehDono || meQ.data?.emailConfirmado !== false || dispensado || pathname === '/confirmar-email') {
    return null;
  }

  const email = meQ.data.email || user?.email;
  const reenviado = reenviadoEm !== null;

  const reenviar = () => {
    reenviarM.mutate(undefined, { onSuccess: () => setReenviadoEm(Date.now()) });
  };

  const dispensar = () => {
    try {
      sessionStorage.setItem(EMAIL_AVISO_DISPENSADO_KEY, '1');
    } catch {
      /* sem sessionStorage: o aviso só some até a próxima navegação completa */
    }
    setDispensado(true);
  };

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-lg border border-bokka-info/30 bg-bokka-info-soft px-3 py-2 text-sm text-bokka-info-ink"
    >
      <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <p className="min-w-0 flex-1">
        {reenviado ? (
          <span className="font-semibold">Enviamos o link. Confira sua caixa de entrada e o spam.</span>
        ) : (
          <>
            <span className="font-semibold">Seu e-mail ainda não foi confirmado.</span>{' '}
            {email && (
              <>
                Enviamos um link para <span className="font-semibold break-all">{email}</span>.{' '}
              </>
            )}
            {reenviarM.isError && (
              <span className="font-semibold text-bokka-danger-ink">
                Não foi possível reenviar agora. Tente de novo em instantes.{' '}
              </span>
            )}
            <button
              type="button"
              onClick={reenviar}
              disabled={reenviarM.isPending}
              className="font-semibold underline underline-offset-2 whitespace-nowrap disabled:opacity-70 disabled:no-underline"
            >
              {reenviarM.isPending ? (
                <>
                  <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                'Reenviar confirmação'
              )}
            </button>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={dispensar}
        aria-label="Dispensar aviso"
        className="-my-2 -ml-2 -mr-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-bokka-info/10 sm:my-0 sm:ml-0 sm:-mr-1 sm:h-7 sm:w-7"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
};
