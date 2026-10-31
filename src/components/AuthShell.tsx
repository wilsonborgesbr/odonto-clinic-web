import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { CalendarDays, ClipboardList, Wallet } from 'lucide-react';
import { BokkaMark } from './BokkaMark';
import { SeletorTema } from './SeletorTema';
import { cn } from '../lib/utils';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  /** Muda quando a tela troca de estado (enviado, válido, inválido...): o foco vai para o título. */
  focusKey?: string;
  children: ReactNode;
}

const RECURSOS: { icone: ElementType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>; texto: string }[] = [
  { icone: CalendarDays, texto: 'Agenda com confirmação de consultas' },
  { icone: ClipboardList, texto: 'Odontograma no padrão clínico' },
  { icone: Wallet, texto: 'Financeiro e estoque sob controle' },
];

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
    <div className="min-h-screen bg-bokka-page min-[901px]:grid min-[901px]:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
      <main className="relative flex items-center justify-center px-4 py-8 min-[901px]:px-8 min-[901px]:py-12">
        <div className="w-full max-w-[400px]">
          {/* Celular: o painel de marca some e fica só o ícone em cima do formulário */}
          <div className="flex justify-center mb-7 min-[901px]:hidden">
            <BokkaMark size={48} />
          </div>
          <div className="mb-8 text-center min-[901px]:text-left">
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="text-2xl font-bold tracking-tight text-bokka-ink focus:outline-none"
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

        {/* Canto superior direito (igual ao mockup). Fica por último no HTML: o foco e a leitura começam pelo formulário.
            Some sozinho quando o interruptor do tema está desligado (produção). */}
        <div className="absolute top-6 right-6">
          <SeletorTema />
        </div>
      </main>

      {/* Painel de marca (só em tela larga): marinho nos dois temas. Vem depois do formulário no HTML
          (o foco e a leitura começam pelo formulário) e vai para a esquerda só visualmente. */}
      <aside
        className="relative hidden min-[901px]:flex min-[901px]:order-first flex-col justify-center overflow-hidden px-[72px] py-16 text-white bg-[linear-gradient(160deg,var(--color-bokka-marca-1)_0%,var(--color-bokka-marca-2)_45%,var(--color-bokka-marca-3)_100%)]"
      >
        <svg
          viewBox="0 0 1024 1024"
          className="absolute -right-[180px] -bottom-[230px] w-[760px] h-[760px] opacity-[0.07] pointer-events-none"
          aria-hidden="true"
        >
          <path
            d="M 262 520 C 320 660 420 720 500 712 C 600 702 690 560 774 360"
            fill="none"
            stroke="currentColor"
            strokeWidth="100"
            strokeLinecap="round"
          />
        </svg>
        <div className="relative">
          <BokkaMark size={112} withWordmark empilhado wordmarkAltura={58} sobreEscuro />
          <h2 className="mt-11 max-w-[440px] text-[34px] leading-[1.2] font-bold tracking-[-0.02em]">
            A rotina da sua clínica, organizada do agendamento ao sorriso.
          </h2>
          <p className="mt-3.5 max-w-[420px] text-[17px] leading-[1.55] text-bokka-marca-texto">
            Agenda, pacientes, odontograma e financeiro no mesmo lugar, para clínicas e consultórios
            odontológicos.
          </p>
          <ul className="mt-9 grid gap-3.5">
            {RECURSOS.map(({ icone: Icone, texto }) => (
              <li
                key={texto}
                className="flex items-center gap-3 text-[15px] font-medium text-bokka-marca-texto-2"
              >
                <span className="inline-flex w-[30px] h-[30px] items-center justify-center text-bokka-marca-icone">
                  <Icone className="w-[17px] h-[17px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </aside>
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
