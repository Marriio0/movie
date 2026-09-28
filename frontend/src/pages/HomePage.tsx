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
import { ContinueWatchingRail } from '@/features/catalog/components/ContinueWatchingRail';
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
  // Strictly alternating between movies and series so viewers see both one after another with fixed timing!
  const featuredMovie = movies.data?.items.find(hasBackdrop);
  const spotlightItems = useMemo(() => {
    const movieList: (MediaSummary & { backdropPath: string })[] = [];
    const seriesList: (MediaSummary & { backdropPath: string })[] = [];
    const seen = new Set<string>();

    const addMedia = (item?: MediaSummary | null) => {
      if (!item || !hasBackdrop(item)) return;
      const key = `${item.mediaType}:${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (item.mediaType === 'movie') {
        movieList.push(item);
      } else {
        seriesList.push(item);
      }
    };

    const addList = (items?: MediaSummary[]) => {
      if (!items) return;
      for (const item of items) addMedia(item);
    };

    // 1. First ensure featuredMovie is first in movieList for tests and prominence
    if (featuredMovie) addMedia(featuredMovie);

    // 2. Collect trending, popular, and top rated titles
    addList(trendingToday.data?.items);
    addList(series.data?.items);
    addList(movies.data?.items);
    addList(trendingSeries.data?.items);
    addList(trendingMovies.data?.items);
    addList(topRatedSeries.data?.items);
    addList(topRatedMovies.data?.items);
    addList(nowPlaying.data?.items);

    // 3. Strictly alternate: Movie, Series, Movie, Series...
    const alternated: (MediaSummary & { backdropPath: string })[] = [];
    const maxLen = Math.max(movieList.length, seriesList.length);
    for (let i = 0; i < maxLen; i++) {
      const movie = movieList[i];
      const show = seriesList[i];
      if (movie) alternated.push(movie);
      if (show) alternated.push(show);
    }

    return alternated.slice(0, 24); // Top 24 titles rotating one after another
  }, [
    featuredMovie,
    trendingToday.data?.items,
    series.data?.items,
    movies.data?.items,
    trendingSeries.data?.items,
    trendingMovies.data?.items,
    topRatedSeries.data?.items,
    topRatedMovies.data?.items,
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

      {/* Continue Watching Rail (Shown when user has watch history) */}
      <ContinueWatchingRail />

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
