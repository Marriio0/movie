import { http, HttpResponse } from 'msw';
import { ApiError } from '@/shared/api/api-error';
import { server } from '@/test/msw/server';
import { catalogApi } from './catalog.api';

async function failureOf(promise: Promise<unknown>): Promise<ApiError> {
  const reason = await promise.then(
    () => {
      throw new Error('Expected a failure');
    },
    (error: unknown) => error,
  );
  expect(reason).toBeInstanceOf(ApiError);
  return reason as ApiError;
}

describe('catalogApi', () => {
  it('loads and maps popular movies', async () => {
    const list = await catalogApi.popular('movie');
    expect(list.items).toHaveLength(4);
    expect(list.items[0]).toMatchObject({
      mediaType: 'movie',
      title: 'Spider-Man : Brand New Day',
    });
  });

  it('uses the series endpoint for tv', async () => {
    const list = await catalogApi.popular('tv');
    expect(list.items.every((item) => item.mediaType === 'tv')).toBe(true);
  });

  it('sends the search query as an encoded parameter', async () => {
    let received: string | null = null;
    server.use(
      http.get('/api/public/search', ({ request }) => {
        received = new URL(request.url).searchParams.get('query');
        return HttpResponse.json({ page: 1, results: [], total_pages: 1, total_results: 0 });
      }),
    );
    await catalogApi.search('tom & jerry');
    expect(received).toBe('tom & jerry');
  });

  it('reports the masked 401 from a failing public endpoint as a server error', async () => {
    // Observed backend behavior for an unknown id: 401 with an empty body.
    const error = await failureOf(catalogApi.details('movie', 999999999));
    expect(error).toMatchObject({ kind: 'server', status: 401 });
    expect(error.message).not.toMatch(/sign in/i);
  });

  it('keeps real HTTP kinds such as 404', async () => {
    server.use(http.get('/api/public/movies/:id', () => new HttpResponse(null, { status: 404 })));
    const error = await failureOf(catalogApi.details('movie', 1));
    expect(error.kind).toBe('not_found');
  });

  it('turns malformed payloads into ApiError instead of leaking TypeErrors', async () => {
    server.use(
      http.get('/api/public/movies/popular', () => HttpResponse.json({ unexpected: true })),
    );
    const error = await failureOf(catalogApi.popular('movie'));
    expect(error.kind).toBe('server');
    expect(error.cause).toBeInstanceOf(TypeError);
  });
});
