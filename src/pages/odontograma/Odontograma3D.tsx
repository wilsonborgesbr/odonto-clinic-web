import type { CondicaoDenteEnum, DenteStatus, FaceDenteEnum } from '../../types';
import { cn } from '../../lib/utils';

interface Odontograma3DProps {
  superior: string[];
  inferior: string[];
  marks: Map<string, DenteStatus>;
  selected?: string | null;
  onSelect?: (numero: string) => void;
  onSelectFace?: (numero: string, face: FaceDenteEnum) => void;
  readOnly?: boolean;
}

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

// ============ Tooth type configs ============

interface ToothCfg {
  hw: number;          // crown half-width
  nw: number;          // neck half-width (cementoenamel junction)
  cuspType: 'incisor' | 'canine' | 'premolar' | 'molar-upper' | 'molar-lower';
  upperRoots: number;
  lowerRoots: number;
  rootLen: number;     // 0..1 multiplier
}

// pos = second digit of FDI (1..8)
const CFG: Record<number, ToothCfg> = {
  1: { hw: 15, nw: 11, cuspType: 'incisor',     upperRoots: 1, lowerRoots: 1, rootLen: 0.95 },
  2: { hw: 12, nw: 9,  cuspType: 'incisor',     upperRoots: 1, lowerRoots: 1, rootLen: 0.88 },
  3: { hw: 13, nw: 10, cuspType: 'canine',      upperRoots: 1, lowerRoots: 1, rootLen: 1.0  },
  4: { hw: 14, nw: 11, cuspType: 'premolar',    upperRoots: 2, lowerRoots: 1, rootLen: 0.85 },
  5: { hw: 13, nw: 10, cuspType: 'premolar',    upperRoots: 1, lowerRoots: 1, rootLen: 0.85 },
  6: { hw: 20, nw: 17, cuspType: 'molar-upper', upperRoots: 3, lowerRoots: 2, rootLen: 0.78 },
  7: { hw: 19, nw: 16, cuspType: 'molar-upper', upperRoots: 3, lowerRoots: 2, rootLen: 0.75 },
  8: { hw: 17, nw: 14, cuspType: 'molar-upper', upperRoots: 2, lowerRoots: 2, rootLen: 0.68 },
};

function toothPos(fdi: string): number {
  return parseInt(fdi[1], 10);
}

// ============ Crown geometry ============

interface CrownGeom {
  path: string;
  cusps: { x: number; y: number }[];   // cusp tips
  fossae: string[];                     // fissure lines
}

