import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SectionHeaderProps {
  title: string;
  id?: string;
  description?: ReactNode;
  /** Right-aligned slot: a "See all" link, rail arrows, a sort control. */
  action?: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}

export function SectionHeader({
  title,
  id,
  description,
  action,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <Heading id={id} className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
          {title}
        </Heading>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
    </div>
  );
}
