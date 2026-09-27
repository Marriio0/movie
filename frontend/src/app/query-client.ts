import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/api-error';

export const MAX_QUERY_RETRIES = 2;

/** Retry only transient failures (network, timeout, 5xx), never 4xx, cancellations or offline. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_QUERY_RETRIES && isApiError(error) && error.isRetryable;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        // Writes are not idempotent from the user's point of view; the UI offers explicit retry.
        retry: false,
      },
    },
  });
}
