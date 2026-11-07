import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ChevronLeft, ChevronRight, Grid3X3, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DENTES_INFERIOR, DENTES_SUPERIOR, textoDaSelecao } from '../../lib/dentes';
import type { SelecaoDentes } from '../../lib/dentes';
import { condicaoAdmiteFaces } from '../../lib/odontogramaGeom';
import type { CondicaoDenteEnum, DenteStatus, FaceDenteEnum } from '../../types';
import { Odontograma3D } from '../../pages/odontograma/Odontograma3D';
import { PainelDente } from './PainelDente';

export type { SelecaoDentes };

interface SeletorDenteFaceProps {
  value: SelecaoDentes;
  onChange: (value: SelecaoDentes) => void;
  /** 'unico': clicar em outro dente troca a seleção. 'multiplo': cada clique liga ou desliga o dente. */
  modo?: 'unico' | 'multiplo';
  /** Dentes do odontograma ESCOLHIDO, por número FDI: o arco os desenha e o painel mostra "Hoje: ...". */
  condicoes?: Record<string, DenteStatus | undefined>;
  /** Mostra o seletor de condição no painel do dente. */
  comCondicao?: boolean;
  className?: string;
}

// Escala (1 = tamanho do odontograma completo) abaixo da qual o arco deixa de caber inteiro e passa a rolar.
// Em 0,62 cada dente tem ~36 px de largura útil de toque; abaixo disso o toque fica impreciso.
const ESCALA_LEGIVEL = 0.62;
const LARGURA_COMPLETO = 980;
// Abaixo desta largura aparecem os botões de passo (dente à esquerda/direita, trocar de arcada): o toque no dente
// escalado é impreciso e eles corrigem a seleção com alvos de 44 px.
const LARGURA_COM_PASSOS = 800;

const useCelular = () => {
  const consulta = '(max-width: 639px)';
  const [celular, setCelular] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const aoMudar = () => setCelular(m.matches);
    m.addEventListener('change', aoMudar);
    return () => m.removeEventListener('change', aoMudar);
  }, []);
  return celular;
};

/**
 * Seleção de dente, faces e condição sobre o ODONTOGRAMA COMPLETO de verdade (o mesmo Odontograma3D da tela cheia),
 * escalado para caber, em qualquer tela. Nada de miniatura nem de modo separado no celular: no celular o mesmo arco
 * fica numa escala legível (~36 px por dente) com rolagem horizontal, o botão "Arco inteiro" mostra tudo de uma vez,
 * e os botões de passo corrigem a seleção com alvos de 44 px.
 * Regra visual: a seleção é neutra (ink: halo sólido + pílula no número), nunca o azul clínico; a condição que o
 * usuário está escolhendo aparece no painel (cruz hachurada + selo), e o arco mostra só o que já está registrado.
 */
