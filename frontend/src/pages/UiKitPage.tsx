import { Bookmark, Film, Heart, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { IconButton } from '@/shared/ui/IconButton';
import { LoadingState } from '@/shared/ui/LoadingState';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Spinner } from '@/shared/ui/Spinner';

/**
 * DEVELOPMENT ONLY (registered only when import.meta.env.DEV is true).
 * Shows every primitive and state for visual, theme and keyboard checks. No real data.
 */
export function UiKitPage() {
  useDocumentTitle('UI primitives');
  const noop = () => {};

  return (
    <div className="container-page space-y-14 py-(--section-y)">
      <header>
        <Badge>Development only</Badge>
        <h1 className="mt-4 font-display text-display-md text-fg">UI primitives</h1>
        <p className="mt-2 max-w-xl text-fg-muted">
          Check both themes, keyboard focus (Tab) and reduced motion.
        </p>
      </header>

      <Section title="Typography">
        <p className="font-display text-display-lg text-fg">Display large</p>
        <p className="font-display text-display-md text-fg">Display medium</p>
        <p className="font-display text-display-sm text-fg">Display small</p>
        <p className="text-2xl font-semibold tracking-tight text-fg">Heading 2xl</p>
        <p className="text-base text-fg">Body: primary text on canvas.</p>
        <p className="text-sm text-fg-muted">Muted: metadata and secondary copy.</p>
        <p className="text-xs text-fg-subtle">Subtle: captions and fine print.</p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus aria-hidden="true" />
            Watchlist
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IconButton label="Add to watchlist" variant="secondary">
            <Bookmark aria-hidden="true" />
          </IconButton>
          <IconButton label="Like">
            <Heart aria-hidden="true" />
          </IconButton>
          <IconButton label="Add" variant="primary" size="lg">
            <Plus aria-hidden="true" />
          </IconButton>
        </div>
      </Section>

      <Section title="Badges and spinners">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Series</Badge>
          <Badge tone="accent">New</Badge>
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" className="text-accent-text" />
        </div>
      </Section>

      <Section title="Skeletons">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-2/3 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Loading state">
        <LoadingState className="rounded-lg border border-line" />
      </Section>

      <Section title="Empty state">
        <div className="rounded-lg border border-line">
          <EmptyState
            icon={Film}
            title="Your watchlist is empty"
            description="Save movies and series to find them here."
            action={<Button variant="secondary">Browse movies</Button>}
          />
        </div>
      </Section>

      <Section title="Error states">
        <div className="rounded-lg border border-line">
          <ErrorState description="We couldn’t load this page." onRetry={noop} />
        </div>
        <ErrorState
          compact
          title="Couldn’t load this row"
          description="Check your connection."
          onRetry={noop}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <SectionHeader title={title} className="border-b border-line pb-3" />
      {children}
    </section>
  );
}
