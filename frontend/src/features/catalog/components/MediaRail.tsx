import type { UseQueryResult } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';
import { useScrollRail } from '@/shared/hooks/useScrollRail';
import { ErrorState } from '@/shared/ui/ErrorState';
import { IconButton } from '@/shared/ui/IconButton';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import type { MediaList } from '../catalog.types';
import { MediaCard, MediaCardSkeleton } from './MediaCard';
import { OfflineNotice } from './OfflineNotice';
import { useWaitingForNetwork } from './query-state';

// Column widths show a partial next card, which signals the row scrolls:
// ~2.3 cards on phones, ~4.5 on tablets, 6 on desktop.
// `relative` makes the scroller the containing block for absolutely positioned descendants
// (e.g. `sr-only` text). Otherwise they escape the clip and widen the whole page.
const TRACK =
  'relative grid grid-flow-col gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 snap-x snap-mandatory ' +
  'auto-cols-[calc((100%-2*0.75rem)/2.3)] sm:gap-4 sm:auto-cols-[calc((100%-4*1rem)/4.5)] lg:auto-cols-[calc((100%-5*1rem)/6)] ' +
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-reduce:scroll-auto';

export interface MediaRailProps {
  title: string;
  /** "See all" destination. */
  href?: string;
  query: UseQueryResult<MediaList>;
}

/** Titled horizontal row of posters. Hidden entirely when the list is empty. */
export function MediaRail({ title, href, query }: MediaRailProps) {
  const headingId = useId();
  const { setTrack, atStart, atEnd, scrollByPage } = useScrollRail<HTMLUListElement>();
  const items = query.data?.items;
  const offline = useWaitingForNetwork(query);

  if (query.isSuccess && items?.length === 0) return null;

  const arrows = items && (!atStart || !atEnd) && (
    <span className="hidden gap-1 md:flex">
      <IconButton
        label={`Scroll ${title} back`}
        size="sm"
        variant="secondary"
        disabled={atStart}
        onClick={() => scrollByPage(-1)}
      >
        <ChevronLeft aria-hidden="true" />
      </IconButton>
      <IconButton
        label={`Scroll ${title} forward`}
        size="sm"
        variant="secondary"
        disabled={atEnd}
        onClick={() => scrollByPage(1)}
      >
        <ChevronRight aria-hidden="true" />
      </IconButton>
    </span>
  );

  return (
    <section aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        title={title}
        action={
          <>
            {href && (
              <Link
                to={href}
                className="mr-2 rounded-sm text-sm font-medium text-fg-muted transition-colors hover:text-fg"
              >
                See all
              </Link>
            )}
            {arrows}
          </>
        }
      />
      <div className="mt-4">
        {offline ? (
          <OfflineNotice compact />
        ) : query.isPending ? (
          <div className={TRACK} aria-busy="true" aria-label={`Loading ${title}`}>
            {Array.from({ length: 6 }, (_, index) => (
              <MediaCardSkeleton key={index} />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            compact
            title={`Couldn’t load ${title.toLowerCase()}`}
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <ul ref={setTrack} className={TRACK}>
            {items?.map((media) => (
              <li key={`${media.mediaType}:${media.id}`} className="snap-start">
                <MediaCard media={media} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
