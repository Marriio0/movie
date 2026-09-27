import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { MediaType } from '@/shared/types/media';
import {
  creditsQuery,
  detailsQuery,
  infinitePopularQuery,
  nowPlayingQuery,
  popularQuery,
  searchQuery,
  topRatedQuery,
  trailerQuery,
  trendingMoviesQuery,
  trendingSeriesQuery,
  trendingTodayQuery,
  watchProvidersQuery,
} from './api/catalog.queries';

export const MIN_SEARCH_LENGTH = 2;

export const usePopular = (mediaType: MediaType) => useQuery(popularQuery(mediaType));
export const useInfinitePopular = (mediaType: MediaType) => useInfiniteQuery(infinitePopularQuery(mediaType));
export const useTrendingToday = () => useQuery(trendingTodayQuery());
export const useTrendingMovies = () => useQuery(trendingMoviesQuery());
export const useTrendingSeries = () => useQuery(trendingSeriesQuery());
export const useTopRated = (mediaType: MediaType) => useQuery(topRatedQuery(mediaType));
export const useNowPlaying = () => useQuery(nowPlayingQuery());

/** Runs only for queries of at least MIN_SEARCH_LENGTH characters; keeps old results while typing. */
export function useTitleSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    ...searchQuery(trimmed),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
  });
}

export const useTitleDetails = (mediaType: MediaType, id: number) =>
  useQuery(detailsQuery(mediaType, id));

export const useTitleCredits = (mediaType: MediaType, id: number) =>
  useQuery(creditsQuery(mediaType, id));

export const useTitleTrailer = (mediaType: MediaType, id: number) =>
  useQuery(trailerQuery(mediaType, id));

export const useWatchProviders = (mediaType: MediaType, id: number) =>
  useQuery(watchProvidersQuery(mediaType, id));

/** Warms the detail page cache when a card is hovered or focused. Errors are ignored. */
export function usePrefetchTitle() {
  const queryClient = useQueryClient();
  return useCallback(
    (mediaType: MediaType, id: number) => {
      void queryClient.prefetchQuery(detailsQuery(mediaType, id));
    },
    [queryClient],
  );
}
