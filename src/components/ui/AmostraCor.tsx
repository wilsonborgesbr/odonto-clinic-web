import { cn } from '../../lib/utils';

interface AmostraCorProps {
  cor: string;
  forma?: 'circulo' | 'quadrado';
  /** Lado em px. */
  tamanho?: number;
  className?: string;
}

/**
 * Amostra de cor das condições (lista lateral, legenda, chips). É SVG de propósito: a versão em CSS
 * (border-radius + box-shadow inset) em elementos de 12 a 16 px sai serrilhada no Firefox e em telas com escala
 * fracionária; o vetor fica nítido em qualquer navegador. O aro de 1 px usa o token --color-bokka-swatch.
 */
export const AmostraCor = ({ cor, forma = 'circulo', tamanho = 12, className }: AmostraCorProps) => (
  <svg
    width={tamanho}
    height={tamanho}
    viewBox="0 0 12 12"
    aria-hidden="true"
    focusable="false"
    className={cn('shrink-0', className)}
  >
    {forma === 'circulo' ? (
      <>
        <circle cx="6" cy="6" r="6" fill={cor} />
        <circle cx="6" cy="6" r="5.5" fill="none" stroke="var(--color-bokka-swatch)" strokeWidth="1" />
      </>
    ) : (
      <>
        <rect width="12" height="12" rx="2" fill={cor} />
        <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke="var(--color-bokka-swatch)" strokeWidth="1" />
      </>
    )}
  </svg>
);
