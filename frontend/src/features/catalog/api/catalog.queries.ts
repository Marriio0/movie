import { queryOptions } from '@tanstack/react-query';
import type { MediaType } from '@/shared/types/media';
import { catalogApi } from './catalog.api';

export const catalogKeys = {
  all: ['catalog'] as const,
  popular: (mediaType: MediaType) => [...catalogKeys.all, 'popular', mediaType] as const,
  search: (query: string) => [...catalogKeys.all, 'search', query] as const,
  details: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'details', mediaType, id] as const,
  credits: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'credits', mediaType, id] as const,
  trailer: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'trailer', mediaType, id] as const,
  watchProviders: (mediaType: MediaType, id: number) =>
    [...catalogKeys.all, 'watch-providers', mediaType, id] as const,
};

const MINUTE = 60_000;

export const popularQuery = (mediaType: MediaType) =>
  queryOptions({
    queryKey: catalogKeys.popular(mediaType),
    queryFn: ({ signal }) => catalogApi.popular(mediaType, signal),
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
