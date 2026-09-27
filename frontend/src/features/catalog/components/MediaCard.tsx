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
      className="group block rounded-lg focus-visible:outline-offset-4"
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-surface-3 shadow-card ring-1 ring-line transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:ring-accent/60 motion-reduce:transform-none">
        <TmdbImage path={media.posterPath} kind="poster" alt="" sizes={sizes} />

        {/* Gradient overlay at bottom of poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Rating chip on top corner */}
        {media.rating !== null && (
          <div className="absolute top-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-accent backdrop-blur-md border border-white/10 shadow-sm">
            ★ {media.rating.toFixed(1)}
          </div>
        )}

        {/* Media type mini badge */}
        {showType && (
          <div className="absolute top-2 left-2 rounded bg-surface-1/80 px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted backdrop-blur-md border border-line">
            {media.mediaType === 'movie' ? 'Film' : 'Série'}
          </div>
        )}

        {/* Hover Center Play Button (Netflix / Stremio style) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-black/60 transition-transform duration-200 group-hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-1 text-sm font-semibold text-fg transition-colors group-hover:text-accent">
        {media.title}
      </p>
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
