import type { CondicaoDenteEnum, DenteStatus } from '../../types';
import { cn } from '../../lib/utils';

/**
 * Odontograma SVG interativo — arcada superior + inferior desenhadas com dentes
 * anatômicos (coroa + raízes) e sombreamento pra dar aparência 3D.
 * Notação FDI. Cada dente é clicável e recebe uma cor por condição.
 */

interface Odontograma3DProps {
  superior: string[];
  inferior: string[];
  marks: Map<string, DenteStatus>;
  selected?: string | null;
  onSelect?: (numero: string) => void;
  readOnly?: boolean;
}

const TOOTH_WIDTH = 44;
const TOOTH_GAP = 4;

export const Odontograma3D = ({
  superior,
  inferior,
  marks,
  selected,
  onSelect,
  readOnly,
}: Odontograma3DProps) => {
  const totalWidth = superior.length * (TOOTH_WIDTH + TOOTH_GAP) + 32;

  return (
    <div style={{ minWidth: totalWidth }}>
      <svg
        viewBox={`0 0 ${totalWidth} 380`}
        width="100%"
        height="380"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Odontograma"
      >
        <defs>
          <linearGradient id="crown-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0B1220" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="root-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0B1220" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="gum-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
          <linearGradient id="gum-bottom" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
        </defs>

        {/* Faixa superior de gengiva */}
        <rect
          x="8"
          y="82"
          width={totalWidth - 16}
          height="18"
          rx="9"
          fill="url(#gum-top)"
          opacity="0.65"
        />
        {/* Faixa inferior de gengiva */}
        <rect
          x="8"
          y="280"
          width={totalWidth - 16}
          height="18"
          rx="9"
          fill="url(#gum-bottom)"
          opacity="0.65"
        />

        {/* Dentes superiores */}
        {superior.map((numero, i) => {
          const x = 16 + i * (TOOTH_WIDTH + TOOTH_GAP);
          const mark = marks.get(numero);
          const isSelected = selected === numero;
          return (
            <ToothSuperior
              key={numero}
              x={x}
              numero={numero}
              condicao={mark?.condicao}
              selected={isSelected}
              readOnly={readOnly}
              onClick={onSelect}
            />
          );
        })}

        {/* Linha central (oclusão) */}
        <line
          x1="16"
          y1="190"
          x2={totalWidth - 16}
          y2="190"
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Dentes inferiores */}
        {inferior.map((numero, i) => {
          const x = 16 + i * (TOOTH_WIDTH + TOOTH_GAP);
          const mark = marks.get(numero);
          const isSelected = selected === numero;
          return (
            <ToothInferior
              key={numero}
              x={x}
              numero={numero}
              condicao={mark?.condicao}
              selected={isSelected}
              readOnly={readOnly}
              onClick={onSelect}
            />
          );
        })}
      </svg>

      {/* Legenda */}
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
      </div>
    </div>
  );
};

interface ToothProps {
  x: number;
  numero: string;
  condicao?: CondicaoDenteEnum;
  selected?: boolean;
  readOnly?: boolean;
  onClick?: (numero: string) => void;
}

