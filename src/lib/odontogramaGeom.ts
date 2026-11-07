import type { CondicaoDenteEnum, FaceDenteEnum } from '../types';

// Geometria e regras de desenho do odontograma, compartilhadas entre o odontograma completo
// (pages/odontograma/Odontograma3D.tsx) e o SeletorDenteFace. Foi MOVIDA do Odontograma3D, não copiada:
// o seletor desenha a coroa pelas mesmas funções, então os dois nunca divergem.

// ============ Tooth type configs ============

export interface ToothCfg {
  hw: number;          // crown half-width
  nw: number;          // neck half-width (cementoenamel junction)
  cuspType: 'incisor' | 'canine' | 'premolar' | 'molar-upper' | 'molar-lower';
  upperRoots: number;
  lowerRoots: number;
  rootLen: number;     // 0..1 multiplier
}

// pos = second digit of FDI (1..8)
export const CFG: Record<number, ToothCfg> = {
  1: { hw: 15, nw: 11, cuspType: 'incisor',     upperRoots: 1, lowerRoots: 1, rootLen: 0.95 },
  2: { hw: 12, nw: 9,  cuspType: 'incisor',     upperRoots: 1, lowerRoots: 1, rootLen: 0.88 },
  3: { hw: 13, nw: 10, cuspType: 'canine',      upperRoots: 1, lowerRoots: 1, rootLen: 1.0  },
  4: { hw: 14, nw: 11, cuspType: 'premolar',    upperRoots: 2, lowerRoots: 1, rootLen: 0.85 },
  5: { hw: 13, nw: 10, cuspType: 'premolar',    upperRoots: 1, lowerRoots: 1, rootLen: 0.85 },
  6: { hw: 20, nw: 17, cuspType: 'molar-upper', upperRoots: 3, lowerRoots: 2, rootLen: 0.78 },
  7: { hw: 19, nw: 16, cuspType: 'molar-upper', upperRoots: 3, lowerRoots: 2, rootLen: 0.75 },
  8: { hw: 17, nw: 14, cuspType: 'molar-upper', upperRoots: 2, lowerRoots: 2, rootLen: 0.68 },
};

export function toothPos(fdi: string): number {
  return parseInt(fdi[1], 10);
}

// ============ Crown geometry ============

export interface CrownGeom {
  path: string;
  cusps: { x: number; y: number }[];   // cusp tips
  fossae: string[];                     // fissure lines
}

