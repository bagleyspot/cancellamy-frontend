import { ChevronLeft, ChevronRight } from 'lucide-react';
import { it } from '@/i18n/it';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <nav aria-label={it.common.pagination} className="flex items-center justify-between gap-3 pt-2">
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {it.common.previous}
      </Button>
      <p className="text-sm text-muted" aria-live="polite">
        {it.common.page(page, pages)}
      </p>
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>
        {it.common.nextPage}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
