import { Play, Tv } from 'lucide-react';
import { useParams } from 'react-router';
import { useSimilarTitles, useTitleCredits, useTitleDetails } from '@/features/catalog/catalog.hooks';
import { CastList } from '@/features/catalog/components/CastList';
import { MediaRail } from '@/features/catalog/components/MediaRail';
import { OfflineNotice } from '@/features/catalog/components/OfflineNotice';
import { TrailerButton } from '@/features/catalog/components/TrailerButton';
import { WatchPlayer } from '@/features/catalog/components/WatchPlayer';
import { CinemaLockedPlayer } from '@/features/catalog/components/CinemaLockedPlayer';
import { useActivation } from '@/features/catalog/lib/useActivation';
import { WHERE_TO_WATCH_ID, WhereToWatch } from '@/features/catalog/components/WhereToWatch';
import { useWaitingForNetwork } from '@/features/catalog/components/query-state';
import {
  TitleFacts,
  TitleHeader,
  TitleHeaderSkeleton,
} from '@/features/catalog/components/TitleHeader';
import { NotFoundView } from '@/shared/components/NotFoundView';
import { paths } from '@/shared/config/paths';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useLanguage } from '@/shared/i18n/language-context';
import { parsePositiveInt } from '@/shared/lib/params';
import type { MediaType } from '@/shared/types/media';
import { cn } from '@/shared/lib/cn';
import { buttonStyles } from '@/shared/ui/button-styles';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { ErrorState } from '@/shared/ui/ErrorState';

const LABEL: Record<MediaType, string> = { movie: 'Movie', tv: 'Series' };

function TitleDetail({ mediaType, id }: { mediaType: MediaType; id: number }) {
  const details = useTitleDetails(mediaType, id);
  const credits = useTitleCredits(mediaType, id);
  const similar = useSimilarTitles(mediaType, id);
  const { language } = useLanguage();
  const { isUnlocked } = useActivation();
  const offline = useWaitingForNetwork(details);
  useDocumentTitle(details.data?.title ?? LABEL[mediaType]);

  if (offline) {
    return (
      <div className="container-page py-(--section-y)">
        <OfflineNotice />
      </div>
    );
  }
  if (details.isPending) return <TitleHeaderSkeleton />;
  if (details.isError) {
    // The backend currently reports unknown ids as a failure, not a 404 (see catalog.api.ts),
    // so a missing title usually lands in the generic branch.
    if (details.error.kind === 'not_found') {
      return <NotFoundView title="Title not found" description="TMDB has no title with this id." />;
    }
    return (
      <div className="container-page py-(--section-y)">
        <ErrorState
          titleAs="h1"
          title={`We couldn’t load this ${LABEL[mediaType].toLowerCase()}`}
          description={`${details.error.message} If the link is old, the title may no longer exist.`}
          onRetry={() => void details.refetch()}
          actions={
            <ButtonLink to={mediaType === 'movie' ? paths.movies : paths.series} variant="ghost">
              Browse {mediaType === 'movie' ? 'movies' : 'series'}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <>
      <TitleHeader
        details={details.data}
        actions={
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <a
              href="#watch-player"
              className={cn(
                buttonStyles({ variant: 'primary', size: 'lg' }),
                'w-full sm:w-auto justify-center font-bold shadow-xl shadow-accent/25 hover:scale-105 active:scale-95 transition-transform',
              )}
            >
              <Play aria-hidden="true" className="fill-current" />
              Watch Now
            </a>
            <TrailerButton mediaType={mediaType} id={id} title={details.data.title} />
            <a
              href={`#${WHERE_TO_WATCH_ID}`}
              className={buttonStyles({ variant: 'secondary', size: 'lg' })}
            >
              <Tv aria-hidden="true" />
              Where to watch
            </a>
          </div>
        }
      />
      <div className="container-page space-y-12 pb-(--section-y)">
        {isUnlocked ? (
          <WatchPlayer details={details.data} />
        ) : (
          <CinemaLockedPlayer details={details.data} />
        )}
        <TitleFacts details={details.data} directors={credits.data?.directors} />
        <WhereToWatch mediaType={mediaType} id={id} />
        <CastList query={credits} />
        {similar.data && similar.data.items.length > 0 && (
          <MediaRail
            title={
              language === 'ar'
                ? 'أعمال مشابهة قد تعجبك'
                : language === 'fr'
                  ? 'Titres similaires'
                  : 'More Like This'
            }
            query={similar}
          />
        )}
      </div>
    </>
  );
}

function TitleDetailRoute({ mediaType }: { mediaType: MediaType }) {
  const id = parsePositiveInt(useParams().id);

  // Reject malformed ids before any request is made.
  if (id === null) {
    return (
      <NotFoundView
        title="Title not found"
        description={`That link doesn’t point to a valid ${LABEL[mediaType].toLowerCase()}.`}
      />
    );
  }
  // Keyed by id so navigating between titles never shows the previous title's state.
  return <TitleDetail key={`${mediaType}:${id}`} mediaType={mediaType} id={id} />;
}

export function MovieDetailPage() {
  return <TitleDetailRoute mediaType="movie" />;
}

export function SeriesDetailPage() {
  return <TitleDetailRoute mediaType="tv" />;
}
