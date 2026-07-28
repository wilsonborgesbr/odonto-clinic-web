import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
}

const roundedMap = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

export const Skeleton = ({ className, width, height, rounded = 'md' }: SkeletonProps) => (
  <span
    className={cn('inline-block bg-bokka-surface-3 animate-pulse', roundedMap[rounded], className)}
    style={{ width, height }}
    aria-hidden="true"
  />
);

interface SkeletonRowsProps {
  rows?: number;
  className?: string;
}

export const SkeletonTableRows = ({ rows = 5, className }: SkeletonRowsProps) => (
  <div className={cn('divide-y divide-bokka-border', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 py-4 flex items-center gap-4">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);
