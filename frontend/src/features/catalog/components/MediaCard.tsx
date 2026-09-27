import { Link } from 'react-router';
import { paths } from '@/shared/config/paths';
import { Skeleton } from '@/shared/ui/Skeleton';
import { usePrefetchTitle } from '../catalog.hooks';
import type { MediaSummary } from '../catalog.types';
import { Rating } from './Rating';
import { POSTER_SIZES } from '../lib/tmdb-image';
import { TmdbImage } from './TmdbImage';

export interface MediaCardProps {
  media: MediaSummary;
  /** Label the media type; useful where movies and series are mixed (search). */
  showType?: boolean;
  sizes?: string;
}

export function MediaCard({ media, showType = false, sizes = POSTER_SIZES }: MediaCardProps) {
  const prefetch = usePrefetchTitle();
  const warm = () => prefetch(media.mediaType, media.id);

  return (
    <Link
      to={paths.title(media.mediaType, media.id)}
      onPointerEnter={warm}
      onFocus={warm}
      className="group block rounded-md focus-visible:outline-offset-4"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-md bg-surface-3 shadow-card ring-1 ring-line transition-transform duration-(--dur-2) ease-out group-hover:-translate-y-1 motion-reduce:transform-none">
        <TmdbImage path={media.posterPath} kind="poster" alt="" sizes={sizes} />
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm leading-snug font-medium text-fg">{media.title}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
        {showType && <span>{media.mediaType === 'movie' ? 'Movie' : 'Series'}</span>}
        {media.year && <span className="tabular-nums">{media.year}</span>}
        {media.rating !== null && <Rating value={media.rating} />}
      </p>
    </Link>
  );
}

export function MediaCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-2/3 w-full" />
      <Skeleton className="mt-2.5 h-4 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-2/5" />
    </div>
  );
}