const ToothSuperior = ({ x, numero, condicao, selected, readOnly, onClick }: ToothProps) => {
  const cx = x + TOOTH_WIDTH / 2;
  const isAusente = condicao === 'AUSENTE';
  const isExtrair = condicao === 'EXTRAIR';
  const { fill, stroke } = condicaoColor(condicao);
  const w = TOOTH_WIDTH;

  return (
    <g
      className={cn(!readOnly && 'cursor-pointer')}
      onClick={() => !readOnly && onClick?.(numero)}
    >
      {/* Rótulo (número FDI) */}
      <text
        x={cx}
        y="18"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill={selected ? '#2A6BF2' : '#64748B'}
        style={{ userSelect: 'none' }}
      >
        {numero}
      </text>

      {/* Halo de seleção */}
      {selected && (
        <rect
          x={x - 2}
          y="24"
          width={w + 4}
          height="152"
          rx="8"
          fill="none"
          stroke="#2A6BF2"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      )}

      {/* Raízes (2 pontas triangulares) */}
      <path
        d={`M ${x + 6} 30 Q ${x + 6} 80 ${cx - 4} 95 L ${cx + 4} 95 Q ${x + w - 6} 80 ${x + w - 6} 30 Z`}
        fill={isAusente ? '#F1F5F9' : '#FEFCE8'}
        stroke={stroke}
        strokeWidth="1"
        opacity={isAusente ? 0.4 : 1}
      />
      <path
        d={`M ${x + 6} 30 Q ${x + 6} 80 ${cx - 4} 95 L ${cx + 4} 95 Q ${x + w - 6} 80 ${x + w - 6} 30 Z`}
        fill="url(#root-shadow)"
        opacity={isAusente ? 0.2 : 0.6}
      />

      {/* Coroa (parte visível) */}
      <path
        d={`M ${x + 4} 100 Q ${x + 4} 175 ${cx} 175 Q ${x + w - 4} 175 ${x + w - 4} 100 Q ${x + w - 4} 90 ${cx} 90 Q ${x + 4} 90 ${x + 4} 100 Z`}
        fill={isAusente ? '#F1F5F9' : fill}
        stroke={stroke}
        strokeWidth="1.5"
        opacity={isAusente ? 0.4 : 1}
      />
      <path
        d={`M ${x + 4} 100 Q ${x + 4} 175 ${cx} 175 Q ${x + w - 4} 175 ${x + w - 4} 100 Q ${x + w - 4} 90 ${cx} 90 Q ${x + 4} 90 ${x + 4} 100 Z`}
        fill="url(#crown-shadow)"
      />

      {/* X pra ausente ou extrair */}
      {(isAusente || isExtrair) && (
        <>
          <line
            x1={x + 8}
            y1="105"
            x2={x + w - 8}
            y2="170"
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={x + w - 8}
            y1="105"
            x2={x + 8}
            y2="170"
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
};

const ToothInferior = ({ x, numero, condicao, selected, readOnly, onClick }: ToothProps) => {
  const cx = x + TOOTH_WIDTH / 2;
  const isAusente = condicao === 'AUSENTE';
  const isExtrair = condicao === 'EXTRAIR';
  const { fill, stroke } = condicaoColor(condicao);
  const w = TOOTH_WIDTH;

  return (
    <g
      className={cn(!readOnly && 'cursor-pointer')}
      onClick={() => !readOnly && onClick?.(numero)}
    >
      {/* Halo de seleção */}
      {selected && (
        <rect
          x={x - 2}
          y="204"
          width={w + 4}
          height="152"
          rx="8"
          fill="none"
          stroke="#2A6BF2"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      )}

      {/* Coroa (parte visível, virada pra cima) */}
      <path
        d={`M ${x + 4} 280 Q ${x + 4} 205 ${cx} 205 Q ${x + w - 4} 205 ${x + w - 4} 280 Q ${x + w - 4} 290 ${cx} 290 Q ${x + 4} 290 ${x + 4} 280 Z`}
        fill={isAusente ? '#F1F5F9' : fill}
        stroke={stroke}
        strokeWidth="1.5"
        opacity={isAusente ? 0.4 : 1}
      />
      <path
        d={`M ${x + 4} 280 Q ${x + 4} 205 ${cx} 205 Q ${x + w - 4} 205 ${x + w - 4} 280 Q ${x + w - 4} 290 ${cx} 290 Q ${x + 4} 290 ${x + 4} 280 Z`}
        fill="url(#crown-shadow)"
        transform={`rotate(180 ${cx} 247.5)`}
      />

      {/* Raízes (viradas pra baixo) */}
      <path
        d={`M ${x + 6} 350 Q ${x + 6} 300 ${cx - 4} 285 L ${cx + 4} 285 Q ${x + w - 6} 300 ${x + w - 6} 350 Z`}
        fill={isAusente ? '#F1F5F9' : '#FEFCE8'}
        stroke={stroke}
        strokeWidth="1"
        opacity={isAusente ? 0.4 : 1}
      />
      <path
        d={`M ${x + 6} 350 Q ${x + 6} 300 ${cx - 4} 285 L ${cx + 4} 285 Q ${x + w - 6} 300 ${x + w - 6} 350 Z`}
        fill="url(#root-shadow)"
        opacity={isAusente ? 0.2 : 0.6}
      />

      {/* Rótulo */}
      <text
        x={cx}
        y="370"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill={selected ? '#2A6BF2' : '#64748B'}
        style={{ userSelect: 'none' }}
      >
        {numero}
      </text>

      {/* X pra ausente ou extrair */}
      {(isAusente || isExtrair) && (
        <>
          <line
            x1={x + 8}
            y1="215"
            x2={x + w - 8}
            y2="280"
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={x + w - 8}
            y1="215"
            x2={x + 8}
            y2="280"
            stroke={isExtrair ? '#B91C1C' : '#94A3B8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
};

// ============ Cores por condição ============

export const condicaoColor = (
  c?: CondicaoDenteEnum,
): { fill: string; stroke: string; textInk: string } => {
  switch (c) {
    case 'CARIADO':
      return { fill: '#EF4444', stroke: '#B91C1C', textInk: '#B91C1C' };
    case 'RESTAURADO':
      return { fill: '#2A6BF2', stroke: '#1E4FBE', textInk: '#1E4FBE' };
    case 'AUSENTE':
      return { fill: '#F1F5F9', stroke: '#94A3B8', textInk: '#64748B' };
    case 'IMPLANTE':
      return { fill: '#10B981', stroke: '#047857', textInk: '#047857' };
    case 'COROA':
      return { fill: '#F59E0B', stroke: '#B45309', textInk: '#B45309' };
    case 'FRATURADO':
      return { fill: '#F97316', stroke: '#C2410C', textInk: '#C2410C' };
    case 'EM_TRATAMENTO':
      return { fill: '#EAB308', stroke: '#A16207', textInk: '#A16207' };
    case 'EXTRAIR':
      return { fill: '#FCA5A5', stroke: '#991B1B', textInk: '#991B1B' };
    case 'SAUDAVEL':
      return { fill: '#F8FAFC', stroke: '#94A3B8', textInk: '#334155' };
    default:
      return { fill: '#FFFFFF', stroke: '#CBD5E1', textInk: '#64748B' };
  }
};

export const condicaoLabel = (c: CondicaoDenteEnum): string => {
  switch (c) {
    case 'SAUDAVEL':
      return 'Saudável';
    case 'CARIADO':
      return 'Cariado';
    case 'RESTAURADO':
      return 'Restaurado';
    case 'AUSENTE':
      return 'Ausente';
    case 'IMPLANTE':
      return 'Implante';
    case 'COROA':
      return 'Coroa';
    case 'FRATURADO':
      return 'Fraturado';
    case 'EM_TRATAMENTO':
      return 'Em tratamento';
    case 'EXTRAIR':
      return 'A extrair';
    default:
      return c;
  }
};
