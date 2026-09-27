import { AxiosError, AxiosHeaders, CanceledError, type AxiosResponse } from 'axios';
import { ApiError } from './api-error';
import { kindForStatus, normalizeError } from './normalize-error';

const config = { url: '/api/user/profile', headers: new AxiosHeaders() };

function responseError(status: number, data: unknown): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, {}, response);
}

describe('kindForStatus', () => {
  it.each([
    [400, 'bad_request'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'bad_request'],
    [422, 'bad_request'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('maps %i to %s', (status, kind) => {
    expect(kindForStatus(status)).toBe(kind);
  });
});

describe('normalizeError', () => {
  it('returns ApiError instances unchanged', () => {
    const error = new ApiError('offline');
    expect(normalizeError(error)).toBe(error);
  });

  it('keeps the Spring error body for diagnostics but never uses its message', () => {
    const body = {
      timestamp: 't',
      status: 500,
      error: 'Internal Server Error',
      message: 'User not found',
      path: '/api/watchlist',
    };
    const error = normalizeError(responseError(500, body));
    expect(error).toMatchObject({ kind: 'server', status: 500, path: '/api/user/profile', body });
    expect(error.message).not.toContain('User not found');
    expect(error.isRetryable).toBe(true);
  });

  it('handles the empty body Spring Security sends with a 401', () => {
    const error = normalizeError(responseError(401, ''));
    expect(error).toMatchObject({ kind: 'unauthorized', status: 401, body: undefined });
    expect(error.isRetryable).toBe(false);
  });

  it('maps cancellations', () => {
    expect(normalizeError(new CanceledError()).kind).toBe('canceled');
  });

  it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])('maps %s to timeout', (code) => {
    expect(normalizeError(new AxiosError('timeout', code, config)).kind).toBe('timeout');
  });

  it('maps a missing response to network while online', () => {
    expect(
      normalizeError(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)).kind,
    ).toBe('network');
  });

  it('maps a missing response to offline while the browser is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(
      normalizeError(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)).kind,
    ).toBe('offline');
  });

  it('treats unknown throwables as a generic failure', () => {
    const cause = new TypeError('boom');
    const error = normalizeError(cause);
    expect(error).toMatchObject({ kind: 'server', status: null, cause });
  });
});
