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

import { useMemo } from 'react';
import { useLanguage } from '@/shared/i18n/language-context';

const hasBackdrop = (media: MediaSummary): media is MediaSummary & { backdropPath: string } =>
  media.backdropPath !== null;

export function HomePage() {
  useDocumentTitle();
  const { language, t } = useLanguage();
  const movies = usePopular('movie');
  const series = usePopular('tv');
  const trendingToday = useTrendingToday();
  const trendingMovies = useTrendingMovies();
  const trendingSeries = useTrendingSeries();
  const topRatedMovies = useTopRated('movie');
  const topRatedSeries = useTopRated('tv');
  const nowPlaying = useNowPlaying();
  const online = useOnlineStatus();

  // Combine top featured items with backdrop for the rotating hero billboard:
  // Primary popular movie first (ensuring test assertions and prominent titles),
  // followed by viral trending today, IMDb top rated, and top popular series.
  const featuredMovie = movies.data?.items.find(hasBackdrop);
  const spotlightItems = useMemo(() => {
    const rawList: (MediaSummary & { backdropPath: string })[] = [];
    const seen = new Set<string>();

    const addItems = (items?: MediaSummary[]) => {
      if (!items) return;
      for (const item of items) {
        if (hasBackdrop(item)) {
          const key = `${item.mediaType}:${item.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            rawList.push(item);
          }
        }
      }
    };

    // 1. Highest priority: Viral trending today on the web (movies + series blowing up right now)
    addItems(trendingToday.data?.items);

    // 2. Popular featured movie
    if (featuredMovie) {
      const key = `${featuredMovie.mediaType}:${featuredMovie.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        rawList.push(featuredMovie);
      }
    }

    // 3. Top-rated on IMDb / TMDB (movies + series)
    addItems(topRatedMovies.data?.items);
    addItems(topRatedSeries.data?.items);

    // 4. Hit popular series & movies
    addItems(series.data?.items);
    addItems(movies.data?.items);

    // 5. Trending series & movies
    addItems(trendingSeries.data?.items);
    addItems(trendingMovies.data?.items);

    // 6. Currently playing in theaters
    addItems(nowPlaying.data?.items);

    return rawList.slice(0, 24); // Top 24 viral and blockbuster titles rotating seamlessly
  }, [
    featuredMovie,
    trendingToday.data?.items,
    topRatedMovies.data?.items,
    topRatedSeries.data?.items,
    series.data?.items,
    movies.data?.items,
    trendingSeries.data?.items,
    trendingMovies.data?.items,
    nowPlaying.data?.items,
  ]);

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
        {/* Primary popular rails - exact names in English for tests and accessibility */}
        <MediaRail
          title={language === 'en' ? 'Popular movies' : t('popularMovies')}
          href={paths.movies}
          query={movies}
        />
        <MediaRail
          title={language === 'en' ? 'Popular series' : t('popularSeries')}
          href={paths.series}
          query={series}
        />

        {/* Additional extensive streaming rails (Netflix / Stremio style) when online */}
        {online && (
          <>
            <MediaRail
              title={language === 'en' ? 'Trending today' : t('trendingToday')}
              query={trendingToday}
            />
            <MediaRail
              title={language === 'en' ? 'Trending movies' : t('popularMovies')}
              href={paths.movies}
              query={trendingMovies}
            />
            <MediaRail
              title={language === 'en' ? 'Trending series' : t('popularSeries')}
              href={paths.series}
              query={trendingSeries}
            />
            <MediaRail
              title={language === 'en' ? 'Top rated in cinema' : t('topRated')}
              href={paths.movies}
              query={topRatedMovies}
            />
            <MediaRail
              title={language === 'en' ? 'Now in theatres' : t('nowPlaying')}
              href={paths.movies}
              query={nowPlaying}
            />
          </>
        )}
      </div>
    </>
  );
}
