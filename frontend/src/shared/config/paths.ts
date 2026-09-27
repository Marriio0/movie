import type { MediaType } from '@/shared/types/media';

const withQuery = (path: string, key: string, value?: string) =>
  value ? `${path}?${key}=${encodeURIComponent(value)}` : path;

/**
 * Single source of truth for URLs. Use these builders instead of string literals
 * in <Link to>, navigate() and redirects.
 */
export const paths = {
  home: '/',
  movies: '/movies',
  series: '/series',
  title: (mediaType: MediaType, id: number) =>
    `/${mediaType === 'movie' ? 'movies' : 'series'}/${id}`,
  search: (query?: string) => withQuery('/search', 'q', query),
  login: (redirect?: string) => withQuery('/login', 'redirect', redirect),
  signup: (redirect?: string) => withQuery('/signup', 'redirect', redirect),
  resetPassword: '/reset-password',
  watchlist: '/watchlist',
  profile: '/profile',
} as const;
