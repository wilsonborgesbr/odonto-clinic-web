import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemName?: string;
  className?: string;
}

export const Pagination = ({
  page,
  totalPages,
  totalItems,
  onPageChange,
  loading,
  itemName = 'itens',
  className,
}: PaginationProps) => {
  if (totalPages <= 1) {
    return (
      <div className={cn('px-4 py-3 text-sm text-bokka-ink-3', className)}>
        {totalItems} {itemName}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 border-t border-bokka-border',
        className,
      )}
    >
      <span className="text-sm text-bokka-ink-3">
        Página <span className="font-medium text-bokka-ink-2">{page + 1}</span> de{' '}
        <span className="font-medium text-bokka-ink-2">{totalPages}</span>
        <span className="hidden sm:inline"> · {totalItems} {itemName}</span>
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page === 0 || loading}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          icon={<ChevronLeft />}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages - 1 || loading}
          onClick={() => onPageChange(page + 1)}
          iconRight={<ChevronRight />}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
};
