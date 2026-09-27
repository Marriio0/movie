import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Usually one ButtonLink that moves the user forward (e.g. "Browse movies"). */
  action?: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  titleAs: Title = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-1 grid size-12 place-items-center rounded-full bg-surface-2 text-fg-muted ring-1 ring-line">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      )}
      <Title className="text-lg font-semibold tracking-tight text-fg">{title}</Title>
      {description && <p className="text-sm text-pretty text-fg-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