export function upperCrownGeom(cx: number, neckY: number, tipY: number, c: ToothCfg): CrownGeom {
  const { hw, nw, cuspType } = c;
  const h = tipY - neckY;

  if (cuspType === 'incisor') {
    // Chisel-shaped, flat incisal edge with slight mamelons
    const edgeY = tipY;
    const path = `M ${cx - nw},${neckY}
      C ${cx - nw - 1},${neckY + h * 0.4} ${cx - hw},${neckY + h * 0.75} ${cx - hw},${edgeY - 3}
      Q ${cx - hw + 1},${edgeY} ${cx - hw + 3},${edgeY}
      L ${cx + hw - 3},${edgeY}
      Q ${cx + hw - 1},${edgeY} ${cx + hw},${edgeY - 3}
      C ${cx + hw},${neckY + h * 0.75} ${cx + nw + 1},${neckY + h * 0.4} ${cx + nw},${neckY} Z`;
    return {
      path,
      cusps: [],
      fossae: [
        `M ${cx - hw * 0.4},${edgeY - 2} L ${cx + hw * 0.4},${edgeY - 2}`,
      ],
    };
  }

  if (cuspType === 'canine') {
    // Single pointed cusp
    const cuspY = tipY;
    const path = `M ${cx - nw},${neckY}
      C ${cx - nw - 2},${neckY + h * 0.35} ${cx - hw},${neckY + h * 0.6} ${cx - hw + 2},${neckY + h * 0.85}
      L ${cx},${cuspY}
      L ${cx + hw - 2},${neckY + h * 0.85}
      C ${cx + hw},${neckY + h * 0.6} ${cx + nw + 2},${neckY + h * 0.35} ${cx + nw},${neckY} Z`;
    return {
      path,
      cusps: [{ x: cx, y: cuspY }],
      fossae: [
        `M ${cx - hw * 0.35},${neckY + h * 0.7} L ${cx},${neckY + h * 0.85}`,
        `M ${cx + hw * 0.35},${neckY + h * 0.7} L ${cx},${neckY + h * 0.85}`,
      ],
    };
  }

  if (cuspType === 'premolar') {
    // Two cusps: buccal + lingual with central fissure
    const cw = hw * 0.6;
    const cuspH = h * 0.15;
    const path = `M ${cx - nw},${neckY}
      C ${cx - nw - 1},${neckY + h * 0.4} ${cx - hw - 1},${neckY + h * 0.6} ${cx - hw},${tipY - cuspH}
      Q ${cx - hw + 2},${tipY - 2} ${cx - cw},${tipY}
      Q ${cx - cw * 0.3},${tipY - cuspH * 0.6} ${cx},${tipY - cuspH * 0.5}
      Q ${cx + cw * 0.3},${tipY - cuspH * 0.6} ${cx + cw},${tipY}
      Q ${cx + hw - 2},${tipY - 2} ${cx + hw},${tipY - cuspH}
      C ${cx + hw + 1},${neckY + h * 0.6} ${cx + nw + 1},${neckY + h * 0.4} ${cx + nw},${neckY} Z`;
    return {
      path,
      cusps: [
        { x: cx - cw * 0.65, y: tipY - cuspH * 0.3 },
        { x: cx + cw * 0.65, y: tipY - cuspH * 0.3 },
      ],
      fossae: [
        `M ${cx},${tipY - cuspH * 0.55} L ${cx},${tipY - cuspH * 0.1}`,
      ],
    };
  }

  // Upper molar: 4 cusps + H-shaped fissure
  const cuspH = h * 0.12;
  const q = hw * 0.55;
  const path = `M ${cx - nw},${neckY}
    C ${cx - nw - 1},${neckY + h * 0.35} ${cx - hw - 2},${neckY + h * 0.55} ${cx - hw},${tipY - cuspH}
    Q ${cx - hw},${tipY - 1} ${cx - q},${tipY - cuspH * 0.4}
    Q ${cx - q * 0.5},${tipY} ${cx - q * 0.15},${tipY - cuspH * 0.3}
    L ${cx + q * 0.15},${tipY - cuspH * 0.3}
    Q ${cx + q * 0.5},${tipY} ${cx + q},${tipY - cuspH * 0.4}
    Q ${cx + hw},${tipY - 1} ${cx + hw},${tipY - cuspH}
    C ${cx + hw + 2},${neckY + h * 0.55} ${cx + nw + 1},${neckY + h * 0.35} ${cx + nw},${neckY} Z`;
  return {
    path,
    cusps: [
      { x: cx - q * 0.7, y: tipY - cuspH * 0.5 },
      { x: cx + q * 0.7, y: tipY - cuspH * 0.5 },
      { x: cx - hw * 0.6, y: tipY - cuspH * 0.9 },
      { x: cx + hw * 0.6, y: tipY - cuspH * 0.9 },
    ],
    fossae: [
      `M ${cx - hw * 0.5},${tipY - cuspH * 0.55} L ${cx + hw * 0.5},${tipY - cuspH * 0.55}`,
      `M ${cx},${tipY - cuspH * 0.9} L ${cx},${tipY - cuspH * 0.2}`,
    ],
  };
}

