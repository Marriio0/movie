import axios, { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/config/env';
import { ApiError } from './api-error';
import { normalizeError } from './normalize-error';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * Send the signed-in user's bearer token. Only for endpoints the backend protects.
     * (Not `auth`: Axios already uses that name for HTTP Basic credentials.)
     */
    authenticated?: boolean;
    /** Internal: set once a 401 has been retried with a refreshed token. */
    _retried?: boolean;
  }
}

/**
 * Supplies the identity provider's access token. Registered by the auth feature, so this layer
 * stays independent of Firebase, FusionAuth or React.
 * Must return null when nobody is signed in.
 */
export type AccessTokenProvider = (options: { forceRefresh: boolean }) => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessTokenProvider(provider: AccessTokenProvider | null): void {
  accessTokenProvider = provider;
}

/** Called once when an authenticated request is still rejected after a token refresh. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * The single HTTP client for the Spring Boot API. Callers get domain data or an ApiError,
 * never a raw Axios error.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: false, // bearer tokens only: no cookies, so no CSRF exposure
  headers: { Accept: 'application/json' },
});

async function resolveAccessToken(
  forceRefresh: boolean,
  path: string | undefined,
): Promise<string> {
  if (!accessTokenProvider) throw new ApiError('unauthorized', { path });

  let token: string | null;
  try {
    token = await accessTokenProvider({ forceRefresh });
  } catch (cause) {
    throw new ApiError('unauthorized', { path, cause });
  }
  if (!token) throw new ApiError('unauthorized', { path });
  return token;
}

httpClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // navigator.onLine === false is reliable ("definitely offline"); true is not, so only block on false.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('offline', { path: config.url });
  }

  if (config.authenticated) {
    const token = await resolveAccessToken(config._retried === true, config.url);
    config.headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Public endpoints never receive credentials, even if a caller passed them by mistake.
    config.headers.delete('Authorization');
  }
  return config;
});

httpClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && error.config?.authenticated) {
    if (!error.config._retried) {
      // The cached token may have expired or been revoked: retry once with a fresh one.
      error.config._retried = true;
      return httpClient.request(error.config);
    }
    unauthorizedHandler?.();
  }
  throw normalizeError(error);
});
