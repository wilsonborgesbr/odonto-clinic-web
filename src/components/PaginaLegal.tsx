import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BokkaMark } from './BokkaMark';

export interface SecaoLegal {
  titulo: string;
  /** Parágrafos da seção. */
  paragrafos?: ReactNode[];
  /** Lista com marcadores, depois dos parágrafos. */
  itens?: ReactNode[];
}

interface PaginaLegalProps {
  titulo: string;
  /** Texto de apoio abaixo do título (ex.: data da última atualização). */
  atualizacao: string;
  introducao?: ReactNode;
  secoes: SecaoLegal[];
  /** Link para a outra página legal, mostrado no rodapé. */
  outra: { para: string; rotulo: string };
}

/**
 * Casca simples das páginas públicas de texto legal (privacidade e termos).
 * Provisória: será restilizada junto com a landing page do Bokka.
 */
export const PaginaLegal = ({ titulo, atualizacao, introducao, secoes, outra }: PaginaLegalProps) => (
  <div className="min-h-screen bg-bokka-page">
    <header className="border-b border-bokka-border bg-bokka-surface">
      <div className="mx-auto flex w-full max-w-[760px] items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/login" aria-label="Bokka, ir para o login" className="inline-flex">
          <BokkaMark size={32} withWordmark />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Voltar
        </Link>
      </div>
    </header>

    <main className="mx-auto w-full max-w-[760px] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-bokka-ink">{titulo}</h1>
      <p className="mt-2 text-sm text-bokka-ink-3">{atualizacao}</p>

      {introducao && <div className="mt-6 text-[15px] leading-relaxed text-bokka-ink-2">{introducao}</div>}

      <div className="mt-8 space-y-8">
        {secoes.map((s, i) => (
          <section key={s.titulo} aria-labelledby={`sec-${i}`}>
            <h2 id={`sec-${i}`} className="text-lg font-semibold text-bokka-ink">
              {i + 1}. {s.titulo}
            </h2>
            <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-bokka-ink-2">
              {s.paragrafos?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.itens && (
                <ul className="list-disc space-y-1.5 pl-5">
                  {s.itens.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-bokka-border pt-6 text-sm text-bokka-ink-3">
        <span>Bokka · sistema de gestão para clínicas e consultórios odontológicos</span>
        <Link
          to={outra.para}
          className="font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover"
        >
          {outra.rotulo}
        </Link>
      </footer>
    </main>
  </div>
);