export function lowerCrownGeom(cx: number, neckY: number, tipY: number, c: ToothCfg): CrownGeom {
  const { hw, nw, cuspType } = c;
  const h = neckY - tipY;

  if (cuspType === 'incisor') {
    const edgeY = tipY;
    const path = `M ${cx - nw},${neckY}
      C ${cx - nw - 1},${neckY - h * 0.4} ${cx - hw},${neckY - h * 0.75} ${cx - hw},${edgeY + 3}
      Q ${cx - hw + 1},${edgeY} ${cx - hw + 3},${edgeY}
      L ${cx + hw - 3},${edgeY}
      Q ${cx + hw - 1},${edgeY} ${cx + hw},${edgeY + 3}
      C ${cx + hw},${neckY - h * 0.75} ${cx + nw + 1},${neckY - h * 0.4} ${cx + nw},${neckY} Z`;
    return {
      path,
      cusps: [],
      fossae: [
        `M ${cx - hw * 0.4},${edgeY + 2} L ${cx + hw * 0.4},${edgeY + 2}`,
      ],
    };
  }

  if (cuspType === 'canine') {
    const cuspY = tipY;
    const path = `M ${cx - nw},${neckY}
      C ${cx - nw - 2},${neckY - h * 0.35} ${cx - hw},${neckY - h * 0.6} ${cx - hw + 2},${neckY - h * 0.85}
      L ${cx},${cuspY}
      L ${cx + hw - 2},${neckY - h * 0.85}
      C ${cx + hw},${neckY - h * 0.6} ${cx + nw + 2},${neckY - h * 0.35} ${cx + nw},${neckY} Z`;
    return {
      path,
      cusps: [{ x: cx, y: cuspY }],
      fossae: [
        `M ${cx - hw * 0.35},${neckY - h * 0.7} L ${cx},${neckY - h * 0.85}`,
        `M ${cx + hw * 0.35},${neckY - h * 0.7} L ${cx},${neckY - h * 0.85}`,
      ],
    };
  }

  if (cuspType === 'premolar') {
    const cw = hw * 0.6;
    const cuspH = h * 0.15;
    const path = `M ${cx - nw},${neckY}
      C ${cx - nw - 1},${neckY - h * 0.4} ${cx - hw - 1},${neckY - h * 0.6} ${cx - hw},${tipY + cuspH}
      Q ${cx - hw + 2},${tipY + 2} ${cx - cw},${tipY}
      Q ${cx - cw * 0.3},${tipY + cuspH * 0.6} ${cx},${tipY + cuspH * 0.5}
      Q ${cx + cw * 0.3},${tipY + cuspH * 0.6} ${cx + cw},${tipY}
      Q ${cx + hw - 2},${tipY + 2} ${cx + hw},${tipY + cuspH}
      C ${cx + hw + 1},${neckY - h * 0.6} ${cx + nw + 1},${neckY - h * 0.4} ${cx + nw},${neckY} Z`;
    return {
      path,
      cusps: [
        { x: cx - cw * 0.65, y: tipY + cuspH * 0.3 },
        { x: cx + cw * 0.65, y: tipY + cuspH * 0.3 },
      ],
      fossae: [
        `M ${cx},${tipY + cuspH * 0.55} L ${cx},${tipY + cuspH * 0.1}`,
      ],
    };
  }

  // Lower molar (5 cusps typical, drawn as 4 with central pit)
  const cuspH = h * 0.13;
  const q = hw * 0.55;
  const path = `M ${cx - nw},${neckY}
    C ${cx - nw - 1},${neckY - h * 0.35} ${cx - hw - 2},${neckY - h * 0.55} ${cx - hw},${tipY + cuspH}
    Q ${cx - hw},${tipY + 1} ${cx - q},${tipY + cuspH * 0.4}
    Q ${cx - q * 0.5},${tipY} ${cx - q * 0.15},${tipY + cuspH * 0.3}
    L ${cx + q * 0.15},${tipY + cuspH * 0.3}
    Q ${cx + q * 0.5},${tipY} ${cx + q},${tipY + cuspH * 0.4}
    Q ${cx + hw},${tipY + 1} ${cx + hw},${tipY + cuspH}
    C ${cx + hw + 2},${neckY - h * 0.55} ${cx + nw + 1},${neckY - h * 0.35} ${cx + nw},${neckY} Z`;
  return {
    path,
    cusps: [
      { x: cx - q * 0.7, y: tipY + cuspH * 0.5 },
      { x: cx + q * 0.7, y: tipY + cuspH * 0.5 },
      { x: cx - hw * 0.6, y: tipY + cuspH * 0.9 },
      { x: cx + hw * 0.6, y: tipY + cuspH * 0.9 },
    ],
    fossae: [
      `M ${cx - hw * 0.5},${tipY + cuspH * 0.55} L ${cx + hw * 0.5},${tipY + cuspH * 0.55}`,
      `M ${cx},${tipY + cuspH * 0.2} L ${cx},${tipY + cuspH * 0.9}`,
    ],
  };
}

// ============ Colors ============

