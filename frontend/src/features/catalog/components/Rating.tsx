import { Star } from 'lucide-react';
import { formatRating } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

/** TMDB average out of 10 with a star. Screen readers hear "Rated 8.1 out of 10". */
export function Rating({ value, className }: { value: number; className?: string }) {
  const text = formatRating(value);
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
      <Star aria-hidden="true" className="size-3.5 fill-current text-accent-text" />
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">Rated {text} out of 10</span>
    </span>
  );
}
