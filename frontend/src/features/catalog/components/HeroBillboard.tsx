import { ArrowRight } from 'lucide-react';
import { useId } from 'react';
import { paths } from '@/shared/config/paths';
import { Badge } from '@/shared/ui/Badge';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { Skeleton } from '@/shared/ui/Skeleton';
import { TMDB_CONTENT_LANG, type MediaSummary } from '../catalog.types';
import { Backdrop } from './Backdrop';
import { Rating } from './Rating';

const HERO_BODY =
  'container-page relative -mt-20 pb-6 sm:-mt-28 md:mt-0 md:flex md:min-h-[min(72vh,42rem)] md:items-end md:py-16';

/** Featured title at the top of Home. Expects a title with a backdrop. */
export function HeroBillboard({ media }: { media: MediaSummary & { backdropPath: string } }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="relative overflow-hidden">
      <Backdrop path={media.backdropPath} />
      <div className={HERO_BODY}>
        <div className="max-w-xl">
          <Badge tone="accent">Popular now</Badge>
          <h2 id={headingId} className="mt-4 font-display text-display-lg text-balance text-fg">
            {media.title}
          </h2>
          <p className="mt-3 flex items-center gap-3 text-sm text-fg-muted">
            <span>{media.mediaType === 'movie' ? 'Movie' : 'Series'}</span>
            {media.year && <span className="tabular-nums">{media.year}</span>}
            {media.rating !== null && <Rating value={media.rating} />}
          </p>
          {media.overview && (
            <p lang={TMDB_CONTENT_LANG} className="mt-4 line-clamp-3 text-pretty text-fg-muted">
              {media.overview}
            </p>
          )}
          <ButtonLink to={paths.title(media.mediaType, media.id)} size="lg" className="mt-6">
            View details
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function HeroBillboardSkeleton() {
  return (
    <div aria-hidden="true" className="relative">
      <Skeleton className="aspect-video w-full rounded-none md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[72%] md:opacity-60" />
      <div className={HERO_BODY}>
        <div className="w-full max-w-xl">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-16 w-4/5" />
          <Skeleton className="mt-4 h-4 w-40" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-6 h-12 w-40" />
        </div>
      </div>
    </div>
  );
}
