import { queryOptions } from '@tanstack/react-query';
import type { MediaType } from '@/shared/types/media';
import { catalogApi } from './catalog.api';

export const catalogKeys = {
  all: ['catalog'] as const,
  popular: (mediaType: MediaType) => [...catalogKeys.all, 'popular', mediaType] as const,
  trendingToday: () => [...catalogKeys.all, 'trending-today'] as const,
  trendingMovies: () => [...catalogKeys.all, 'trending-movies'] as const,
  trendingSeries: () => [...catalogKeys.all, 'trending-series'] as const,
  topRated: (mediaType: MediaType) => [...catalogKeys.all, 'top-rated', mediaType] as const,
  nowPlaying: () => [...catalogKeys.all, 'now-playing'] as const,
  search: (query: string) => [...catalogKeys.all, 'search', query] as const,
  details: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'details', mediaType, id] as const,
  credits: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'credits', mediaType, id] as const,
  trailer: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'trailer', mediaType, id] as const,
  watchProviders: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'watch-providers', mediaType, id] as const,
  arabicMoroccan: (page: number = 1) => [...catalogKeys.all, 'arabic-moroccan', page] as const,
  arabicMoroccanSeries: (page: number = 1) =>
    [...catalogKeys.all, 'arabic-moroccan-series', page] as const,
  arabicEgyptian: (page: number = 1) => [...catalogKeys.all, 'arabic-egyptian', page] as const,
  arabicClassic: (page: number = 1) => [...catalogKeys.all, 'arabic-classic', page] as const,
  arabicTrending: (page: number = 1) => [...catalogKeys.all, 'arabic-trending', page] as const,
  arabicSeries: (page: number = 1) => [...catalogKeys.all, 'arabic-series', page] as const,
};

const MINUTE = 60_000;

export const popularQuery = (mediaType: MediaType) =>
  queryOptions({
    queryKey: catalogKeys.popular(mediaType),
    queryFn: ({ signal }) => catalogApi.popular(mediaType, signal),
    staleTime: 10 * MINUTE,
  });

export const infinitePopularQuery = (mediaType: MediaType) => ({
  queryKey: [...catalogKeys.popular(mediaType), 'infinite'] as const,
  queryFn: ({ pageParam = 1, signal }: { pageParam?: number; signal?: AbortSignal }) =>
    catalogApi.popularPaged(mediaType, pageParam, signal),
  initialPageParam: 1,
  getNextPageParam: (lastPage: { page?: number; totalPages?: number }) => {
    const cur = lastPage.page ?? 1;
    const total = lastPage.totalPages ?? 1;
    return cur < total ? cur + 1 : undefined;
  },
  staleTime: 10 * MINUTE,
});

export const trendingTodayQuery = () =>
  queryOptions({
    queryKey: catalogKeys.trendingToday(),
    queryFn: ({ signal }) => catalogApi.trendingToday(signal),
    staleTime: 10 * MINUTE,
  });

export const trendingMoviesQuery = () =>
  queryOptions({
    queryKey: catalogKeys.trendingMovies(),
    queryFn: ({ signal }) => catalogApi.trendingMovies(signal),
    staleTime: 10 * MINUTE,
  });

export const trendingSeriesQuery = () =>
  queryOptions({
    queryKey: catalogKeys.trendingSeries(),
    queryFn: ({ signal }) => catalogApi.trendingSeries(signal),
    staleTime: 10 * MINUTE,
  });

export const topRatedQuery = (mediaType: MediaType) =>
  queryOptions({
    queryKey: catalogKeys.topRated(mediaType),
    queryFn: ({ signal }) => catalogApi.topRated(mediaType, signal),
    staleTime: 15 * MINUTE,
  });

export const nowPlayingQuery = () =>
  queryOptions({
    queryKey: catalogKeys.nowPlaying(),
    queryFn: ({ signal }) => catalogApi.nowPlaying(signal),
    staleTime: 10 * MINUTE,
  });

export const searchQuery = (query: string) =>
  queryOptions({
    queryKey: catalogKeys.search(query),
    queryFn: ({ signal }) => catalogApi.search(query, signal),
    staleTime: 5 * MINUTE,
  });

export const detailsQuery = (mediaType: MediaType, id: number) =>
  queryOptions({
    queryKey: catalogKeys.details(mediaType, id),
    queryFn: ({ signal }) => catalogApi.details(mediaType, id, signal),
    staleTime: 30 * MINUTE,
  });

export const creditsQuery = (mediaType: MediaType, id: number) =>
  queryOptions({
    queryKey: catalogKeys.credits(mediaType, id),
    queryFn: ({ signal }) => catalogApi.credits(mediaType, id, signal),
    staleTime: 30 * MINUTE,
  });

export const trailerQuery = (mediaType: MediaType, id: number) =>
  queryOptions({
    queryKey: catalogKeys.trailer(mediaType, id),
    queryFn: ({ signal }) => catalogApi.trailer(mediaType, id, signal),
    staleTime: 60 * MINUTE,
  });

export const watchProvidersQuery = (mediaType: MediaType, id: number) =>
  queryOptions({
    queryKey: catalogKeys.watchProviders(mediaType, id),
    queryFn: ({ signal }) => catalogApi.watchProviders(mediaType, id, signal),
    staleTime: 60 * MINUTE,
  });

export const similarQuery = (mediaType: MediaType, id: number) =>
  queryOptions({
    queryKey: [...catalogKeys.all, 'similar', mediaType, id] as const,
    queryFn: ({ signal }) => catalogApi.similar(mediaType, id, signal),
    staleTime: 30 * MINUTE,
  });

export const arabicMoroccanQuery = (page: number = 1) =>
  queryOptions({
    queryKey: catalogKeys.arabicMoroccan(page),
    queryFn: ({ signal }) => catalogApi.arabicMoroccan(page, signal),
    staleTime: 15 * MINUTE,
  });

export const arabicMoroccanSeriesQuery = (page: number = 1) =>
  queryOptions({
    queryKey: catalogKeys.arabicMoroccanSeries(page),
    queryFn: ({ signal }) => catalogApi.arabicMoroccanSeries(page, signal),
    staleTime: 15 * MINUTE,
  });

export const arabicEgyptianQuery = (page: number = 1) =>
  queryOptions({
    queryKey: catalogKeys.arabicEgyptian(page),
    queryFn: ({ signal }) => catalogApi.arabicEgyptian(page, signal),
    staleTime: 15 * MINUTE,
  });

export const arabicClassicQuery = (page: number = 1) =>
  queryOptions({
    queryKey: catalogKeys.arabicClassic(page),
    queryFn: ({ signal }) => catalogApi.arabicClassic(page, signal),
    staleTime: 15 * MINUTE,
  });

export const arabicTrendingQuery = (page: number = 1) =>
  queryOptions({
    queryKey: catalogKeys.arabicTrending(page),
    queryFn: ({ signal }) => catalogApi.arabicTrending(page, signal),
    staleTime: 15 * MINUTE,
  });

export const arabicSeriesQuery = (page: number = 1) =>
  queryOptions({
    queryKey: catalogKeys.arabicSeries(page),
    queryFn: ({ signal }) => catalogApi.arabicSeries(page, signal),
    staleTime: 15 * MINUTE,
  });

