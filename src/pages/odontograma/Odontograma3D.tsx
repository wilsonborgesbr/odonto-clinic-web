import { createContext, useContext, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { CondicaoDenteEnum, DenteStatus, FaceDenteEnum } from '../../types';
import { cn } from '../../lib/utils';
import { AmostraCor } from '../../components/ui/AmostraCor';
import {
  CFG,
  FACE_BOX_SIZE,
  condicaoColor,
  condicaoLabel,
  crownFillColor,
  crownFillMode as resolveCrownFillMode,
  crownOpacity,
  CONDICOES_COM_FACE,
  lowerCrownGeom,
  toothPos,
  upperCrownGeom,
} from '../../lib/odontogramaGeom';
import type { ToothCfg } from '../../lib/odontogramaGeom';
import { FaceGridBox } from '../../components/odontograma/FaceGridBox';

interface Odontograma3DProps {
  superior: string[];
  inferior: string[];
  marks: Map<string, DenteStatus>;
  selected?: string | null;
  onSelect?: (numero: string) => void;
  onSelectFace?: (numero: string, face: FaceDenteEnum) => void;
  readOnly?: boolean;
  /** Legenda das 13 condições embaixo do arco. Padrão: true. */
  legenda?: boolean;
  /** 'neutro': seleção em ink (halo sólido + pílula no número), sem usar o azul clínico. Padrão: 'padrao'. */
  estiloSelecao?: 'padrao' | 'neutro';
  /** Dentes focáveis por teclado (um só tab stop; setas, Home/End, Enter/Espaço). Padrão: false. */
  teclado?: boolean;
  /**
   * Escala responsiva. Sem esta prop o layout é o de sempre (altura fixa de 440 px, largura mínima de 980 px, botões
   * de arcada no celular). Com ela o SVG escala com a largura do contêiner (altura pelo aspecto do viewBox) e só
   * rola na horizontal se a escala cairia abaixo deste valor (1 = tamanho do completo; 0 = sempre cabe inteiro).
   */
  escalaMinima?: number;
}

// Ids dos <defs> levam um prefixo por instância (useId): com o completo atrás de um modal que também desenha o
// odontograma, ids fixos ficariam duplicados no documento.
interface OdoCtxValor {
  p: string;
  neutro: boolean;
  teclado: boolean;
  roving?: string;
  aoTeclar?: (e: KeyboardEvent<SVGGElement>, numero: string) => void;
}
const OdoCtx = createContext<OdoCtxValor>({ p: '', neutro: false, teclado: false });

// ============ Layout constants ============

const SLOT_W = 58;
const MIDLINE_GAP = 12;
const PAD = 20;
const TOTAL_W = 16 * SLOT_W + MIDLINE_GAP + 2 * PAD;

// Vertical zones:
//  0-30    : FDI number (upper)
//  35-105  : upper roots
//  105-165 : upper crown
//  170-200 : upper face grid
//  205-235 : arcade midline zone
//  240-270 : lower face grid
//  275-335 : lower crown
//  335-405 : lower roots
//  410-430 : FDI number (lower)
const UPPER_ROOT_TOP = 35;
const UPPER_NECK = 105;
const UPPER_CROWN_TIP = 165;
const UPPER_FACE_TOP = 172;
const LOWER_FACE_BOTTOM = 268;
const LOWER_CROWN_TOP = 275;
const LOWER_NECK = 335;
const LOWER_ROOT_TIP = 405;
const SVG_H = 440;

function slotX(i: number): number {
  if (i < 8) return PAD + i * SLOT_W;
  return PAD + 8 * SLOT_W + MIDLINE_GAP + (i - 8) * SLOT_W;
}

function toothCx(i: number): number {
  return slotX(i) + SLOT_W / 2;
}

// ============ Root paths (separated per root) ============

function upperRootPaths(cx: number, neckY: number, tipYFar: number, c: ToothCfg): string[] {
  const { nw, upperRoots: n } = c;
  const rh = neckY - tipYFar;
  const tipY = neckY - rh;

  if (n === 1) {
    const rw = nw * 0.75;
    return [
      `M ${cx - nw + 1},${neckY + 1}
       C ${cx - rw},${neckY - rh * 0.45} ${cx - 3},${neckY - rh * 0.85} ${cx},${tipY}
       C ${cx + 3},${neckY - rh * 0.85} ${cx + rw},${neckY - rh * 0.45} ${cx + nw - 1},${neckY + 1} Z`,
    ];
  }
  if (n === 2) {
    const spread = nw * 0.6;
    const rw = nw * 0.35;
    return [
      `M ${cx - nw + 1},${neckY + 1}
       C ${cx - nw - 1},${neckY - rh * 0.35} ${cx - spread - 2},${neckY - rh * 0.75} ${cx - spread},${tipY + rh * 0.05}
       C ${cx - spread + 3},${neckY - rh * 0.7} ${cx - rw - 1},${neckY - rh * 0.35} ${cx - 2},${neckY + 1} Z`,
      `M ${cx + 2},${neckY + 1}
       C ${cx + rw + 1},${neckY - rh * 0.35} ${cx + spread - 3},${neckY - rh * 0.7} ${cx + spread},${tipY + rh * 0.05}
       C ${cx + spread + 2},${neckY - rh * 0.75} ${cx + nw + 1},${neckY - rh * 0.35} ${cx + nw - 1},${neckY + 1} Z`,
    ];
  }
  // 3 roots (upper molar): mesiobuccal, distobuccal, palatal
  const spread = nw * 0.75;
  const rw = nw * 0.28;
  return [
    `M ${cx - nw + 1},${neckY + 1}
     C ${cx - nw - 2},${neckY - rh * 0.35} ${cx - spread - 3},${neckY - rh * 0.8} ${cx - spread},${tipY + rh * 0.02}
     C ${cx - spread + 4},${neckY - rh * 0.7} ${cx - rw - 2},${neckY - rh * 0.35} ${cx - rw + 2},${neckY + 1} Z`,
    `M ${cx - rw + 1},${neckY + 1}
     C ${cx - 3},${neckY - rh * 0.4} ${cx - 2},${neckY - rh * 0.75} ${cx},${tipY + rh * 0.1}
     C ${cx + 2},${neckY - rh * 0.75} ${cx + 3},${neckY - rh * 0.4} ${cx + rw - 1},${neckY + 1} Z`,
    `M ${cx + rw - 2},${neckY + 1}
     C ${cx + rw + 2},${neckY - rh * 0.35} ${cx + spread - 4},${neckY - rh * 0.7} ${cx + spread},${tipY + rh * 0.02}
     C ${cx + spread + 3},${neckY - rh * 0.8} ${cx + nw + 2},${neckY - rh * 0.35} ${cx + nw - 1},${neckY + 1} Z`,
  ];
}

function lowerRootPaths(cx: number, neckY: number, tipYFar: number, c: ToothCfg): string[] {
  const { nw, lowerRoots: n } = c;
  const rh = tipYFar - neckY;
  const tipY = neckY + rh;

  if (n === 1) {
    const rw = nw * 0.75;
    return [
      `M ${cx - nw + 1},${neckY - 1}
       C ${cx - rw},${neckY + rh * 0.45} ${cx - 3},${neckY + rh * 0.85} ${cx},${tipY}
       C ${cx + 3},${neckY + rh * 0.85} ${cx + rw},${neckY + rh * 0.45} ${cx + nw - 1},${neckY - 1} Z`,
    ];
  }
  // 2 roots (lower molar): mesial + distal
  const spread = nw * 0.6;
  const rw = nw * 0.35;
  return [
    `M ${cx - nw + 1},${neckY - 1}
     C ${cx - nw - 1},${neckY + rh * 0.35} ${cx - spread - 2},${neckY + rh * 0.75} ${cx - spread},${tipY - rh * 0.05}
     C ${cx - spread + 3},${neckY + rh * 0.7} ${cx - rw - 1},${neckY + rh * 0.35} ${cx - 2},${neckY - 1} Z`,
    `M ${cx + 2},${neckY - 1}
     C ${cx + rw + 1},${neckY + rh * 0.35} ${cx + spread - 3},${neckY + rh * 0.7} ${cx + spread},${tipY - rh * 0.05}
     C ${cx + spread + 2},${neckY + rh * 0.75} ${cx + nw + 1},${neckY + rh * 0.35} ${cx + nw - 1},${neckY - 1} Z`,
  ];
}

// ============ Gum scallop ============

function buildUpperGum(teeth: string[]): string {
  const pts: { x: number; y: number }[] = [];
  teeth.forEach((_fdi, i) => {
    pts.push({ x: toothCx(i), y: UPPER_NECK - 2 });
  });
  const leftX = PAD - 2;
  const rightX = TOTAL_W - PAD + 2;
  const topY = 30;

  let d = `M ${leftX},${topY} L ${leftX},${UPPER_NECK - 4}`;
  d += ` Q ${pts[0].x - 14},${UPPER_NECK - 4} ${pts[0].x},${UPPER_NECK + 2}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const midX = (prev.x + cur.x) / 2;
    d += ` Q ${midX},${UPPER_NECK - 6} ${cur.x},${UPPER_NECK + 2}`;
  }
  const last = pts[pts.length - 1];
  d += ` Q ${last.x + 14},${UPPER_NECK - 4} ${rightX},${UPPER_NECK - 4}`;
  d += ` L ${rightX},${topY} Z`;
  return d;
}

function buildLowerGum(teeth: string[]): string {
  const pts: { x: number; y: number }[] = [];
  teeth.forEach((_fdi, i) => {
    pts.push({ x: toothCx(i), y: LOWER_NECK + 2 });
  });
  const leftX = PAD - 2;
  const rightX = TOTAL_W - PAD + 2;
  const botY = SVG_H - 10;

  let d = `M ${leftX},${botY} L ${leftX},${LOWER_NECK + 4}`;
  d += ` Q ${pts[0].x - 14},${LOWER_NECK + 4} ${pts[0].x},${LOWER_NECK - 2}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const midX = (prev.x + cur.x) / 2;
    d += ` Q ${midX},${LOWER_NECK + 6} ${cur.x},${LOWER_NECK - 2}`;
  }
  const last = pts[pts.length - 1];
  d += ` Q ${last.x + 14},${LOWER_NECK + 4} ${rightX},${LOWER_NECK + 4}`;
  d += ` L ${rightX},${botY} Z`;
  return d;
}

