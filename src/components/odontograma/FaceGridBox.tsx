import type { KeyboardEvent, MouseEvent } from 'react';
import type { FaceDenteEnum } from '../../types';
import { cn } from '../../lib/utils';
import { FACE_BOX_SIZE, faceLabel, mesialNaEsquerda } from '../../lib/odontogramaGeom';

// Standard dental face representation: 5-section square
//  ┌──────────────┐
//  │      V       │   (or Incisal for anterior top)
//  │──┬────────┬──│
//  │M │   L    │D │   (Mesial | Lingual/Palatal | Distal)
//  │──┴────────┴──│
//  │      O       │   (Oclusal, or Cervical for anterior bottom)
//  └──────────────┘
//
// Movido do Odontograma3D: o completo e o SeletorDenteFace desenham a cruz pelo mesmo componente.

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
  /** Cor do contorno de seleção (padrão: --odo-sel). */
  selCor?: string;
  /** Lado do quadrado. O completo usa FACE_BOX_SIZE; o seletor usa 84 (desktop) ou 168 (celular). */
  size?: number;
  /**
   * Peças focáveis por teclado (role=button, Enter/Espaço). Só a grade do dente selecionado entra na ordem de Tab,
   * para não criar 5 paradas por dente. Com `false` a grade é só para ponteiro e fica aria-hidden: o seletor
   * oferece a fileira de chips O M D V L como caminho de teclado e de leitor de tela.
   */
  acessivel?: boolean;
}

export const FaceGridBox = ({
  numero, x, y, facesMarked, isUpper, isAnterior,
  condicaoFill, condicaoStroke, readOnly, onSelectFace, parentSelected,
  size = FACE_BOX_SIZE, acessivel = true, selCor = 'var(--odo-sel)',
}: FaceGrid) => {
  const s = size;
  const cornerCut = s * 0.28;
  const isMarked = (f: FaceDenteEnum) => facesMarked.includes(f);

  // Determine which face labels apply
  // TODO (docs/design-seletor-dente-face.md, seção 2, decisão pendente do Wilson/clínica): nos anteriores a grade tem
  // INCISAL em cima e CERVICAL embaixo e não tem VESTIBULAR. Mantido como está até a clínica decidir.
  const topFace: FaceDenteEnum = isUpper && !isAnterior ? 'VESTIBULAR'
    : !isUpper && !isAnterior ? 'VESTIBULAR'
    : isAnterior ? 'INCISAL' : 'VESTIBULAR';
  const bottomFace: FaceDenteEnum = isAnterior ? 'CERVICAL' : 'OCLUSAL';
  const centerFace: FaceDenteEnum = isUpper ? 'PALATINA' : 'LINGUAL';
  const mesialEsq = mesialNaEsquerda(numero);
  // TODO (mesmo relatório): mesialNaEsquerda() é sempre true, como o completo sempre foi; ver lib/odontogramaGeom.ts.
  const leftFace: FaceDenteEnum = mesialEsq ? 'MESIAL' : 'DISTAL';
  const rightFace: FaceDenteEnum = mesialEsq ? 'DISTAL' : 'MESIAL';

  const interativo = !readOnly && !!onSelectFace && acessivel;

  const fill = (face: FaceDenteEnum) => (isMarked(face) ? condicaoFill : 'var(--odo-face-fill)');
  const stroke = (face: FaceDenteEnum) => (isMarked(face) ? condicaoStroke : 'var(--odo-face-stroke)');

  const handleClick = (face: FaceDenteEnum) => (e: MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onSelectFace?.(numero, face);
  };

  // Atributos de acessibilidade de cada peça (só quando a grade é interativa).
  const aria = (face: FaceDenteEnum) =>
    interativo
      ? {
          role: 'button' as const,
          tabIndex: parentSelected ? 0 : -1,
          'aria-label': `Face ${faceLabel(face)} do dente ${numero}`,
          'aria-pressed': isMarked(face),
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onSelectFace?.(numero, face);
            }
          },
          className: 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-bokka-focus)]',
        }
      : {};

  const d = {
    topo: `M ${x},${y} L ${x + s},${y} L ${x + s - cornerCut},${y + cornerCut} L ${x + cornerCut},${y + cornerCut} Z`,
    esquerda: `M ${x},${y} L ${x + cornerCut},${y + cornerCut} L ${x + cornerCut},${y + s - cornerCut} L ${x},${y + s} Z`,
    direita: `M ${x + s},${y} L ${x + s},${y + s} L ${x + s - cornerCut},${y + s - cornerCut} L ${x + s - cornerCut},${y + cornerCut} Z`,
    fundo: `M ${x},${y + s} L ${x + cornerCut},${y + s - cornerCut} L ${x + s - cornerCut},${y + s - cornerCut} L ${x + s},${y + s} Z`,
  };

  return (
    <g className={cn(!readOnly && 'cursor-pointer')} aria-hidden={acessivel ? undefined : true}>
      {/* Top trapezoid (V/Incisal) */}
      <path
        d={d.topo}
        fill={fill(topFace)}
        stroke={stroke(topFace)}
        strokeWidth="0.8"
        onClick={handleClick(topFace)}
        {...aria(topFace)}
      />
      {/* Left trapezoid (Mesial) */}
      <path
        d={d.esquerda}
        fill={fill(leftFace)}
        stroke={stroke(leftFace)}
        strokeWidth="0.8"
        onClick={handleClick(leftFace)}
        {...aria(leftFace)}
      />
      {/* Right trapezoid (Distal) */}
      <path
        d={d.direita}
        fill={fill(rightFace)}
        stroke={stroke(rightFace)}
        strokeWidth="0.8"
        onClick={handleClick(rightFace)}
        {...aria(rightFace)}
      />
      {/* Bottom trapezoid (O/Cervical) */}
      <path
        d={d.fundo}
        fill={fill(bottomFace)}
        stroke={stroke(bottomFace)}
        strokeWidth="0.8"
        onClick={handleClick(bottomFace)}
        {...aria(bottomFace)}
      />
      {/* Center square (L/P) */}
      <rect
        x={x + cornerCut}
        y={y + cornerCut}
        width={s - cornerCut * 2}
        height={s - cornerCut * 2}
        fill={fill(centerFace)}
        stroke={stroke(centerFace)}
        strokeWidth="0.8"
        onClick={handleClick(centerFace)}
        {...aria(centerFace)}
      />

      {/* Selection outline */}
      {parentSelected && (
        <rect
          x={x - 1.5} y={y - 1.5}
          width={s + 3} height={s + 3}
          fill="none"
          stroke={selCor}
          strokeWidth="1.5"
          rx="2"
        />
      )}
    </g>
  );
};
