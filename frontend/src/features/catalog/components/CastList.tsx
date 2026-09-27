import type { UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Credits } from '../catalog.types';
import { OfflineNotice } from './OfflineNotice';
import { useWaitingForNetwork } from './query-state';
import { TmdbImage } from './TmdbImage';

const GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(8rem,1fr))]';

/** Top-billed cast. Loads independently of the details, so a failure here never hides the page. */
export function CastList({ query }: { query: UseQueryResult<Credits> }) {
  const headingId = useId();
  const offline = useWaitingForNetwork(query);
  if (query.isSuccess && query.data.cast.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <SectionHeader id={headingId} title="Cast" />
      <div className="mt-5">
        {offline ? (
          <OfflineNotice compact />
        ) : query.isPending ? (
          <div className={GRID} aria-busy="true" aria-label="Loading cast">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} aria-hidden="true">
                <Skeleton className="aspect-square w-full rounded-full" />
                <Skeleton className="mx-auto mt-3 h-4 w-3/4" />
                <Skeleton className="mx-auto mt-1.5 h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            compact
            title="Couldn’t load the cast"
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : (
          <ul className={GRID}>
            {query.data.cast.map((person) => (
              <li key={person.id} className="text-center">
                <div className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-surface-3 ring-1 ring-line">
                  <TmdbImage path={person.profilePath} kind="profile" alt="" sizes="8rem" />
                </div>
                <p className="mt-3 text-sm leading-snug font-medium text-fg">{person.name}</p>
                {person.character && (
                  <p className="mt-0.5 text-xs text-fg-muted">{person.character}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
