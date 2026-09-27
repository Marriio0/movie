import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { EmptyState, type EmptyStateProps } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import type { MediaList } from '../catalog.types';
import { MediaCard, MediaCardSkeleton } from './MediaCard';
import { OfflineNotice } from './OfflineNotice';
import { useWaitingForNetwork } from './query-state';

const GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-5';

export interface MediaGridProps {
  query: UseQueryResult<MediaList>;
  /** What to show when the list is empty. */
  empty: Pick<EmptyStateProps, 'icon' | 'title' | 'description' | 'action'>;
  errorTitle: string;
  showType?: boolean;
  /** Rendered above the grid once results exist (e.g. a heading). */
  header?: ReactNode;
  skeletonCount?: number;
}

/** Poster grid with loading, offline, error and empty states. */
export function MediaGrid({
  query,
  empty,
  errorTitle,
  showType = false,
  header,
  skeletonCount = 18,
}: MediaGridProps) {
  const offline = useWaitingForNetwork(query);
  if (offline) return <OfflineNotice />;

  if (query.isPending) {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading titles">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <MediaCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title={errorTitle}
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (query.data.items.length === 0) return <EmptyState {...empty} />;

  return (
    <>
      {header}
      <ul
        aria-busy={query.isPlaceholderData || undefined}
        className={cn(
          GRID,
          'transition-opacity duration-(--dur-2)',
          query.isPlaceholderData && 'opacity-60',
        )}
      >
        {query.data.items.map((media) => (
          <li key={`${media.mediaType}:${media.id}`}>
            <MediaCard media={media} showType={showType} />
          </li>
        ))}
      </ul>
    </>
  );
}
