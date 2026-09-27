import { cn } from '@/shared/lib/cn';
import { Spinner } from './Spinner';

export interface LoadingStateProps {
  /** Announced to screen readers and shown under the spinner. */
  label?: string;
  className?: string;
}

/**
 * Centered spinner for areas where a skeleton can't predict the layout.
 * Prefer Skeletons for known layouts (grids, rails, headers).
 */
export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-60 flex-col items-center justify-center gap-3 text-fg-muted',
        className,
      )}
    >
      <Spinner size="lg" label={label} className="text-accent-text" />
      <p aria-hidden="true" className="text-sm">
        {label}
      </p>
    </div>
  );
}