export const SeletorDenteFace = ({
  value,
  onChange,
  modo = 'multiplo',
  condicoes,
  comCondicao = true,
  className,
}: SeletorDenteFaceProps) => {
  const celular = useCelular();
  const raiz = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(LARGURA_COMPLETO);
  const [foco, setFoco] = useState<string | null>(null);
  const [inteiro, setInteiro] = useState(false);

  useLayoutEffect(() => {
    const el = raiz.current;
    if (!el) return;
    setLargura(el.clientWidth);
    const obs = new ResizeObserver(() => setLargura(el.clientWidth));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const marks = useMemo(() => {
    const m = new Map<string, DenteStatus>();
    Object.entries(condicoes ?? {}).forEach(([k, v]) => {
      if (v) m.set(k, v);
    });
    return m;
  }, [condicoes]);

  // Pré-visualização: o dente selecionado já aparece PINTADO com a condição e as faces que o usuário está escolhendo
  // (mesmo desenho do odontograma completo, sem hachura). O selo e o halo dizem que ainda não foi salvo.
  const marksVisuais = useMemo(() => {
    const m = new Map(marks);
    value.dentes.forEach((d, i) => {
      const base = marks.get(d);
      const faces = value.faces[d];
      const cond = i === 0 ? value.condicao : undefined;
      if (cond === undefined && !(faces && faces.length > 0)) return;
      m.set(d, {
        numeroDente: d,
        condicao: cond ?? base?.condicao,
        faces: faces && faces.length > 0 ? faces : base?.faces,
      });
    });
    return m;
  }, [marks, value]);

  const selecionado = (d: string) => value.dentes.includes(d);
  const focoSelecionado = foco !== null && selecionado(foco) ? foco : null;
  const resumo = textoDaSelecao(value, condicoes, comCondicao);
  const dentroDoArco = (d: string) => raiz.current?.querySelector<SVGGElement>(`[data-dente="${d}"]`);

  const precisaRolar = largura / LARGURA_COMPLETO < ESCALA_LEGIVEL;
  const comPassos = largura < LARGURA_COM_PASSOS;

  // No celular o arco rola: mantém o dente selecionado à vista.
  const atual = value.dentes[0];
  useEffect(() => {
    if (!atual || !precisaRolar || inteiro) return;
    dentroDoArco(atual)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual, precisaRolar, inteiro]);

  const fecharPainel = (devolverFoco: boolean) => {
    const anterior = foco;
    setFoco(null);
    if (devolverFoco && anterior) dentroDoArco(anterior)?.focus();
  };

  const selecionarDente = (d: string) => {
    if (selecionado(d)) {
      setFoco((a) => (a === d ? null : d));
      return;
    }
    if (modo === 'unico') onChange({ dentes: [d], faces: {}, condicao: undefined });
    else onChange({ dentes: [...value.dentes, d], faces: value.faces, condicao: undefined });
    setFoco(d);
  };

  const removerDente = (d: string) => {
    const resto = Object.fromEntries(Object.entries(value.faces).filter(([k]) => k !== d));
    onChange({ dentes: value.dentes.filter((x) => x !== d), faces: resto, condicao: undefined });
    setFoco(null);
  };

  const alternarFace = (d: string, face: FaceDenteEnum) => {
    const atuais = value.faces[d] ?? [];
    const novas = atuais.includes(face) ? atuais.filter((f) => f !== face) : [...atuais, face];
    onChange({ ...value, faces: { ...value.faces, [d]: novas } });
  };

  const escolherCondicao = (d: string, c: CondicaoDenteEnum | undefined) => {
    // Condição de dente inteiro não leva faces: as já marcadas saem junto.
    const limpa = c !== undefined && !condicaoAdmiteFaces(c);
    onChange({ ...value, condicao: c, faces: limpa ? { ...value.faces, [d]: [] } : value.faces });
  };

  // Clicar numa peça da grade de faces do arco: seleciona o dente; com ele já selecionado, alterna a face (se a
  // condição admite faces).
  const clicarFaceNoArco = (d: string, face: FaceDenteEnum) => {
    if (!selecionado(d)) {
      selecionarDente(d);
      return;
    }
    const efetiva = value.condicao ?? marks.get(d)?.condicao;
    if (condicaoAdmiteFaces(efetiva)) alternarFace(d, face);
  };

  // Botões de passo (alvos de 44 px) para corrigir a seleção quando o toque no dente escalado erra.
  const passo = (tipo: 'esquerda' | 'direita' | 'arcada') => {
    const sup = DENTES_SUPERIOR.includes(atual ?? '');
    const arco = sup || !atual ? DENTES_SUPERIOR : DENTES_INFERIOR;
    const i = atual ? arco.indexOf(atual) : -1;
    let destino: string | undefined;
    if (!atual) destino = DENTES_SUPERIOR[0];
    else if (tipo === 'esquerda') destino = arco[Math.max(i - 1, 0)];
    else if (tipo === 'direita') destino = arco[Math.min(i + 1, arco.length - 1)];
    else destino = (sup ? DENTES_INFERIOR : DENTES_SUPERIOR)[i];
    if (!destino) return;
    if (modo === 'unico') onChange({ dentes: [destino], faces: {}, condicao: undefined });
    else onChange({ dentes: [destino], faces: value.faces, condicao: undefined });
    setFoco(destino);
  };

  const botaoPasso = 'inline-flex items-center justify-center gap-1 rounded-lg border border-bokka-field-edge bg-bokka-surface-2 px-3 min-h-11 min-w-11 text-xs font-semibold hover:bg-bokka-surface-3 transition-colors';

  return (
    <div ref={raiz} className={cn('min-w-0', className)}>
      <div className="bg-bokka-surface border border-bokka-border rounded-xl p-2 sm:p-3">
        <div style={{ maxWidth: LARGURA_COMPLETO }} className="mx-auto">
          <Odontograma3D
            superior={DENTES_SUPERIOR}
            inferior={DENTES_INFERIOR}
            marks={marksVisuais}
            selected={focoSelecionado ?? value.dentes[0] ?? null}
            onSelect={selecionarDente}
            onSelectFace={clicarFaceNoArco}
            legenda={false}
            estiloSelecao="neutro"
            teclado
            escalaMinima={inteiro ? 0 : ESCALA_LEGIVEL}
          />
        </div>

        {(comPassos || precisaRolar) && (
          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Ajuste da seleção">
            {comPassos && (
              <>
                <button type="button" onClick={() => passo('esquerda')} className={botaoPasso} aria-label="Dente à esquerda">
                  <ChevronLeft className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  <span className="text-bokka-ink-2">Esquerda</span>
                </button>
                <button type="button" onClick={() => passo('direita')} className={botaoPasso} aria-label="Dente à direita">
                  <span className="text-bokka-ink-2">Direita</span>
                  <ChevronRight className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => passo('arcada')} className={botaoPasso} aria-label="Trocar de arcada (superior e inferior)">
                  <ArrowDownUp className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  <span className="text-bokka-ink-2">Arcada</span>
                </button>
              </>
            )}
            {precisaRolar && (
              <button
                type="button"
                onClick={() => setInteiro((v) => !v)}
                aria-pressed={inteiro}
                className={cn(botaoPasso, 'sm:ml-auto')}
              >
                {inteiro ? (
                  <Minimize2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Maximize2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                )}
                <span className="text-bokka-ink-2">{inteiro ? 'Ampliar' : 'Arco inteiro'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {focoSelecionado && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              fecharPainel(true);
            }
          }}
        >
          <PainelDente
            dente={focoSelecionado}
            atual={condicoes?.[focoSelecionado]}
            condicao={value.condicao}
            faces={value.faces[focoSelecionado] ?? []}
            comCondicao={comCondicao}
            grande={celular}
            onCondicao={(c) => escolherCondicao(focoSelecionado, c)}
            onFace={(f) => alternarFace(focoSelecionado, f)}
            onRemover={() => removerDente(focoSelecionado)}
          />
        </div>
      )}

      {/* Selo em texto: o leitor de tela anuncia a mudança; nada depende só de cor. */}
      <p
        role="status"
        aria-live="polite"
        className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-bokka-field-edge bg-bokka-surface px-2.5 py-1 text-xs font-semibold text-bokka-ink"
      >
        <Grid3X3 className="w-3.5 h-3.5 shrink-0 text-bokka-ink-2" strokeWidth={2} aria-hidden="true" />
        <span className="tabular-nums">{resumo}</span>
      </p>
    </div>
  );
};
