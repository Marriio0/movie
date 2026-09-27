/**
 * Validated public configuration. Read environment variables only through this module,
 * so a bad value fails once at startup instead of in the middle of a request.
 */

export interface AppEnv {
  /** '' for same-origin requests (dev proxy), otherwise an absolute http(s) origin/base path. */
  apiBaseUrl: string;
}

export function parseApiBaseUrl(raw: string | undefined): string {
  const value = raw?.trim() ?? '';
  if (value === '') return '';

  const invalid = (reason: string) =>
    new Error(
      `Invalid VITE_API_BASE_URL "${value}": ${reason}. Leave it empty to use the dev proxy.`,
    );

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalid('it must be an absolute URL such as https://api.example.com');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw invalid('only http and https are allowed');
  if (url.search || url.hash) throw invalid('it must not contain a query string or fragment');
  if (value.endsWith('/')) throw invalid('it must not end with "/"');

  return value;
}

export const env: AppEnv = {
  apiBaseUrl: parseApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
};
