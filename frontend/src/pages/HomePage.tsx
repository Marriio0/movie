import {
  useNowPlaying,
  usePopular,
  useTopRated,
  useTrendingMovies,
  useTrendingSeries,
  useTrendingToday,
} from '@/features/catalog/catalog.hooks';
import type { MediaSummary } from '@/features/catalog/catalog.types';
import { HeroBillboard, HeroBillboardSkeleton } from '@/features/catalog/components/HeroBillboard';
import { MediaRail } from '@/features/catalog/components/MediaRail';
import { paths } from '@/shared/config/paths';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

const hasBackdrop = (media: MediaSummary): media is MediaSummary & { backdropPath: string } =>
  media.backdropPath !== null;

export function HomePage() {
  useDocumentTitle();
  const movies = usePopular('movie');
  const series = usePopular('tv');
  const trendingToday = useTrendingToday();
  const trendingMovies = useTrendingMovies();
  const trendingSeries = useTrendingSeries();
  const topRatedMovies = useTopRated('movie');
  const nowPlaying = useNowPlaying();
  const online = useOnlineStatus();

  // Combine top featured items with backdrop for the rotating hero billboard:
  // Primary popular movie first (ensuring test assertions and prominent titles),
  // followed by trending titles today and popular series.
  const featuredMovie = movies.data?.items.find(hasBackdrop);
  const spotlightItems = [
    ...(featuredMovie ? [featuredMovie] : []),
    ...(trendingToday.data?.items.filter(
      (item): item is MediaSummary & { backdropPath: string } =>
        hasBackdrop(item) && item.id !== featuredMovie?.id,
    ) ?? []),
    ...(series.data?.items.filter(
      (item): item is MediaSummary & { backdropPath: string } => hasBackdrop(item),
    ) ?? []),
  ].slice(0, 8);

  return (
    <>
      <h1 className="sr-only">Discover popular movies and series</h1>
      {movies.isPending && online ? (
        <HeroBillboardSkeleton />
      ) : spotlightItems.length > 0 ? (
        <HeroBillboard items={spotlightItems} />
      ) : (
        featuredMovie && <HeroBillboard media={featuredMovie} />
      )}

      <div className="container-page space-y-12 py-(--section-y) sm:space-y-14">
        {/* Primary popular rails - always mounted with exact names for accessibility and test suite */}
        <MediaRail title="Popular movies" href={paths.movies} query={movies} />
        <MediaRail title="Popular series" href={paths.series} query={series} />

        {/* Additional extensive streaming rails (Netflix / Stremio style) when online */}
        {online && (
          <>
            <MediaRail
              title="Trending today"
              query={trendingToday}
            />
            <MediaRail
              title="Trending movies"
              href={paths.movies}
              query={trendingMovies}
            />
            <MediaRail
              title="Trending series"
              href={paths.series}
              query={trendingSeries}
            />
            <MediaRail
              title="Top rated in cinema"
              href={paths.movies}
              query={topRatedMovies}
            />
            <MediaRail
              title="Now in theatres"
              href={paths.movies}
              query={nowPlaying}
            />
          </>
        )}
      </div>
    </>
  );
}
