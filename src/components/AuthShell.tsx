import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { BokkaMark } from './BokkaMark';
import { cn } from '../lib/utils';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  /** Muda quando a tela troca de estado (enviado, válido, inválido...): o foco vai para o título. */
  focusKey?: string;
  children: ReactNode;
}

/** Casca das telas públicas de autenticação (login, recuperação, redefinição, confirmação). */
export const AuthShell = ({ title, subtitle, focusKey, children }: AuthShellProps) => {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const focoAplicadoPara = useRef(focusKey);

  useEffect(() => {
    // Só quando a chave muda: na carga inicial o foco fica com o navegador (ou com o autoFocus do formulário)
    if (focoAplicadoPara.current === focusKey) return;
    focoAplicadoPara.current = focusKey;
    h1Ref.current?.focus();
  }, [focusKey]);

  return (
    <div className="min-h-screen bg-bokka-page flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8 text-center">
          <BokkaMark size={44} />
          <h1
            ref={h1Ref}
            tabIndex={-1}
            className="text-2xl font-bold tracking-tight text-bokka-ink mt-4 focus:outline-none"
          >
            {title}
          </h1>
          {subtitle && <p className="text-sm text-bokka-ink-3 mt-1">{subtitle}</p>}
        </div>

        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-6 shadow-sm space-y-5">
          {children}
        </div>

        <p className="text-xs text-bokka-ink-3 text-center mt-6">
          Bokka · sistema de gestão para clínicas e consultórios odontológicos
        </p>
      </div>
    </div>
  );
};

type TomPainel = 'sucesso' | 'aviso' | 'info';

const chipTom: Record<TomPainel, string> = {
  sucesso: 'bg-bokka-success-soft text-bokka-success-ink',
  aviso: 'bg-bokka-warning-soft text-bokka-warning-ink',
  info: 'bg-bokka-primary-soft text-bokka-primary-text',
};

interface PainelEstadoProps {
  tom: TomPainel;
  icone: ElementType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;
  children: ReactNode;
  /** Botões e links abaixo do texto. */
  acoes?: ReactNode;
  /** Chip maior (confirmação de e-mail). */
  grande?: boolean;
  /** Classes extras no chip (ex.: animação de entrada). */
  chipClassName?: string;
}

/** Bloco de estado (sucesso, aviso, carregando): chip com ícone, texto e ações. Anunciado como status. */
export const PainelEstado = ({
  tom,
  icone: Icone,
  children,
  acoes,
  grande,
  chipClassName,
}: PainelEstadoProps) => (
  <div className="text-center space-y-4" role="status">
    <div
      className={cn(
        'mx-auto rounded-full flex items-center justify-center',
        grande ? 'w-16 h-16' : 'w-14 h-14',
        chipTom[tom],
        chipClassName,
      )}
    >
      <Icone className={grande ? 'w-8 h-8' : 'w-7 h-7'} strokeWidth={1.75} aria-hidden="true" />
    </div>
    <div className="text-sm text-bokka-ink-2 leading-relaxed">{children}</div>
    {acoes}
  </div>
);