// ============ Face grid ============

// ============ Individual tooth (upper/lower) ============

interface UpperToothProps {
  index: number;
  numero: string;
  mark?: DenteStatus;
  selected: boolean;
  readOnly?: boolean;
  onClick?: (numero: string) => void;
  onSelectFace?: (numero: string, face: FaceDenteEnum) => void;
}

// Parafuso do implante: cilindro afunilado com ponta arredondada, brilho de metal e roscas discretas (antes era um
// retângulo cinza com 6 riscas escuras, que parecia uma faixa riscada). Fica no lugar das raízes.
const ImplantePost = ({
  cx, neckY, tipY, nw, id, p,
}: { cx: number; neckY: number; tipY: number; nw: number; id: string; p: string }) => {
  const dir = tipY < neckY ? -1 : 1;            // -1: ponta para cima (superior); 1: para baixo (inferior)
  const y0 = neckY - dir * 2;                   // começa um pouco dentro do colo
  const y1 = tipY + dir * 2;                    // ponta
  const wTopo = nw * 0.55;
  const wPonta = nw * 0.32;
  const largura = (t: number) => wTopo + (wPonta - wTopo) * t;
  const yTip = y1 - dir * wPonta;               // onde a lateral reta termina e começa a ponta arredondada
  const contorno = `M ${cx - wTopo},${y0} L ${cx + wTopo},${y0} L ${cx + wPonta},${yTip} Q ${cx},${y1 + dir * wPonta * 0.5} ${cx - wPonta},${yTip} Z`;
  const clip = `${p}impl-${id}`;
  const n = 6;
  return (
    <g pointerEvents="none">
      <defs>
        <clipPath id={clip}><path d={contorno} /></clipPath>
      </defs>
      <path d={contorno} fill={`url(#${p}implante-grad)`} stroke="#64748B" strokeWidth="0.7" strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        {Array.from({ length: n }, (_, i) => {
          const t = (i + 1) / (n + 1);
          const y = y0 + (yTip - y0) * t;
          const w = largura(t) + 1;
          return (
            <g key={i}>
              <line x1={cx - w} y1={y + 1.2} x2={cx + w} y2={y - 1.2} stroke="#475569" strokeOpacity="0.5" strokeWidth="0.8" />
              <line x1={cx - w} y1={y + 2.2} x2={cx + w} y2={y - 0.2} stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="0.6" />
            </g>
          );
        })}
      </g>
    </g>
  );
};