// Paleta USP — 4 buckets fixos (ODONTOGRAMA-COLOR-SPEC). Cor de identificação (legenda/badge/
// seletor de condição) é sempre a do bucket; a técnica de desenho da coroa (dentina natural,
// fantasma pálido, contorno tracejado) é resolvida à parte em UpperTooth/LowerTooth — não aqui.
export const condicaoColor = (
  c?: CondicaoDenteEnum,
): { fill: string; stroke: string; textInk: string } => {
  switch (c) {
    // Vermelho — precisa de tratamento
    case 'CARIE':
    case 'RESTAURACAO_INSATISFATORIA':
    case 'FRATURA':
    case 'EXTRACAO_INDICADA':
    // legados
    case 'CARIADO':
    case 'FRATURADO':
    case 'EXTRAIR':
      return { fill: '#DC2626', stroke: '#991B1B', textInk: 'var(--cond-vermelho-ink)' };

    // Azul — tratamento realizado
    case 'RESTAURACAO_SATISFATORIA':
    case 'ENDODONTIA':
    case 'PROTESE_FIXA':
    case 'PROTESE_REMOVIVEL':
    case 'IMPLANTE':
    // legados
    case 'RESTAURADO':
    case 'COROA':
    case 'EM_TRATAMENTO':
      return { fill: '#2563EB', stroke: '#1D4ED8', textInk: 'var(--cond-azul-ink)' };

    // Verde — saudável
    case 'HIGIDO':
    case 'SELANTE':
    // legado
    case 'SAUDAVEL':
      return { fill: '#059669', stroke: '#047857', textInk: 'var(--cond-verde-ink)' };

    // Preto — ausente / incluso
    case 'AUSENTE':
    case 'DENTE_INCLUSO':
      return { fill: 'var(--cond-preto-fill)', stroke: 'var(--cond-preto-stroke)', textInk: 'var(--cond-preto-ink)' };

    default:
      return { fill: 'var(--odo-dente)', stroke: '#B0A78F', textInk: 'var(--cond-neutro-ink)' };
  }
};

export const condicaoLabel = (c: CondicaoDenteEnum): string => {
  switch (c) {
    case 'HIGIDO':                     return 'Hígido';
    case 'CARIE':                      return 'Cárie';
    case 'RESTAURACAO_SATISFATORIA':   return 'Restauração satisfatória';
    case 'RESTAURACAO_INSATISFATORIA': return 'Restauração insatisfatória';
    case 'AUSENTE':                    return 'Ausente';
    case 'ENDODONTIA':                 return 'Endodontia';
    case 'PROTESE_FIXA':               return 'Prótese fixa';
    case 'PROTESE_REMOVIVEL':          return 'Prótese removível';
    case 'IMPLANTE':                   return 'Implante';
    case 'FRATURA':                    return 'Fratura';
    case 'DENTE_INCLUSO':              return 'Dente incluso';
    case 'EXTRACAO_INDICADA':          return 'Extração indicada';
    case 'SELANTE':                    return 'Selante';
    // legados — mesmo rótulo do equivalente novo (ODONTOGRAMA-COLOR-SPEC seção 3.1)
    case 'SAUDAVEL':      return 'Hígido';
    case 'CARIADO':       return 'Cárie';
    case 'RESTAURADO':    return 'Restauração satisfatória';
    case 'COROA':         return 'Prótese fixa';
    case 'FRATURADO':     return 'Fratura';
    case 'EM_TRATAMENTO': return 'Endodontia';
    case 'EXTRAIR':       return 'Extração indicada';
    default:              return c;
  }
};

export const faceLabel = (f: FaceDenteEnum): string => {
  switch (f) {
    case 'MESIAL':     return 'Mesial';
    case 'DISTAL':     return 'Distal';
    case 'OCLUSAL':    return 'Oclusal';
    case 'VESTIBULAR': return 'Vestibular';
    case 'PALATINA':   return 'Palatina';
    case 'LINGUAL':    return 'Lingual';
    case 'INCISAL':    return 'Incisal';
    case 'CERVICAL':   return 'Cervical';
  }
};

export const CONDICOES_COM_FACE: CondicaoDenteEnum[] = [
  'CARIE',
  'RESTAURACAO_SATISFATORIA',
  'RESTAURACAO_INSATISFATORIA',
  'FRATURA',
  'SELANTE',
  // legados
  'CARIADO',
  'RESTAURADO',
  'FRATURADO',
];

// ============ Grade de faces ============

/** Lado do quadrado da grade de faces no odontograma completo (unidades do SVG dele). */
export const FACE_BOX_SIZE = 30;

/**
 * Mesial fica sempre à esquerda da tela, no completo e no seletor, pela MESMA função.
 * TODO (docs/design-seletor-dente-face.md, seção 2): anatomicamente o mesial dos dentes 18→11 e 48→41 aponta
 * para a linha média (direita da tela). Só inverter aqui, nos dois lugares de uma vez, depois que a clínica
 * confirmar. Não mudar a direção sem essa confirmação.
 */
