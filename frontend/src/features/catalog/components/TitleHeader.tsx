import type { ReactNode } from 'react';
import { Subtitles } from 'lucide-react';
import { formatRuntime, languageName } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Skeleton } from '@/shared/ui/Skeleton';
import { TMDB_CONTENT_LANG, type MediaDetails } from '../catalog.types';
import { Backdrop } from './Backdrop';
import { Rating } from './Rating';
import { TmdbImage } from './TmdbImage';

const BODY_WITH_BACKDROP =
  'container-page relative -mt-16 pb-8 sm:-mt-24 md:mt-0 md:grid md:min-h-[min(70vh,40rem)] md:grid-cols-[minmax(11rem,15rem)_1fr] md:items-end md:gap-10 md:py-14';
const BODY_PLAIN =
  'container-page relative py-(--section-y) md:grid md:grid-cols-[minmax(11rem,15rem)_1fr] md:items-end md:gap-10';

function seasonsLabel(details: MediaDetails): string | null {
  if (details.seasonCount === null) return null;
  return `${details.seasonCount} season${details.seasonCount === 1 ? '' : 's'}`;
}

/** Detail page header: backdrop, poster, title, key facts and synopsis. The page's h1. */
export function TitleHeader({ details, actions }: { details: MediaDetails; actions?: ReactNode }) {
  const meta = [
    details.mediaType === 'movie' ? 'Movie' : 'Series',
    details.year?.toString(),
    formatRuntime(details.runtimeMinutes),
    seasonsLabel(details),
  ].filter(Boolean);

  return (
    <header className="relative overflow-hidden">
      {details.backdropPath && <Backdrop path={details.backdropPath} />}
      <div className={details.backdropPath ? BODY_WITH_BACKDROP : BODY_PLAIN}>
        <div className="hidden aspect-2/3 overflow-hidden rounded-lg bg-surface-3 shadow-pop ring-1 ring-line md:block">
          <TmdbImage
            path={details.posterPath}
            kind="poster"
            alt={`Poster for ${details.title}`}
            sizes="15rem"
            priority
          />
        </div>

        <div className="max-w-3xl">
          <h1 className="font-display text-display-lg text-balance text-fg">{details.title}</h1>
          {details.originalTitle !== details.title && (
            <p className="mt-2 text-sm text-fg-muted">
              Original title: <span lang={details.originalLanguage}>{details.originalTitle}</span>
            </p>
          )}

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            {meta.map((item, index) => (
              <span key={index} className="tabular-nums">
                {item}
              </span>
            ))}
            {details.rating !== null && (
              <Rating value={details.rating} className="font-medium text-fg" />
            )}
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Subtitles aria-hidden="true" className="size-3.5" />
              Subtitles (CC)
            </span>
          </p>

          {details.genres.length > 0 && (
            <ul lang={TMDB_CONTENT_LANG} className="mt-4 flex flex-wrap gap-2" aria-label="Genres">
              {details.genres.map((genre) => (
                <li key={genre.id}>
                  <Badge>{genre.name}</Badge>
                </li>
              ))}
            </ul>
          )}

          {details.tagline && (
            <p lang={TMDB_CONTENT_LANG} className="mt-6 font-display text-2xl text-balance text-fg">
              “{details.tagline}”
            </p>
          )}
          <p
            lang={details.overview ? TMDB_CONTENT_LANG : undefined}
            className={cn(
              'mt-4 max-w-2xl text-pretty',
              details.overview ? 'text-fg-muted' : 'text-fg-subtle italic',
            )}
          >
            {details.overview ?? 'No synopsis available.'}
          </p>
          {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </div>
    </header>
  );
}

export function TitleHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="relative">
      <Skeleton className="aspect-video w-full rounded-none md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[72%] md:opacity-60" />
      <div className={BODY_WITH_BACKDROP}>
        <Skeleton className="hidden aspect-2/3 w-full rounded-lg md:block" />
        <div className="max-w-3xl">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="mt-4 h-4 w-56" />
          <Skeleton className="mt-4 h-6 w-48" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** Secondary facts under the header. Rows without data are omitted. */
export function TitleFacts({
  details,
  directors,
}: {
  details: MediaDetails;
  directors: string[] | undefined;
}) {
  const people = details.mediaType === 'tv' ? details.creators : (directors ?? []);
  const facts = [
    {
      label: details.mediaType === 'tv' ? 'Created by' : 'Directed by',
      value: people.length > 0 ? people.join(', ') : null,
    },
    { label: 'Status', value: details.status },
    { label: 'Original language', value: languageName(details.originalLanguage) },
    {
      label: 'Episodes',
      value: details.episodeCount !== null ? String(details.episodeCount) : null,
    },
  ].filter((fact): fact is { label: string; value: string } => fact.value !== null);

  return (
    <dl className="grid grid-cols-1 gap-x-10 gap-y-4 border-y border-line py-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-fg-subtle">{fact.label}</dt>
          <dd className="mt-1 text-fg">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
