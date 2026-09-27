import { ApiError, type ApiErrorKind } from '@/shared/api/api-error';
import { createQueryClient, shouldRetryQuery } from './query-client';

describe('shouldRetryQuery', () => {
  it.each<ApiErrorKind>(['network', 'timeout', 'server'])('retries %s errors', (kind) => {
    expect(shouldRetryQuery(0, new ApiError(kind))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(kind))).toBe(true);
  });

  it('stops after two retries', () => {
    expect(shouldRetryQuery(2, new ApiError('server'))).toBe(false);
  });

  it.each<ApiErrorKind>([
    'offline',
    'canceled',
    'unauthorized',
    'forbidden',
    'not_found',
    'bad_request',
  ])('never retries %s errors', (kind) => {
    expect(shouldRetryQuery(0, new ApiError(kind))).toBe(false);
  });

  it('never retries non-API errors', () => {
    expect(shouldRetryQuery(0, new Error('boom'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('applies the agreed defaults', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions();
    expect(queries).toMatchObject({
      staleTime: 300_000,
      gcTime: 1_800_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
    });
    expect(mutations).toMatchObject({ retry: false });
  });

  it('returns an independent client each time', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