export const mesialNaEsquerda = (_numero: string): boolean => true;

/**
 * Faces que a grade oferece em cada dente. A grade do completo é a regra: nos anteriores o topo é INCISAL e o
 * fundo é CERVICAL, sem VESTIBULAR; nos posteriores o topo é VESTIBULAR e o fundo OCLUSAL.
 * TODO (docs/design-seletor-dente-face.md, seção 2): decidir com o Wilson/clínica se os anteriores passam a ter
 * VESTIBULAR. Por enquanto o seletor herda a regra do completo.
 */
export const facesDaGrade = (numero: string): { topo: FaceDenteEnum; fundo: FaceDenteEnum; centro: FaceDenteEnum } => {
  const cfg = CFG[toothPos(numero)];
  const anterior = cfg?.cuspType === 'incisor' || cfg?.cuspType === 'canine';
  const superior = numero[0] === '1' || numero[0] === '2' || numero[0] === '5' || numero[0] === '6';
  return {
    topo: anterior ? 'INCISAL' : 'VESTIBULAR',
    fundo: anterior ? 'CERVICAL' : 'OCLUSAL',
    centro: superior ? 'PALATINA' : 'LINGUAL',
  };
};

// ============ Preenchimento da coroa ============

export type CrownFillMode =
  | 'ausente'
  | 'incluso'
  | 'coroa-implante'
  | 'coroa-total'
  | 'natural-com-faces'
  | 'total'
  | 'natural';

/** Decide como a coroa é pintada. Face marcada (cárie, restaurações, fratura, selante) pinta só a face; senão a coroa inteira. */
export function crownFillMode(condicao: CondicaoDenteEnum | undefined, faces: FaceDenteEnum[]): CrownFillMode {
  const isAusente = condicao === 'AUSENTE';
  const isDenteIncluso = condicao === 'DENTE_INCLUSO';
  const isImplante = condicao === 'IMPLANTE';
  const isCoroa = condicao === 'COROA' || condicao === 'PROTESE_FIXA' || condicao === 'PROTESE_REMOVIVEL';
  const isHigido = condicao === 'HIGIDO' || condicao === 'SAUDAVEL';
  const hasFaceMark = faces.length > 0 && condicao && CONDICOES_COM_FACE.includes(condicao);
  return isAusente ? 'ausente'
    : isDenteIncluso ? 'incluso'
    : isImplante ? 'coroa-implante'
    : isCoroa ? 'coroa-total'
    : hasFaceMark ? 'natural-com-faces'
    : condicao && !CONDICOES_COM_FACE.includes(condicao) && !isHigido ? 'total'
    : 'natural';
}

export const crownFillColor = (mode: CrownFillMode, fill: string): string =>
  mode === 'ausente' ? '#E8ECF0'
    : mode === 'incluso' ? '#E8ECF0'
    : mode === 'coroa-implante' ? '#CBD5E1'
    : mode === 'coroa-total' ? fill
    : mode === 'total' ? fill
    : 'var(--odo-dente)';

export const crownOpacity = (condicao: CondicaoDenteEnum | undefined): number =>
  condicao === 'AUSENTE' ? 0.4 : condicao === 'DENTE_INCLUSO' ? 0.5 : 1;

// ============ Condições para o seletor ============

/** As 13 condições atuais, nos 4 grupos da legenda do completo. As legadas não entram: só aparecem se o dente já tiver uma. */
export const GRUPOS_CONDICAO: { titulo: string; condicoes: CondicaoDenteEnum[] }[] = [
  { titulo: 'Precisa de tratamento', condicoes: ['CARIE', 'RESTAURACAO_INSATISFATORIA', 'FRATURA', 'EXTRACAO_INDICADA'] },
  {
    titulo: 'Tratamento realizado',
    condicoes: ['RESTAURACAO_SATISFATORIA', 'ENDODONTIA', 'PROTESE_FIXA', 'PROTESE_REMOVIVEL', 'IMPLANTE'],
  },
  { titulo: 'Saudável', condicoes: ['HIGIDO', 'SELANTE'] },
  { titulo: 'Ausente', condicoes: ['AUSENTE', 'DENTE_INCLUSO'] },
];

/** Mesma regra do backend (CondicaoDenteEnum.admiteFaces). Sem condição o dente aceita faces. */
export const condicaoAdmiteFaces = (c?: CondicaoDenteEnum): boolean => !c || CONDICOES_COM_FACE.includes(c);