const UpperTooth = ({ index, numero, mark, selected, readOnly, onClick, onSelectFace }: UpperToothProps) => {
  const cx = toothCx(index);
  const cfg = CFG[toothPos(numero)];
  const { p, neutro, teclado, roving, aoTeclar } = useContext(OdoCtx);
  const selCor = neutro ? 'var(--color-bokka-ink)' : 'var(--odo-sel)';
  const condicao = mark?.condicao;
  const faces = mark?.faces ?? [];
  const isAusente = condicao === 'AUSENTE';
  const isDenteIncluso = condicao === 'DENTE_INCLUSO';
  const isExtrair = condicao === 'EXTRAIR' || condicao === 'EXTRACAO_INDICADA';
  const isImplante = condicao === 'IMPLANTE';
  const isEndodontia = condicao === 'EM_TRATAMENTO' || condicao === 'ENDODONTIA';
  const { fill, stroke } = condicaoColor(condicao);

  // Face marcada (CARIE/RESTAURACAO_*/FRATURA/SELANTE) pinta só a face; senão a coroa inteira
  const hasFaceMark = faces.length > 0 && condicao && CONDICOES_COM_FACE.includes(condicao);
  const crownFillMode = resolveCrownFillMode(condicao, faces);

  const crownFill = crownFillColor(crownFillMode, fill);

  const opacity = crownOpacity(condicao);

  const tipY = UPPER_CROWN_TIP;
  const rootTipY = UPPER_ROOT_TOP + (UPPER_NECK - UPPER_ROOT_TOP) * (1 - cfg.rootLen);

  const crownGeom = upperCrownGeom(cx, UPPER_NECK, tipY, cfg);
  const roots = isImplante ? [] : upperRootPaths(cx, UPPER_NECK, rootTipY, cfg);

  return (
    <g
      className={cn(
        !readOnly && 'cursor-pointer group',
        teclado && 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-bokka-focus)]',
      )}
      role={readOnly ? undefined : 'button'}
      aria-label={
        teclado
          ? [
              `Dente ${numero}`,
              condicao && `condição ${condicaoLabel(condicao)}`,
              selected && 'selecionado',
            ]
              .filter(Boolean)
              .join(', ')
          : `Dente ${numero}`
      }
      {...(teclado && !readOnly
        ? {
            tabIndex: roving === numero ? 0 : -1,
            'aria-pressed': selected,
            'data-dente': numero,
            onKeyDown: (e: KeyboardEvent<SVGGElement>) => aoTeclar?.(e, numero),
          }
        : {})}
    >
      {selected && neutro && <rect x={cx - 11} y={8} width={22} height={16} rx={8} fill="var(--color-bokka-ink)" />}
      {/* FDI label */}
      <text
        x={cx}
        y={20}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={selected ? (neutro ? 'var(--color-bokka-surface)' : 'var(--odo-sel)') : 'var(--odo-numero)'}
        fontFamily="system-ui, sans-serif"
        style={{ userSelect: 'none' }}
      >
        {numero}
      </text>

      {/* Hover zone (upper: crown + root region) */}
      <rect
        x={cx - SLOT_W / 2 + 2} y={UPPER_ROOT_TOP - 5}
        width={SLOT_W - 4} height={UPPER_CROWN_TIP - UPPER_ROOT_TOP + 10}
        fill="transparent"
        onClick={() => !readOnly && onClick?.(numero)}
      />

      {/* Selection glow */}
      {selected && (
        <rect
          x={cx - cfg.hw - 6} y={rootTipY - 3}
          width={(cfg.hw + 6) * 2} height={tipY - rootTipY + 6}
          rx="6"
          fill="none"
          stroke={selCor} strokeWidth={neutro ? 2.6 : 1.8} strokeDasharray={neutro ? undefined : '4 3'}
          opacity={neutro ? 1 : 0.7}
          pointerEvents="none"
        />
      )}

      {/* Roots */}
      {roots.map((d, ri) => (
        <g key={ri}>
          <path
            d={d}
            fill={isAusente || isDenteIncluso ? '#E8ECF0' : `url(#${p}dentin-grad)`}
            stroke={isAusente || isDenteIncluso ? '#B0B8C4' : '#B08D5D'}
            strokeWidth="0.7"
            opacity={opacity}
            pointerEvents="none"
          />
          {/* Root canal hint (endodontia — vale pro nome novo e pro legado EM_TRATAMENTO) */}
          {isEndodontia && (
            <path
              d={d.split('Z')[0] + 'Z'}
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.2"
              opacity="0.7"
              transform={`translate(0, 0) scale(0.9)`}
              style={{ transformOrigin: `${cx}px ${(rootTipY + UPPER_NECK) / 2}px` }}
              pointerEvents="none"
            />
          )}
        </g>
      ))}

      {/* Implant post */}
      {isImplante && <ImplantePost cx={cx} neckY={UPPER_NECK} tipY={rootTipY} nw={cfg.nw} id={numero} p={p} />}

      {/* Crown base — filtro pra drop-shadow (esmalte sobre a gengiva) */}
      <path
        d={crownGeom.path}
        fill={crownFill}
        stroke={
          isAusente ? '#B0B8C4'
          : isDenteIncluso ? 'var(--cond-preto-stroke)'
          : (crownFillMode === 'natural' || crownFillMode === 'natural-com-faces' ? '#B0A78F' : stroke)
        }
        strokeDasharray={isDenteIncluso ? '3 2' : undefined}
        strokeWidth="1.1"
        opacity={opacity}
        filter={isAusente ? undefined : `url(#${p}tooth-shadow)`}
        pointerEvents="none"
      />

      {/* Enamel shine + radial highlight = volume 3D */}
      {!isAusente && !isDenteIncluso && crownFillMode !== 'total' && (
        <>
          <path
            d={crownGeom.path}
            fill={`url(#${p}enamel-upper)`}
            opacity="0.7"
            pointerEvents="none"
          />
          {/* Realce radial só em dente natural: coroa pintada (prótese, implante) fica sem mancha branca. */}
          {crownFillMode !== 'coroa-total' && crownFillMode !== 'coroa-implante' && (
            <path
              d={crownGeom.path}
              fill={`url(#${p}tooth-highlight-upper)`}
              pointerEvents="none"
            />
          )}
        </>
      )}

      {/* Fossae/fissures */}
      {!isAusente && !isDenteIncluso && crownGeom.fossae.map((fd, fi) => (
        <path
          key={fi}
          d={fd}
          fill="none"
          stroke={crownFillMode === 'natural' || crownFillMode === 'natural-com-faces' ? '#8A7F5F' : 'rgba(0,0,0,0.35)'}
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.75"
          pointerEvents="none"
        />
      ))}

      {/* Cusp tips (small light dots) */}
      {!isAusente && !isDenteIncluso && crownFillMode === 'natural' && crownGeom.cusps.map((cp, ci) => (
        <circle
          key={ci}
          cx={cp.x} cy={cp.y}
          r="0.9"
          fill="#FFFFFF"
          opacity="0.7"
          pointerEvents="none"
        />
      ))}

      {/* Face-level marks (as overlaid arcs on crown perimeter) (desenhada DEPOIS das fossas e cúspides: a marca da face cobre os pontinhos brancos em vez de ficar salpicada por eles) */}
      {hasFaceMark && faces.map((f) => renderFaceOverlayUpper(f, cx, UPPER_NECK, tipY, cfg, fill, stroke))}

      {/* Ausente / Extrair X */}
      {(isAusente || isExtrair) && (
        <g pointerEvents="none">
          <line
            x1={cx - cfg.hw + 2} y1={UPPER_NECK + 6}
            x2={cx + cfg.hw - 2} y2={tipY - 6}
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1={cx + cfg.hw - 2} y1={UPPER_NECK + 6}
            x2={cx - cfg.hw + 2} y2={tipY - 6}
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5" strokeLinecap="round"
          />
        </g>
      )}

      {/* Face grid box (below crown) */}
      {!isAusente && !isDenteIncluso && (
        <FaceGridBox
          numero={numero}
          x={cx - FACE_BOX_SIZE / 2}
          y={UPPER_FACE_TOP}
          facesMarked={faces}
          isUpper
          isAnterior={cfg.cuspType === 'incisor' || cfg.cuspType === 'canine'}
          condicaoFill={fill}
          condicaoStroke={stroke}
          readOnly={readOnly}
          onSelectFace={onSelectFace}
          parentSelected={selected}
          selCor={selCor}
          acessivel={!teclado}
        />
      )}
    </g>
  );
};

