import { cn } from '../lib/utils';

interface BokkaMarkProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * Marca Bokka — B geométrico em cobalto com contorno arredondado.
 * Sem clip-art dental. A identidade é abstrata, sobrevive escala pequena.
 */
export const BokkaMark = ({ size = 32, withWordmark = false, className }: BokkaMarkProps) => (
  <div className={cn('inline-flex items-center gap-2', className)}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="var(--color-bokka-primary)" />
      <path
        d="M13.5 11.5h9.2c2.85 0 5.05 1.65 5.05 4.35 0 1.9-1.05 3.2-2.5 3.9 1.9.65 3.2 2.05 3.2 4.35 0 2.95-2.3 4.65-5.35 4.65H13.5V11.5Zm4.1 3.3v3.85h4.55c1.35 0 2.15-.7 2.15-1.95 0-1.2-.8-1.9-2.15-1.9H17.6Zm0 6.95v3.9h4.85c1.45 0 2.3-.75 2.3-1.95 0-1.25-.85-1.95-2.3-1.95H17.6Z"
        fill="white"
      />
    </svg>
    {withWordmark && (
      <span
        className="text-[19px] font-bold tracking-tight text-bokka-ink"
        style={{ letterSpacing: '-0.02em' }}
      >
        Bokka
      </span>
    )}
  </div>
);