function upperCrownGeom(cx: number, neckY: number, tipY: number, c: ToothCfg): CrownGeom {
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

function lowerCrownGeom(cx: number, neckY: number, tipY: number, c: ToothCfg): CrownGeom {
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
  teeth.forEach((fdi, i) => {
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
  teeth.forEach((fdi, i) => {
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

// Standard dental face representation: 5-section square
//  ┌──────────────┐
//  │      V       │   (or Incisal for anterior top)
//  │──┬────────┬──│
//  │M │   L    │D │   (Mesial | Lingual/Palatal | Distal)
//  │──┴────────┴──│
//  │      O       │   (Oclusal, or Cervical for anterior bottom)
//  └──────────────┘

const FACE_BOX_SIZE = 30;

interface FaceGrid {
  numero: string;
  x: number;   // top-left of grid
  y: number;
  facesMarked: FaceDenteEnum[];
  isUpper: boolean;
  isAnterior: boolean;
  condicaoFill: string;
  condicaoStroke: string;
  readOnly?: boolean;
  onSelectFace?: (numero: string, face: FaceDenteEnum) => void;
  parentSelected?: boolean;
}

const FaceGridBox = ({
  numero, x, y, facesMarked, isUpper, isAnterior,
  condicaoFill, condicaoStroke, readOnly, onSelectFace, parentSelected,
}: FaceGrid) => {
  const s = FACE_BOX_SIZE;
  const cornerCut = s * 0.28;
  const isMarked = (f: FaceDenteEnum) => facesMarked.includes(f);

  // Determine which face labels apply
  const topFace: FaceDenteEnum = isUpper && !isAnterior ? 'VESTIBULAR'
    : !isUpper && !isAnterior ? 'VESTIBULAR'
    : isAnterior ? 'INCISAL' : 'VESTIBULAR';
  const bottomFace: FaceDenteEnum = isAnterior ? 'CERVICAL' : 'OCLUSAL';
  const centerFace: FaceDenteEnum = isUpper ? 'PALATINA' : 'LINGUAL';

  const fill = (marked: boolean) => marked ? condicaoFill : '#FDFEFF';
  const stroke = (marked: boolean) => marked ? condicaoStroke : '#94A3B8';

  const handleClick = (face: FaceDenteEnum) => (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onSelectFace?.(numero, face);
  };

  return (
    <g className={cn(!readOnly && 'cursor-pointer')}>
      {/* Top trapezoid (V/Incisal) */}
      <path
        d={`M ${x},${y} L ${x + s},${y} L ${x + s - cornerCut},${y + cornerCut} L ${x + cornerCut},${y + cornerCut} Z`}
        fill={fill(isMarked(topFace))}
        stroke={stroke(isMarked(topFace))}
        strokeWidth="0.8"
        onClick={handleClick(topFace)}
      />
      {/* Left trapezoid (Mesial) */}
      <path
        d={`M ${x},${y} L ${x + cornerCut},${y + cornerCut} L ${x + cornerCut},${y + s - cornerCut} L ${x},${y + s} Z`}
        fill={fill(isMarked('MESIAL'))}
        stroke={stroke(isMarked('MESIAL'))}
        strokeWidth="0.8"
        onClick={handleClick('MESIAL')}
      />
      {/* Right trapezoid (Distal) */}
      <path
        d={`M ${x + s},${y} L ${x + s},${y + s} L ${x + s - cornerCut},${y + s - cornerCut} L ${x + s - cornerCut},${y + cornerCut} Z`}
        fill={fill(isMarked('DISTAL'))}
        stroke={stroke(isMarked('DISTAL'))}
        strokeWidth="0.8"
        onClick={handleClick('DISTAL')}
      />
      {/* Bottom trapezoid (O/Cervical) */}
      <path
        d={`M ${x},${y + s} L ${x + cornerCut},${y + s - cornerCut} L ${x + s - cornerCut},${y + s - cornerCut} L ${x + s},${y + s} Z`}
        fill={fill(isMarked(bottomFace))}
        stroke={stroke(isMarked(bottomFace))}
        strokeWidth="0.8"
        onClick={handleClick(bottomFace)}
      />
      {/* Center square (L/P) */}
      <rect
        x={x + cornerCut}
        y={y + cornerCut}
        width={s - cornerCut * 2}
        height={s - cornerCut * 2}
        fill={fill(isMarked(centerFace))}
        stroke={stroke(isMarked(centerFace))}
        strokeWidth="0.8"
        onClick={handleClick(centerFace)}
      />

      {/* Selection outline */}
      {parentSelected && (
        <rect
          x={x - 1.5} y={y - 1.5}
          width={s + 3} height={s + 3}
          fill="none"
          stroke="#2563EB"
          strokeWidth="1.5"
          rx="2"
        />
      )}
    </g>
  );
};

// ============ Colors ============

export const condicaoColor = (
  c?: CondicaoDenteEnum,
): { fill: string; stroke: string; textInk: string } => {
  switch (c) {
    case 'CARIADO':
      return { fill: '#DC2626', stroke: '#991B1B', textInk: '#991B1B' };
    case 'RESTAURADO':
      return { fill: '#2563EB', stroke: '#1D4ED8', textInk: '#1D4ED8' };
    case 'AUSENTE':
      return { fill: '#E8ECF0', stroke: '#94A3B8', textInk: '#64748B' };
    case 'IMPLANTE':
      return { fill: '#475569', stroke: '#334155', textInk: '#334155' };
    case 'COROA':
      return { fill: '#F59E0B', stroke: '#B45309', textInk: '#B45309' };
    case 'FRATURADO':
      return { fill: '#EA580C', stroke: '#C2410C', textInk: '#C2410C' };
    case 'EM_TRATAMENTO':
      return { fill: '#CA8A04', stroke: '#A16207', textInk: '#A16207' };
    case 'EXTRAIR':
      return { fill: '#FCA5A5', stroke: '#991B1B', textInk: '#991B1B' };
    case 'SAUDAVEL':
      return { fill: '#FFFCF2', stroke: '#B0A78F', textInk: '#334155' };
    default:
      return { fill: '#FFFCF2', stroke: '#B0A78F', textInk: '#64748B' };
  }
};

export const condicaoLabel = (c: CondicaoDenteEnum): string => {
  switch (c) {
    case 'SAUDAVEL':      return 'Saudável';
    case 'CARIADO':       return 'Cariado';
    case 'RESTAURADO':    return 'Restaurado';
    case 'AUSENTE':       return 'Ausente';
    case 'IMPLANTE':      return 'Implante';
    case 'COROA':         return 'Coroa';
    case 'FRATURADO':     return 'Fraturado';
    case 'EM_TRATAMENTO': return 'Em tratamento';
    case 'EXTRAIR':       return 'A extrair';
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
  'CARIADO',
  'RESTAURADO',
  'FRATURADO',
];

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

const UpperTooth = ({ index, numero, mark, selected, readOnly, onClick, onSelectFace }: UpperToothProps) => {
  const cx = toothCx(index);
  const cfg = CFG[toothPos(numero)];
  const condicao = mark?.condicao;
  const faces = mark?.faces ?? [];
  const isAusente = condicao === 'AUSENTE';
  const isExtrair = condicao === 'EXTRAIR';
  const isImplante = condicao === 'IMPLANTE';
  const isCoroa = condicao === 'COROA';
  const { fill, stroke } = condicaoColor(condicao);

  // If restauração/cariado with faces marked, apply face-level color instead of full crown
  const hasFaceMark = faces.length > 0 && condicao && CONDICOES_COM_FACE.includes(condicao);
  const crownFillMode = isAusente ? 'ausente'
    : isImplante ? 'coroa-implante'
    : isCoroa ? 'coroa-total'
    : hasFaceMark ? 'natural-com-faces'
    : condicao && !CONDICOES_COM_FACE.includes(condicao) && condicao !== 'SAUDAVEL' ? 'total'
    : 'natural';

  const crownFill = crownFillMode === 'ausente' ? '#E8ECF0'
    : crownFillMode === 'coroa-implante' ? '#CBD5E1'
    : crownFillMode === 'coroa-total' ? fill
    : crownFillMode === 'total' ? fill
    : '#FFFCF2';

  const opacity = isAusente ? 0.4 : 1;

  const tipY = UPPER_CROWN_TIP;
  const rootTipY = UPPER_ROOT_TOP + (UPPER_NECK - UPPER_ROOT_TOP) * (1 - cfg.rootLen);

  const crownGeom = upperCrownGeom(cx, UPPER_NECK, tipY, cfg);
  const roots = isImplante ? [] : upperRootPaths(cx, UPPER_NECK, rootTipY, cfg);

  return (
    <g
      className={cn(!readOnly && 'cursor-pointer group')}
      role={readOnly ? undefined : 'button'}
      aria-label={`Dente ${numero}`}
    >
      {/* FDI label */}
      <text
        x={cx}
        y={20}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={selected ? '#2563EB' : '#475569'}
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
          stroke="#2563EB" strokeWidth="1.8" strokeDasharray="4 3"
          opacity="0.7"
          pointerEvents="none"
        />
      )}

      {/* Roots */}
      {roots.map((d, ri) => (
        <g key={ri}>
          <path
            d={d}
            fill={isAusente ? '#E8ECF0' : 'url(#dentin-grad)'}
            stroke={isAusente ? '#B0B8C4' : '#B08D5D'}
            strokeWidth="0.7"
            opacity={opacity}
            pointerEvents="none"
          />
          {/* Root canal hint (endodontic) */}
          {condicao === 'EM_TRATAMENTO' && (
            <path
              d={d.split('Z')[0] + 'Z'}
              fill="none"
              stroke="#C2410C"
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
      {isImplante && (
        <g pointerEvents="none">
          <rect
            x={cx - cfg.nw * 0.55} y={rootTipY - 2}
            width={cfg.nw * 1.1} height={UPPER_NECK - rootTipY + 4}
            rx="2"
            fill="#64748B"
          />
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((frac) => {
            const y = rootTipY + (UPPER_NECK - rootTipY) * frac;
            return (
              <line
                key={frac}
                x1={cx - cfg.nw * 0.55} y1={y}
                x2={cx + cfg.nw * 0.55} y2={y}
                stroke="#334155" strokeWidth="0.9"
              />
            );
          })}
        </g>
      )}

      {/* Crown base — filtro pra drop-shadow (esmalte sobre a gengiva) */}
      <path
        d={crownGeom.path}
        fill={crownFill}
        stroke={isAusente ? '#B0B8C4' : (crownFillMode === 'natural' || crownFillMode === 'natural-com-faces' ? '#B0A78F' : stroke)}
        strokeWidth="1.1"
        opacity={opacity}
        filter={isAusente ? undefined : 'url(#tooth-shadow)'}
        pointerEvents="none"
      />

      {/* Enamel shine + radial highlight = volume 3D */}
      {!isAusente && crownFillMode !== 'total' && (
        <>
          <path
            d={crownGeom.path}
            fill="url(#enamel-upper)"
            opacity="0.7"
            pointerEvents="none"
          />
          <path
            d={crownGeom.path}
            fill="url(#tooth-highlight-upper)"
            pointerEvents="none"
          />
        </>
      )}

      {/* Face-level marks (as overlaid arcs on crown perimeter) */}
      {hasFaceMark && faces.map((f) => renderFaceOverlayUpper(f, cx, UPPER_NECK, tipY, cfg, fill, stroke))}

      {/* Fossae/fissures */}
      {!isAusente && crownGeom.fossae.map((fd, fi) => (
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
      {!isAusente && crownGeom.cusps.map((cp, ci) => (
        <circle
          key={ci}
          cx={cp.x} cy={cp.y}
          r="0.9"
          fill="#FFFFFF"
          opacity="0.7"
          pointerEvents="none"
        />
      ))}

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
      {!isAusente && (
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
        />
      )}
    </g>
  );
};

const LowerTooth = ({ index, numero, mark, selected, readOnly, onClick, onSelectFace }: UpperToothProps) => {
  const cx = toothCx(index);
  const cfg = CFG[toothPos(numero)];
  const condicao = mark?.condicao;
  const faces = mark?.faces ?? [];
  const isAusente = condicao === 'AUSENTE';
  const isExtrair = condicao === 'EXTRAIR';
  const isImplante = condicao === 'IMPLANTE';
  const isCoroa = condicao === 'COROA';
  const { fill, stroke } = condicaoColor(condicao);

  const hasFaceMark = faces.length > 0 && condicao && CONDICOES_COM_FACE.includes(condicao);
  const crownFillMode = isAusente ? 'ausente'
    : isImplante ? 'coroa-implante'
    : isCoroa ? 'coroa-total'
    : hasFaceMark ? 'natural-com-faces'
    : condicao && !CONDICOES_COM_FACE.includes(condicao) && condicao !== 'SAUDAVEL' ? 'total'
    : 'natural';

  const crownFill = crownFillMode === 'ausente' ? '#E8ECF0'
    : crownFillMode === 'coroa-implante' ? '#CBD5E1'
    : crownFillMode === 'coroa-total' ? fill
    : crownFillMode === 'total' ? fill
    : '#FFFCF2';

  const opacity = isAusente ? 0.4 : 1;

  const tipY = LOWER_CROWN_TOP;
  const rootTipY = LOWER_NECK + (LOWER_ROOT_TIP - LOWER_NECK) * cfg.rootLen;

  const crownGeom = lowerCrownGeom(cx, LOWER_NECK, tipY, cfg);
  const roots = isImplante ? [] : lowerRootPaths(cx, LOWER_NECK, rootTipY, cfg);

  return (
    <g
      className={cn(!readOnly && 'cursor-pointer group')}
      role={readOnly ? undefined : 'button'}
      aria-label={`Dente ${numero}`}
    >
      {/* Face grid box (above crown) */}
      {!isAusente && (
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
          stroke="#2563EB" strokeWidth="1.8" strokeDasharray="4 3"
          opacity="0.7"
          pointerEvents="none"
        />
      )}

      {/* Roots */}
      {roots.map((d, ri) => (
        <path
          key={ri}
          d={d}
          fill={isAusente ? '#E8ECF0' : 'url(#dentin-grad)'}
          stroke={isAusente ? '#B0B8C4' : '#B08D5D'}
          strokeWidth="0.7"
          opacity={opacity}
          pointerEvents="none"
        />
      ))}

      {/* Implant post */}
      {isImplante && (
        <g pointerEvents="none">
          <rect
            x={cx - cfg.nw * 0.55} y={LOWER_NECK - 2}
            width={cfg.nw * 1.1} height={rootTipY - LOWER_NECK + 4}
            rx="2"
            fill="#64748B"
          />
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((frac) => {
            const y = LOWER_NECK + (rootTipY - LOWER_NECK) * frac;
            return (
              <line
                key={frac}
                x1={cx - cfg.nw * 0.55} y1={y}
                x2={cx + cfg.nw * 0.55} y2={y}
                stroke="#334155" strokeWidth="0.9"
              />
            );
          })}
        </g>
      )}

      {/* Crown */}
      <path
        d={crownGeom.path}
        fill={crownFill}
        stroke={isAusente ? '#B0B8C4' : (crownFillMode === 'natural' || crownFillMode === 'natural-com-faces' ? '#B0A78F' : stroke)}
        strokeWidth="1.1"
        opacity={opacity}
        filter={isAusente ? undefined : 'url(#tooth-shadow)'}
        pointerEvents="none"
      />

      {/* Enamel shine + radial highlight */}
      {!isAusente && crownFillMode !== 'total' && (
        <>
          <path
            d={crownGeom.path}
            fill="url(#enamel-lower)"
            opacity="0.7"
            pointerEvents="none"
          />
          <path
            d={crownGeom.path}
            fill="url(#tooth-highlight-lower)"
            pointerEvents="none"
          />
        </>
      )}

      {/* Face-level overlays */}
      {hasFaceMark && faces.map((f) => renderFaceOverlayLower(f, cx, LOWER_NECK, tipY, cfg, fill, stroke))}

      {/* Fossae */}
      {!isAusente && crownGeom.fossae.map((fd, fi) => (
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
      {!isAusente && crownGeom.cusps.map((cp, ci) => (
        <circle
          key={ci}
          cx={cp.x} cy={cp.y} r="0.9"
          fill="#FFFFFF" opacity="0.7"
          pointerEvents="none"
        />
      ))}

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

      {/* FDI label */}
      <text
        x={cx}
        y={SVG_H - 10}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={selected ? '#2563EB' : '#475569'}
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
}: Odontograma3DProps) => {
  const upperGum = buildUpperGum(superior);
  const lowerGum = buildLowerGum(inferior);

  return (
    <div style={{ minWidth: TOTAL_W }}>
      <svg
        viewBox={`0 0 ${TOTAL_W} ${SVG_H}`}
        width="100%"
        height={SVG_H}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Odontograma anatômico"
      >
        <defs>
          <linearGradient id="dentin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF6D9" />
            <stop offset="55%" stopColor="#F0D9A0" />
            <stop offset="100%" stopColor="#D8B573" />
          </linearGradient>
          {/* Enamel upper: highlight brilhante no topo + sombra profunda embaixo */}
          <linearGradient id="enamel-upper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5C4A2E" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id="enamel-lower" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5C4A2E" stopOpacity="0.28" />
          </linearGradient>
          {/* Radial specular highlight — dá o volume 3D esférico */}
          <radialGradient id="tooth-highlight-upper" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tooth-highlight-lower" cx="35%" cy="70%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="gum-upper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F9C0CC" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#EA6A8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#B93E63" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="gum-lower" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F9C0CC" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#EA6A8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#B93E63" stopOpacity="0.95" />
          </linearGradient>
          {/* Sombra vermelha suave sob a linha das coroas (papila gengival) */}
          <linearGradient id="gum-shine-upper" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          {/* Drop-shadow do arco — ilumina "de cima" */}
          <filter id="tooth-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
        <path d={upperGum} fill="url(#gum-upper)" />
        <path d={upperGum} fill="url(#gum-shine-upper)" opacity="0.85" />
        <path d={lowerGum} fill="url(#gum-lower)" />
        <path d={lowerGum} fill="url(#gum-shine-upper)" opacity="0.85" transform={`translate(0 ${SVG_H}) scale(1 -1)`} />

        {/* Quadrant divider (vertical midline) */}
        <line
          x1={PAD + 8 * SLOT_W + MIDLINE_GAP / 2}
          y1={UPPER_ROOT_TOP - 5}
          x2={PAD + 8 * SLOT_W + MIDLINE_GAP / 2}
          y2={LOWER_ROOT_TIP + 5}
          stroke="#CBD5E1"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        {/* Occlusion line */}
        <line
          x1={PAD} y1={(UPPER_FACE_TOP + FACE_BOX_SIZE + LOWER_FACE_BOTTOM - FACE_BOX_SIZE) / 2}
          x2={TOTAL_W - PAD} y2={(UPPER_FACE_TOP + FACE_BOX_SIZE + LOWER_FACE_BOTTOM - FACE_BOX_SIZE) / 2}
          stroke="#CBD5E1"
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

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4 mt-3 border-t border-bokka-border text-xs">
        {(
          [
            'SAUDAVEL',
            'CARIADO',
            'RESTAURADO',
            'AUSENTE',
            'IMPLANTE',
            'COROA',
            'FRATURADO',
            'EM_TRATAMENTO',
            'EXTRAIR',
          ] as CondicaoDenteEnum[]
        ).map((c) => {
          const { fill } = condicaoColor(c);
          return (
            <span key={c} className="inline-flex items-center gap-1.5 text-bokka-ink-2">
              <span
                className="w-3 h-3 rounded-sm border border-bokka-border shrink-0"
                style={{ background: fill }}
              />
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
  );
};
