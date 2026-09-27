/**
 * The only error type the UI sees for API calls. `kind` drives copy, retry and redirects;
 * `status` and `body` are for diagnostics only.
 */

export type ApiErrorKind =
  | 'offline' // the browser reports no connection; the request was not sent
  | 'network' // no response: server down, DNS, or a blocked CORS request
  | 'timeout' // no response within the client timeout
  | 'canceled' // aborted by the caller (e.g. TanStack Query unmounting); never shown to users
  | 'unauthorized' // 401 after one token refresh, or no token available
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'bad_request' // other 4xx
  | 'server'; // 5xx or an unexpected client-side failure

/**
 * Spring Boot's default error body. `message` is empty or missing unless the backend sets
 * `server.error.include-message`, so it is never shown to users.
 */
export interface SpringErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}

const USER_MESSAGES: Record<ApiErrorKind, string> = {
  offline: 'You’re offline. Check your connection and try again.',
  network: 'We couldn’t reach the server. Please try again.',
  timeout: 'This is taking longer than expected. Please try again.',
  canceled: 'The request was canceled.',
  unauthorized: 'Please sign in to continue.',
  forbidden: 'You don’t have access to this.',
  not_found: 'We couldn’t find what you were looking for.',
  bad_request: 'That request couldn’t be completed.',
  server: 'Something went wrong on our side. Please try again.',
};

const RETRYABLE_KINDS: ReadonlySet<ApiErrorKind> = new Set(['network', 'timeout', 'server']);

export interface ApiErrorOptions {
  status?: number | null;
  path?: string;
  body?: SpringErrorBody;
  cause?: unknown;
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly path: string | undefined;
  readonly body: SpringErrorBody | undefined;

  constructor(kind: ApiErrorKind, { status = null, path, body, cause }: ApiErrorOptions = {}) {
    super(USER_MESSAGES[kind], { cause });
    this.kind = kind;
    this.status = status;
    this.path = path;
    this.body = body;
  }

  /** Transient failures worth retrying automatically. */
  get isRetryable(): boolean {
    return RETRYABLE_KINDS.has(this.kind);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
