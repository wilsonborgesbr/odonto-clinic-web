import { useId } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  GRUPOS_CONDICAO,
  condicaoAdmiteFaces,
  condicaoColor,
  condicaoLabel,
} from '../../lib/odontogramaGeom';
import { faceDaLetra, letrasDoDente, nomeDaFace } from '../../lib/dentes';
import type { CondicaoDenteEnum, DenteStatus, FaceDenteEnum } from '../../types';
import { SelectChevron, inputBase } from '../ui/Field';
import { AmostraCor } from '../ui/AmostraCor';

interface PainelDenteProps {
  dente: string;
  /** Como o dente está registrado no odontograma escolhido. */
  atual?: DenteStatus;
  /** Condição escolhida agora (undefined = manter como está). */
  condicao?: CondicaoDenteEnum;
  /** Faces escolhidas agora. */
  faces: FaceDenteEnum[];
  comCondicao: boolean;
  /** Celular: alvos de 44 px. */
  grande: boolean;
  onCondicao: (c: CondicaoDenteEnum | undefined) => void;
  onFace: (face: FaceDenteEnum) => void;
  onRemover: () => void;
}

/**
 * Painel do dente selecionado, compacto: uma caixa de condição (opcional, nunca pré-marcada) e as faces como chips
 * com nome. Sem diagrama: o dente já está desenhado no odontograma logo acima. Faces só valem para as condições que
 * admitem faces; numa condição de dente inteiro os chips somem e entra uma linha explicando.
 */
export const PainelDente = ({
  dente,
  atual,
  condicao,
  faces,
  comCondicao,
  grande,
  onCondicao,
  onFace,
  onRemover,
}: PainelDenteProps) => {
  const idCondicao = useId();
  const efetiva = condicao ?? atual?.condicao;
  const admite = condicaoAdmiteFaces(efetiva);
  const altura = grande ? 'h-11' : 'h-9';

  return (
    <section
      aria-label={`Dente ${dente}`}
      className="mt-3 rounded-xl border border-bokka-field-edge bg-bokka-surface p-3 space-y-3 max-w-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-bokka-ink flex flex-wrap items-center gap-2">
          <span>
            Dente <span className="tabular-nums">{dente}</span>
          </span>
          {atual?.condicao ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-bokka-field-edge px-2 py-0.5 text-xs font-semibold"
              style={{ color: condicaoColor(atual.condicao).textInk }}
            >
              <AmostraCor cor={condicaoColor(atual.condicao).fill} forma="quadrado" tamanho={10} />
              Hoje: {condicaoLabel(atual.condicao)}
            </span>
          ) : (
            <span className="text-xs font-medium text-bokka-ink-3">Sem condição registrada</span>
          )}
        </p>
        <button
          type="button"
          onClick={onRemover}
          className={cn(
            'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-semibold hover:bg-bokka-danger-soft transition-colors',
            altura,
          )}
        >
          {/* A cor vai no span: `button { color: inherit }` (index.css) vence utilitário de texto no próprio botão. */}
          <span className="inline-flex items-center gap-1 text-bokka-danger-ink">
            <X className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
            Remover dente
          </span>
        </button>
      </div>

      <div className={cn('grid gap-3 items-start', comCondicao && 'sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]')}>
        {comCondicao && (
          <div>
            <label htmlFor={idCondicao} className="block text-xs font-semibold text-bokka-ink mb-1">
              Condição <span className="font-medium text-bokka-ink-3">(opcional)</span>
            </label>
            <div className="relative">
              <select
                id={idCondicao}
                value={condicao ?? ''}
                onChange={(e) => onCondicao((e.target.value || undefined) as CondicaoDenteEnum | undefined)}
                className={cn(inputBase, 'appearance-none pr-9 border-bokka-field-edge', grande && 'h-11')}
              >
                <option value="">
                  Manter como está ({atual?.condicao ? condicaoLabel(atual.condicao) : 'sem condição'})
                </option>
                {GRUPOS_CONDICAO.map((g) => (
                  <optgroup key={g.titulo} label={g.titulo}>
                    {g.condicoes.map((c) => (
                      <option key={c} value={c}>
                        {condicaoLabel(c)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <SelectChevron className="absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        <div role="group" aria-label={`Faces do dente ${dente}`}>
          <p className="text-xs font-semibold text-bokka-ink mb-1">Faces</p>
          {admite ? (
            <div className="flex flex-wrap gap-1.5">
              {letrasDoDente(dente).map((letra) => {
                const face = faceDaLetra(letra, dente);
                const marcada = faces.includes(face);
                const nome = nomeDaFace(letra, dente);
                return (
                  <button
                    key={letra}
                    type="button"
                    aria-pressed={marcada}
                    onClick={() => onFace(face)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md border px-2.5 text-xs font-semibold transition-colors',
                      grande ? 'h-11 min-w-11' : 'h-9',
                      marcada
                        ? 'bg-bokka-ink border-bokka-ink'
                        : 'bg-bokka-surface-2 border-bokka-field-edge hover:bg-bokka-surface-3',
                    )}
                  >
                    {/* Cor no span: `button { color: inherit }` vence utilitário de texto no próprio botão. */}
                    <span className={cn('inline-flex items-center gap-1', marcada ? 'text-bokka-surface' : 'text-bokka-ink-2')}>
                      {marcada && <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />}
                      {nome}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-bokka-ink-2 leading-relaxed">
              {condicao
                ? `${condicaoLabel(condicao)} vale para o dente todo: faces não se aplicam e não são enviadas.`
                : `Está como ${atual?.condicao ? condicaoLabel(atual.condicao) : 'dente inteiro'} (vale para o dente todo). Para marcar faces, escolha Cárie, Restauração, Fratura ou Selante.`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
