import { AlertTriangle, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: ReactNode;
  /** Shows a retry button. Omit it when retrying cannot help (e.g. 404). */
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra actions next to retry, such as a "Go home" link. */
  actions?: ReactNode;
  /** Single-line layout for use inside a rail or card. */
  compact?: boolean;
  titleAs?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
  retryLabel = 'Try again',
  actions,
  compact = false,
  titleAs: Title = 'h2',
  className,
}: ErrorStateProps) {
  const retry = onRetry && (
    <Button variant="secondary" size={compact ? 'sm' : 'md'} onClick={onRetry}>
      <RotateCw aria-hidden="true" />
      {retryLabel}
    </Button>
  );

  if (compact) {
    return (
      <div
        role="alert"
        className={cn(
          'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-1 px-4 py-3',
          className,
        )}
      >
        <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-danger" />
        <p className="min-w-0 flex-1 text-sm text-fg-muted">
          <span className="font-medium text-fg">{title}.</span> {description}
        </p>
        {retry}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <Title className="text-lg font-semibold tracking-tight text-fg">{title}</Title>
      <p className="text-sm text-pretty text-fg-muted">{description}</p>
      {(retry || actions) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {retry}
          {actions}
        </div>
      )}
    </div>
  );
}