const LowerTooth = ({ index, numero, mark, selected, readOnly, onClick, onSelectFace }: UpperToothProps) => {
  const cx = toothCx(index);
  const cfg = CFG[toothPos(numero)];
  const { p, neutro, teclado, roving, aoTeclar } = useContext(OdoCtx);
  const selCor = neutro ? 'var(--color-bokka-ink)' : 'var(--odo-sel)';
  const condicao = mark?.condicao;
  const faces = mark?.faces ?? [];
  const isAusente = condicao === 'AUSENTE';
  const isDenteIncluso = condicao === 'DENTE_INCLUSO';
  const isExtrair = condicao === 'EXTRAIR' || condicao === 'EXTRACAO_INDICADA';
  const isImplante = condicao === 'IMPLANTE';
  const isEndodontia = condicao === 'EM_TRATAMENTO' || condicao === 'ENDODONTIA';
  const { fill, stroke } = condicaoColor(condicao);

  const hasFaceMark = faces.length > 0 && condicao && CONDICOES_COM_FACE.includes(condicao);
  const crownFillMode = resolveCrownFillMode(condicao, faces);

  const crownFill = crownFillColor(crownFillMode, fill);

  const opacity = crownOpacity(condicao);

  const tipY = LOWER_CROWN_TOP;
  const rootTipY = LOWER_NECK + (LOWER_ROOT_TIP - LOWER_NECK) * cfg.rootLen;

  const crownGeom = lowerCrownGeom(cx, LOWER_NECK, tipY, cfg);
  const roots = isImplante ? [] : lowerRootPaths(cx, LOWER_NECK, rootTipY, cfg);

  return (
    <g
      className={cn(
        !readOnly && 'cursor-pointer group',
        teclado && 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-bokka-focus)]',
      )}
      role={readOnly ? undefined : 'button'}
      aria-label={
        teclado
          ? [
              `Dente ${numero}`,
              condicao && `condição ${condicaoLabel(condicao)}`,
              selected && 'selecionado',
            ]
              .filter(Boolean)
              .join(', ')
          : `Dente ${numero}`
      }
      {...(teclado && !readOnly
        ? {
            tabIndex: roving === numero ? 0 : -1,
            'aria-pressed': selected,
            'data-dente': numero,
            onKeyDown: (e: KeyboardEvent<SVGGElement>) => aoTeclar?.(e, numero),
          }
        : {})}
    >
      {/* Face grid box (above crown) */}
      {!isAusente && !isDenteIncluso && (
        <FaceGridBox
          numero={numero}
          x={cx - FACE_BOX_SIZE / 2}
          y={LOWER_FACE_BOTTOM - FACE_BOX_SIZE}
          facesMarked={faces}
          isUpper={false}
          isAnterior={cfg.cuspType === 'incisor' || cfg.cuspType === 'canine'}
          condicaoFill={fill}
          condicaoStroke={stroke}
          readOnly={readOnly}
          onSelectFace={onSelectFace}
          parentSelected={selected}
          selCor={selCor}
          acessivel={!teclado}
        />
      )}

      {/* Hover zone */}
      <rect
        x={cx - SLOT_W / 2 + 2} y={LOWER_CROWN_TOP - 5}
        width={SLOT_W - 4} height={LOWER_ROOT_TIP - LOWER_CROWN_TOP + 10}
        fill="transparent"
        onClick={() => !readOnly && onClick?.(numero)}
      />

      {/* Selection glow */}
      {selected && (
        <rect
          x={cx - cfg.hw - 6} y={tipY - 3}
          width={(cfg.hw + 6) * 2} height={rootTipY - tipY + 6}
          rx="6"
          fill="none"
          stroke={selCor} strokeWidth={neutro ? 2.6 : 1.8} strokeDasharray={neutro ? undefined : '4 3'}
          opacity={neutro ? 1 : 0.7}
          pointerEvents="none"
        />
      )}

      {/* Roots */}
      {roots.map((d, ri) => (
        <g key={ri}>
          <path
            d={d}
            fill={isAusente || isDenteIncluso ? '#E8ECF0' : `url(#${p}dentin-grad)`}
            stroke={isAusente || isDenteIncluso ? '#B0B8C4' : '#B08D5D'}
            strokeWidth="0.7"
            opacity={opacity}
            pointerEvents="none"
          />
          {/* Root canal hint (endodontia — vale pro nome novo e pro legado EM_TRATAMENTO) */}
          {isEndodontia && (
            <path
              d={d.split('Z')[0] + 'Z'}
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.2"
              opacity="0.7"
              transform={`translate(0, 0) scale(0.9)`}
              style={{ transformOrigin: `${cx}px ${(LOWER_NECK + rootTipY) / 2}px` }}
              pointerEvents="none"
            />
          )}
        </g>
      ))}

      {/* Implant post */}
      {isImplante && <ImplantePost cx={cx} neckY={LOWER_NECK} tipY={rootTipY} nw={cfg.nw} id={numero} p={p} />}

      {/* Crown */}
      <path
        d={crownGeom.path}
        fill={crownFill}
        stroke={
          isAusente ? '#B0B8C4'
          : isDenteIncluso ? 'var(--cond-preto-stroke)'
          : (crownFillMode === 'natural' || crownFillMode === 'natural-com-faces' ? '#B0A78F' : stroke)
        }
        strokeDasharray={isDenteIncluso ? '3 2' : undefined}
        strokeWidth="1.1"
        opacity={opacity}
        filter={isAusente ? undefined : `url(#${p}tooth-shadow)`}
        pointerEvents="none"
      />

      {/* Enamel shine + radial highlight */}
      {!isAusente && !isDenteIncluso && crownFillMode !== 'total' && (
        <>
          <path
            d={crownGeom.path}
            fill={`url(#${p}enamel-lower)`}
            opacity="0.7"
            pointerEvents="none"
          />
          {/* Realce radial só em dente natural: coroa pintada (prótese, implante) fica sem mancha branca. */}
          {crownFillMode !== 'coroa-total' && crownFillMode !== 'coroa-implante' && (
            <path
              d={crownGeom.path}
              fill={`url(#${p}tooth-highlight-lower)`}
              pointerEvents="none"
            />
          )}
        </>
      )}

      {/* Fossae */}
      {!isAusente && !isDenteIncluso && crownGeom.fossae.map((fd, fi) => (
        <path
          key={fi}
          d={fd}
          fill="none"
          stroke={crownFillMode === 'natural' || crownFillMode === 'natural-com-faces' ? '#8A7F5F' : 'rgba(0,0,0,0.35)'}
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.75"
          pointerEvents="none"
        />
      ))}

      {/* Cusp tips */}
      {!isAusente && !isDenteIncluso && crownFillMode === 'natural' && crownGeom.cusps.map((cp, ci) => (
        <circle
          key={ci}
          cx={cp.x} cy={cp.y} r="0.9"
          fill="#FFFFFF" opacity="0.7"
          pointerEvents="none"
        />
      ))}

      {/* Face-level overlays (desenhada DEPOIS das fossas e cúspides: a marca da face cobre os pontinhos brancos em vez de ficar salpicada por eles) */}
      {hasFaceMark && faces.map((f) => renderFaceOverlayLower(f, cx, LOWER_NECK, tipY, cfg, fill, stroke))}

      {/* Ausente/extrair X */}
      {(isAusente || isExtrair) && (
        <g pointerEvents="none">
          <line
            x1={cx - cfg.hw + 2} y1={tipY + 6}
            x2={cx + cfg.hw - 2} y2={LOWER_NECK - 6}
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5" strokeLinecap="round"
          />
          <line
            x1={cx + cfg.hw - 2} y1={tipY + 6}
            x2={cx - cfg.hw + 2} y2={LOWER_NECK - 6}
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5" strokeLinecap="round"
          />
        </g>
      )}

      {selected && neutro && <rect x={cx - 11} y={SVG_H - 22} width={22} height={16} rx={8} fill="var(--color-bokka-ink)" />}
      {/* FDI label */}
      <text
        x={cx}
        y={SVG_H - 10}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={selected ? (neutro ? 'var(--color-bokka-surface)' : 'var(--odo-sel)') : 'var(--odo-numero)'}
        fontFamily="system-ui, sans-serif"
        style={{ userSelect: 'none' }}
      >
        {numero}
      </text>
    </g>
  );
};

