import { isAxiosError, isCancel } from 'axios';
import { ApiError, type ApiErrorKind, type SpringErrorBody } from './api-error';

export function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'server';
  return 'bad_request';
}

function asSpringErrorBody(data: unknown): SpringErrorBody | undefined {
  // Spring Security's 401 has an empty body; only keep JSON objects.
  return typeof data === 'object' && data !== null ? (data as SpringErrorBody) : undefined;
}

const isBrowserOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/** Converts anything thrown during a request into an ApiError. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isCancel(error)) return new ApiError('canceled', { cause: error });

  if (isAxiosError(error)) {
    const path = error.config?.url;

    if (error.response) {
      const { status, data } = error.response;
      return new ApiError(kindForStatus(status), {
        status,
        path,
        body: asSpringErrorBody(data),
        cause: error,
      });
    }
    if (error.code === 'ERR_CANCELED') return new ApiError('canceled', { path, cause: error });
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('timeout', { path, cause: error });
    }
    return new ApiError(isBrowserOffline() ? 'offline' : 'network', { path, cause: error });
  }

  // Not an HTTP failure (e.g. a bug in a response transform): report it as a generic failure.
  return new ApiError('server', { cause: error });
}
