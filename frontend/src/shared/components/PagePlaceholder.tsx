import { Construction } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';

export interface PagePlaceholderProps {
  title: string;
  /** What this screen will contain once its phase is built. */
  description: string;
  /** `page` for browsing screens, `card` inside the auth layout's column. */
  layout?: 'page' | 'card';
  children?: ReactNode;
}

/**
 * TEMPORARY. Marks a routed screen that has not been built yet, so routing and layout can be
 * tested end to end without fake data. Each use is replaced when that feature is built.
 */
export function PagePlaceholder({
  title,
  description,
  layout = 'page',
  children,
}: PagePlaceholderProps) {
  useDocumentTitle(title);

  return (
    <section
      className={cn(
        layout === 'page'
          ? 'container-page py-(--section-y)'
          : 'rounded-xl border border-line bg-surface-1 p-6 shadow-card sm:p-8',
      )}
    >
      <Badge tone="accent">
        <Construction aria-hidden="true" className="size-3.5" />
        Not built yet
      </Badge>
      <h1
        className={cn(
          'mt-4 font-display text-balance text-fg',
          layout === 'page' ? 'text-display-md' : 'text-display-sm',
        )}
      >
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-fg-muted">{description}</p>
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}
