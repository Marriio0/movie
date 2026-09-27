import { delay, http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { ApiError } from './api-error';
import {
  httpClient,
  REQUEST_TIMEOUT_MS,
  setAccessTokenProvider,
  setUnauthorizedHandler,
  type AccessTokenProvider,
} from './http-client';

const PROTECTED = '/api/user/profile';

/** Captures the Authorization header of every request to `path`. */
function recordAuthHeaders(path: string, respond: (call: number) => Response) {
  const seen: (string | null)[] = [];
  server.use(
    http.get(path, ({ request }) => {
      seen.push(request.headers.get('authorization'));
      return respond(seen.length);
    }),
  );
  return seen;
}

async function rejectionOf(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => {
      throw new Error('Expected the request to fail');
    },
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

afterEach(() => {
  setAccessTokenProvider(null);
  setUnauthorizedHandler(null);
});

describe('httpClient configuration', () => {
  it('uses the agreed defaults', () => {
    expect(httpClient.defaults.timeout).toBe(REQUEST_TIMEOUT_MS);
    expect(REQUEST_TIMEOUT_MS).toBe(15_000);
    expect(httpClient.defaults.withCredentials).toBe(false);
    expect(httpClient.defaults.headers.Accept).toBe('application/json');
  });

  it('reaches the verified health endpoint through the default handlers', async () => {
    const response = await httpClient.get<string>('/api/public/health', { responseType: 'text' });
    expect(response.data).toBe('OK');
  });
});

describe('public requests', () => {
  it('never send an Authorization header', async () => {
    setAccessTokenProvider(async () => 'token-123');
    const seen = recordAuthHeaders('/api/public/movies/popular', () => HttpResponse.json({}));

    await httpClient.get('/api/public/movies/popular', {
      headers: { Authorization: 'Bearer leaked' },
    });

    expect(seen).toEqual([null]);
  });

  it('encode query parameters', async () => {
    let received: string | null = null;
    server.use(
      http.get('/api/public/search', ({ request }) => {
        received = new URL(request.url).searchParams.get('query');
        return HttpResponse.json({});
      }),
    );

    await httpClient.get('/api/public/search', { params: { query: 'tom & jerry #1' } });

    expect(received).toBe('tom & jerry #1');
  });
});

describe('authenticated requests', () => {
  it('send the provider token as a bearer token', async () => {
    const provider = vi.fn<AccessTokenProvider>(async () => 'token-123');
    setAccessTokenProvider(provider);
    const seen = recordAuthHeaders(PROTECTED, () => HttpResponse.json({ id: 'u1' }));

    const response = await httpClient.get(PROTECTED, { authenticated: true });

    expect(response.data).toEqual({ id: 'u1' });
    expect(seen).toEqual(['Bearer token-123']);
    expect(provider).toHaveBeenCalledWith({ forceRefresh: false });
  });

  const missingTokenCases: [string, AccessTokenProvider | null][] = [
    ['no provider is registered', null],
    ['the provider has no signed-in user', async () => null],
    ['the provider fails', async () => Promise.reject(new Error('idp down'))],
  ];

  it.each(missingTokenCases)(
    'are rejected without a network call when %s',
    async (_case, provider) => {
      setAccessTokenProvider(provider);
      // No handler for PROTECTED: a network call would fail the test via onUnhandledRequest.
      const error = await rejectionOf(httpClient.get(PROTECTED, { authenticated: true }));
      expect(error.kind).toBe('unauthorized');
    },
  );

  it('retry a 401 once with a force-refreshed token', async () => {
    const provider = vi.fn<AccessTokenProvider>(async ({ forceRefresh }) =>
      forceRefresh ? 'fresh' : 'stale',
    );
    const onUnauthorized = vi.fn();
    setAccessTokenProvider(provider);
    setUnauthorizedHandler(onUnauthorized);
    const seen = recordAuthHeaders(PROTECTED, (call) =>
      call === 1 ? new HttpResponse(null, { status: 401 }) : HttpResponse.json({ id: 'u1' }),
    );

    const response = await httpClient.get(PROTECTED, { authenticated: true });

    expect(response.data).toEqual({ id: 'u1' });
    expect(seen).toEqual(['Bearer stale', 'Bearer fresh']);
    expect(provider.mock.calls).toEqual([[{ forceRefresh: false }], [{ forceRefresh: true }]]);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('call the unauthorized handler exactly once when the retry is also rejected', async () => {
    const onUnauthorized = vi.fn();
    setAccessTokenProvider(async () => 'token');
    setUnauthorizedHandler(onUnauthorized);
    const seen = recordAuthHeaders(PROTECTED, () => new HttpResponse(null, { status: 401 }));

    const error = await rejectionOf(httpClient.get(PROTECTED, { authenticated: true }));

    expect(error).toMatchObject({ kind: 'unauthorized', status: 401 });
    expect(seen).toHaveLength(2);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('do not retry or sign out on 403', async () => {
    const onUnauthorized = vi.fn();
    setAccessTokenProvider(async () => 'token');
    setUnauthorizedHandler(onUnauthorized);
    const seen = recordAuthHeaders(PROTECTED, () => new HttpResponse(null, { status: 403 }));

    const error = await rejectionOf(httpClient.get(PROTECTED, { authenticated: true }));

    expect(error.kind).toBe('forbidden');
    expect(seen).toHaveLength(1);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('failure normalization', () => {
  it('turns HTTP errors into ApiError with the Spring body', async () => {
    const body = {
      timestamp: 't',
      status: 500,
      error: 'Internal Server Error',
      path: '/api/public/movies/0',
    };
    server.use(http.get('/api/public/movies/0', () => HttpResponse.json(body, { status: 500 })));

    const error = await rejectionOf(httpClient.get('/api/public/movies/0'));

    expect(error).toMatchObject({
      kind: 'server',
      status: 500,
      body,
      path: '/api/public/movies/0',
    });
  });

  it('reports network failures', async () => {
    server.use(http.get('/api/public/health', () => HttpResponse.error()));
    const error = await rejectionOf(httpClient.get('/api/public/health'));
    expect(error.kind).toBe('network');
  });

  it('reports timeouts', async () => {
    server.use(
      http.get('/api/public/health', async () => {
        await delay('infinite');
        return HttpResponse.text('OK');
      }),
    );
    // MSW's XMLHttpRequest mock never fires `ontimeout` (real browsers do), so this case uses
    // Axios's fetch adapter, which exercises the same interceptors and error normalization.
    // Node's fetch needs an absolute URL.
    const error = await rejectionOf(
      httpClient.get('/api/public/health', {
        timeout: 20,
        adapter: 'fetch',
        baseURL: window.location.origin,
      }),
    );
    expect(error.kind).toBe('timeout');
  });

  it('reports cancellations', async () => {
    server.use(
      http.get('/api/public/health', async () => {
        await delay('infinite');
        return HttpResponse.text('OK');
      }),
    );
    const controller = new AbortController();
    const request = httpClient.get('/api/public/health', { signal: controller.signal });
    controller.abort();

    const error = await rejectionOf(request);
    expect(error.kind).toBe('canceled');
  });

  it('does not send requests while the browser is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    // No handler needed: the request must never reach the network.
    const error = await rejectionOf(httpClient.get('/api/public/movies/popular'));
    expect(error.kind).toBe('offline');
  });
});