// ============ Face overlay renderers (paint the crown region for a specific face) ============

function renderFaceOverlayUpper(
  face: FaceDenteEnum, cx: number, neckY: number, tipY: number, c: ToothCfg,
  fill: string, stroke: string,
) {
  const h = tipY - neckY;
  const hw = c.hw;
  const key = `face-u-${face}`;

  switch (face) {
    case 'MESIAL':
      return (
        <path key={key}
          d={`M ${cx - c.nw},${neckY} C ${cx - c.nw - 1},${neckY + h * 0.4} ${cx - hw},${neckY + h * 0.75} ${cx - hw},${tipY - 3} L ${cx - hw + 5},${tipY - 3} L ${cx - hw * 0.4},${neckY + 3} Z`}
          fill={fill} opacity="0.85" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'DISTAL':
      return (
        <path key={key}
          d={`M ${cx + c.nw},${neckY} C ${cx + c.nw + 1},${neckY + h * 0.4} ${cx + hw},${neckY + h * 0.75} ${cx + hw},${tipY - 3} L ${cx + hw - 5},${tipY - 3} L ${cx + hw * 0.4},${neckY + 3} Z`}
          fill={fill} opacity="0.85" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'OCLUSAL':
    case 'INCISAL':
      return (
        <path key={key}
          d={`M ${cx - hw * 0.85},${tipY - h * 0.22} L ${cx + hw * 0.85},${tipY - h * 0.22} L ${cx + hw * 0.7},${tipY - 1} L ${cx - hw * 0.7},${tipY - 1} Z`}
          fill={fill} opacity="0.85" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'VESTIBULAR':
      return (
        <ellipse key={key}
          cx={cx} cy={neckY + h * 0.5}
          rx={hw * 0.55} ry={h * 0.28}
          fill={fill} opacity="0.7" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'PALATINA':
    case 'LINGUAL':
    case 'CERVICAL':
      return (
        <rect key={key}
          x={cx - hw * 0.5} y={neckY + 2}
          width={hw} height={h * 0.22}
          rx="2"
          fill={fill} opacity="0.75" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
  }
}

function renderFaceOverlayLower(
  face: FaceDenteEnum, cx: number, neckY: number, tipY: number, c: ToothCfg,
  fill: string, stroke: string,
) {
  const h = neckY - tipY;
  const hw = c.hw;
  const key = `face-l-${face}`;

  switch (face) {
    case 'MESIAL':
      return (
        <path key={key}
          d={`M ${cx - c.nw},${neckY} C ${cx - c.nw - 1},${neckY - h * 0.4} ${cx - hw},${neckY - h * 0.75} ${cx - hw},${tipY + 3} L ${cx - hw + 5},${tipY + 3} L ${cx - hw * 0.4},${neckY - 3} Z`}
          fill={fill} opacity="0.85" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'DISTAL':
      return (
        <path key={key}
          d={`M ${cx + c.nw},${neckY} C ${cx + c.nw + 1},${neckY - h * 0.4} ${cx + hw},${neckY - h * 0.75} ${cx + hw},${tipY + 3} L ${cx + hw - 5},${tipY + 3} L ${cx + hw * 0.4},${neckY - 3} Z`}
          fill={fill} opacity="0.85" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'OCLUSAL':
    case 'INCISAL':
      return (
        <path key={key}
          d={`M ${cx - hw * 0.85},${tipY + h * 0.22} L ${cx + hw * 0.85},${tipY + h * 0.22} L ${cx + hw * 0.7},${tipY + 1} L ${cx - hw * 0.7},${tipY + 1} Z`}
          fill={fill} opacity="0.85" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'VESTIBULAR':
      return (
        <ellipse key={key}
          cx={cx} cy={neckY - h * 0.5}
          rx={hw * 0.55} ry={h * 0.28}
          fill={fill} opacity="0.7" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
    case 'PALATINA':
    case 'LINGUAL':
    case 'CERVICAL':
      return (
        <rect key={key}
          x={cx - hw * 0.5} y={neckY - h * 0.22 - 2}
          width={hw} height={h * 0.22}
          rx="2"
          fill={fill} opacity="0.75" stroke={stroke} strokeWidth="0.6" pointerEvents="none"
        />
      );
  }
}

// ============ Main component ============

export const Odontograma3D = ({
  superior,
  inferior,
  marks,
  selected,
  onSelect,
  onSelectFace,
  readOnly,
  legenda = true,
  estiloSelecao = 'padrao',
  teclado = false,
  escalaMinima,
}: Odontograma3DProps) => {
  const upperGum = buildUpperGum(superior);
  const lowerGum = buildLowerGum(inferior);
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const p = `${useId()}-`;
  const ajustavel = escalaMinima !== undefined;

  // Teclado (só com `teclado`): um tab stop só no dente "roving"; setas andam pelo arco, Enter/Espaço selecionam.
  const [rovingManual, setRoving] = useState<string | undefined>(undefined);
  const roving = rovingManual ?? selected ?? superior[0];
  const aoTeclar = (e: KeyboardEvent<SVGGElement>, numero: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(numero);
      return;
    }
    const emCima = superior.includes(numero);
    const arco = emCima ? superior : inferior;
    const i = arco.indexOf(numero);
    let destino: string | undefined;
    if (e.key === 'ArrowRight') destino = arco[Math.min(i + 1, arco.length - 1)];
    else if (e.key === 'ArrowLeft') destino = arco[Math.max(i - 1, 0)];
    else if (e.key === 'ArrowDown') destino = emCima ? inferior[i] : undefined;
    else if (e.key === 'ArrowUp') destino = emCima ? undefined : superior[i];
    else if (e.key === 'Home') destino = arco[0];
    else if (e.key === 'End') destino = arco[arco.length - 1];
    if (!destino) return;
    e.preventDefault();
    setRoving(destino);
    svgRef.current?.querySelector<SVGGElement>(`[data-dente="${destino}"]`)?.focus();
  };

  // Abaixo de md, a área do SVG (altura fixa de SVG_H) fica mais alta que a viewport visível,
  // então a arcada oposta exige scroll vertical além do arrasto horizontal de sempre — os botões
  // Superior/Inferior resolvem os dois de uma vez com 1 toque em vez de arrastar manualmente.
  const jumpTo = (arcada: 'superior' | 'inferior') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: 0,
      top: arcada === 'superior' ? 0 : el.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <OdoCtx.Provider value={{ p, neutro: estiloSelecao === 'neutro', teclado, roving, aoTeclar }}>
    <div>
      <div className={cn('flex gap-2 mb-3 md:hidden', ajustavel && 'hidden')}>
        <button
          type="button"
          onClick={() => jumpTo('superior')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-bokka-surface-2 border border-bokka-border text-xs font-semibold text-bokka-ink-2 hover:border-bokka-primary/40 transition-colors"
        >
          <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} /> Arcada superior
        </button>
        <button
          type="button"
          onClick={() => jumpTo('inferior')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-bokka-surface-2 border border-bokka-border text-xs font-semibold text-bokka-ink-2 hover:border-bokka-primary/40 transition-colors"
        >
          <ArrowDown className="w-3.5 h-3.5" strokeWidth={2} /> Arcada inferior
        </button>
      </div>

      <div
        ref={scrollRef}
        className={
          ajustavel
            ? 'overflow-x-auto'
            : 'overflow-x-auto overflow-y-auto max-h-[280px] md:max-h-none md:overflow-y-visible'
        }
      >
      <div style={{ minWidth: ajustavel ? TOTAL_W * escalaMinima : TOTAL_W }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${TOTAL_W} ${SVG_H}`}
        width="100%"
        height={ajustavel ? undefined : SVG_H}
        style={ajustavel ? { display: 'block', height: 'auto', aspectRatio: `${TOTAL_W} / ${SVG_H}` } : undefined}
        xmlns="http://www.w3.org/2000/svg"
        role={teclado ? 'group' : 'img'}
        aria-label="Odontograma anatômico"
      >
        <defs>
          <linearGradient id={`${p}dentin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-dentina-a)' }} />
            <stop offset="55%" style={{ stopColor: 'var(--odo-dentina-b)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--odo-dentina-c)' }} />
          </linearGradient>
          {/* Metal do parafuso do implante */}
          <linearGradient id={`${p}implante-grad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8794A8" />
            <stop offset="38%" stopColor="#C3CBD7" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          {/* Enamel upper: highlight brilhante no topo + sombra profunda embaixo */}
          <linearGradient id={`${p}enamel-upper`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="1" />
            <stop offset="25%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.5" />
            <stop offset="60%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5C4A2E" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={`${p}enamel-lower`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="1" />
            <stop offset="25%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.5" />
            <stop offset="60%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5C4A2E" stopOpacity="0.28" />
          </linearGradient>
          {/* Radial specular highlight — dá o volume 3D esférico */}
          <radialGradient id={`${p}tooth-highlight-upper`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.85" />
            <stop offset="35%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.15" />
            <stop offset="100%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}tooth-highlight-lower`} cx="35%" cy="70%" r="70%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.85" />
            <stop offset="35%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0.15" />
            <stop offset="100%" style={{ stopColor: 'var(--odo-brilho)' }} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${p}gum-upper`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-gengiva-a)' }} stopOpacity="0.35" />
            <stop offset="55%" style={{ stopColor: 'var(--odo-gengiva-b)' }} stopOpacity="0.8" />
            <stop offset="100%" style={{ stopColor: 'var(--odo-gengiva-c)' }} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`${p}gum-lower`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-gengiva-a)' }} stopOpacity="0.35" />
            <stop offset="55%" style={{ stopColor: 'var(--odo-gengiva-b)' }} stopOpacity="0.8" />
            <stop offset="100%" style={{ stopColor: 'var(--odo-gengiva-c)' }} stopOpacity="0.95" />
          </linearGradient>
          {/* Sombra vermelha suave sob a linha das coroas (papila gengival) */}
          <linearGradient id={`${p}gum-shine-upper`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--odo-gengiva-brilho)' }} stopOpacity="0.5" />
            <stop offset="40%" style={{ stopColor: 'var(--odo-gengiva-brilho)' }} stopOpacity="0.1" />
            <stop offset="100%" style={{ stopColor: 'var(--odo-gengiva-brilho)' }} stopOpacity="0" />
          </linearGradient>
          {/* Drop-shadow do arco — ilumina "de cima" */}
          <filter id={`${p}tooth-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
            <feOffset dx="0" dy="1.6" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.32" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gums — camada de cor + brilho superior pra dar volume */}
        <path d={upperGum} fill={`url(#${p}gum-upper)`} />
        <path d={upperGum} fill={`url(#${p}gum-shine-upper)`} opacity="0.85" />
        <path d={lowerGum} fill={`url(#${p}gum-lower)`} />
        <path d={lowerGum} fill={`url(#${p}gum-shine-upper)`} opacity="0.85" transform={`translate(0 ${SVG_H}) scale(1 -1)`} />

        {/* Quadrant divider (vertical midline) */}
        <line
          x1={PAD + 8 * SLOT_W + MIDLINE_GAP / 2}
          y1={UPPER_ROOT_TOP - 5}
          x2={PAD + 8 * SLOT_W + MIDLINE_GAP / 2}
          y2={LOWER_ROOT_TIP + 5}
          stroke="var(--odo-guia)"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        {/* Occlusion line */}
        <line
          x1={PAD} y1={(UPPER_FACE_TOP + FACE_BOX_SIZE + LOWER_FACE_BOTTOM - FACE_BOX_SIZE) / 2}
          x2={TOTAL_W - PAD} y2={(UPPER_FACE_TOP + FACE_BOX_SIZE + LOWER_FACE_BOTTOM - FACE_BOX_SIZE) / 2}
          stroke="var(--odo-guia)"
          strokeWidth="0.8"
          strokeDasharray="5 4"
          opacity="0.4"
        />

        {/* Upper teeth */}
        {superior.map((numero, i) => (
          <UpperTooth
            key={numero}
            index={i}
            numero={numero}
            mark={marks.get(numero)}
            selected={selected === numero}
            readOnly={readOnly}
            onClick={onSelect}
            onSelectFace={onSelectFace}
          />
        ))}

        {/* Lower teeth */}
        {inferior.map((numero, i) => (
          <LowerTooth
            key={numero}
            index={i}
            numero={numero}
            mark={marks.get(numero)}
            selected={selected === numero}
            readOnly={readOnly}
            onClick={onSelect}
            onSelectFace={onSelectFace}
          />
        ))}
      </svg>
      </div>
      </div>

      {/* Legend — fora da faixa de scroll horizontal/vertical, sempre visível por inteiro */}
      <div className={cn('flex flex-wrap gap-x-4 gap-y-2 pt-4 mt-3 border-t border-bokka-border text-xs', !legenda && 'hidden')}>
        {(
          [
            'HIGIDO',
            'CARIE',
            'RESTAURACAO_SATISFATORIA',
            'RESTAURACAO_INSATISFATORIA',
            'AUSENTE',
            'ENDODONTIA',
            'PROTESE_FIXA',
            'PROTESE_REMOVIVEL',
            'IMPLANTE',
            'FRATURA',
            'DENTE_INCLUSO',
            'EXTRACAO_INDICADA',
            'SELANTE',
          ] as CondicaoDenteEnum[]
        ).map((c) => {
          const { fill } = condicaoColor(c);
          return (
            <span key={c} className="inline-flex items-center gap-1.5 text-bokka-ink-2">
              <AmostraCor cor={fill} forma="quadrado" tamanho={12} />
              {condicaoLabel(c)}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 text-bokka-ink-3 ml-auto">
          <span className="text-[10px] uppercase tracking-wider">Grade de faces</span>
          <span className="text-bokka-ink-2 font-medium">V · M · P/L · D · O/C</span>
        </span>
      </div>
    </div>
    </OdoCtx.Provider>
  );
};
