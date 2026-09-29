import { ApiError, isApiError } from '@/shared/api/api-error';
import { httpClient } from '@/shared/api/http-client';
import { normalizeError } from '@/shared/api/normalize-error';
import type { MediaType } from '@/shared/types/media';
import type {
  Credits,
  MediaDetails,
  MediaList,
  Trailer,
  WatchAvailability,
} from '../catalog.types';
import {
  fromMultiResult,
  pickTrailer,
  toCredits,
  toMediaDetails,
  toMediaList,
  toMediaSummary,
  toWatchAvailability,
} from './catalog.mappers';
import type {
  TmdbCredits,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbMultiResult,
  TmdbPage,
  TmdbTvDetails,
  TmdbTvListItem,
  TmdbVideos,
  TmdbWatchProviders,
} from './tmdb.types';

import { getStoredTmdbLang } from '@/shared/i18n/language-context';

/** URL segment the backend uses for each media type (MovieController). */
const segment = (mediaType: MediaType) => (mediaType === 'movie' ? 'movies' : 'series');

const TMDB_BEARER =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNTE2ZTA5YmMyNmYwODYzYjliMDZhMjVjYTFlYTZjMCIsIm5iZiI6MTc3ODk3OTA4MC42NjYsInN1YiI6IjZhMDkxMTA4ZmUyMmMwN2ZiMDdhOGM0YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.-vNHrqROd21vRrl7i3Ha3fpYXbv042QtK2dND2W3qSs';

function mapApiToTmdb(path: string, params: Record<string, string>): string | null {
  const lang = params.language || 'en-US';
  const page = params.page || '1';

  if (path === '/api/public/movies/popular') return `/movie/popular?language=${lang}&page=${page}`;
  if (path === '/api/public/series/popular') return `/tv/popular?language=${lang}&page=${page}`;
  if (path === '/api/public/trending/today') return `/trending/all/day?language=${lang}&page=${page}`;
  if (path === '/api/public/trending/movies') return `/trending/movie/day?language=${lang}&page=${page}`;
  if (path === '/api/public/trending/series') return `/trending/tv/day?language=${lang}&page=${page}`;
  if (path === '/api/public/movies/top-rated') return `/movie/top_rated?language=${lang}&page=${page}`;
  if (path === '/api/public/series/top-rated') return `/tv/top_rated?language=${lang}&page=${page}`;
  if (path === '/api/public/movies/now-playing') return `/movie/now_playing?language=${lang}&page=${page}`;
  if (path === '/api/public/search') return `/search/multi?language=${lang}&page=${page}&query=${encodeURIComponent(params.query || '')}`;

  let m = path.match(/^\/api\/public\/movies\/(\d+)\/credits$/);
  if (m) return `/movie/${m[1]}/credits?language=${lang}`;
  m = path.match(/^\/api\/public\/series\/(\d+)\/credits$/);
  if (m) return `/tv/${m[1]}/credits?language=${lang}`;

  m = path.match(/^\/api\/public\/movies\/(\d+)\/similar$/);
  if (m) return `/movie/${m[1]}/recommendations?language=${lang}`;
  m = path.match(/^\/api\/public\/series\/(\d+)\/similar$/);
  if (m) return `/tv/${m[1]}/recommendations?language=${lang}`;

  m = path.match(/^\/api\/public\/movies\/(\d+)\/videos$/);
  if (m) return `/movie/${m[1]}/videos?include_video_language=en,fr,ar,null`;
  m = path.match(/^\/api\/public\/series\/(\d+)\/videos$/);
  if (m) return `/tv/${m[1]}/videos?include_video_language=en,fr,ar,null`;

  m = path.match(/^\/api\/public\/movies\/(\d+)\/watch-providers$/);
  if (m) return `/movie/${m[1]}/watch/providers`;
  m = path.match(/^\/api\/public\/series\/(\d+)\/watch-providers$/);
  if (m) return `/tv/${m[1]}/watch/providers`;

  m = path.match(/^\/api\/public\/movies\/(\d+)$/);
  if (m) return `/movie/${m[1]}?language=${lang}&append_to_response=external_ids`;
  m = path.match(/^\/api\/public\/series\/(\d+)$/);
  if (m) return `/tv/${m[1]}?language=${lang}&append_to_response=external_ids`;

  return null;
}

/**
 * GET a public catalog endpoint and map the payload. Everything thrown is an ApiError.
 *
 * A 401 from a public endpoint is a masked server failure, not an auth problem. When the
 * backend throws (e.g. TMDB 404 for an unknown id), Spring forwards to /error, which
 * SecurityConfig does not permit, so the client receives 401 with an empty body.
 * Observed: GET /api/public/movies/999999999 → 401.
 */
async function getPublic<Raw, Result>(
  path: string,
  map: (raw: Raw) => Result,
  { params, signal }: { params?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<Result> {
  const isVideos = path.endsWith('/videos');
  const mergedParams = isVideos ? { ...params } : { language: getStoredTmdbLang(), ...params };

  try {
    const { data } = await httpClient.get<Raw>(path, { params: mergedParams, signal });
    return map(data);
  } catch (error) {
    // Standalone fallback: If backend server is offline or running on Native Android (APK)
    const tmdbEndpoint = mapApiToTmdb(path, mergedParams);
    if (import.meta.env.MODE !== 'test' && tmdbEndpoint && !(isApiError(error) && error.kind === 'not_found')) {
      try {
        const res = await fetch(`https://api.themoviedb.org/3${tmdbEndpoint}`, {
          headers: {
            Authorization: `Bearer ${TMDB_BEARER}`,
            Accept: 'application/json',
          },
          signal,
        });
        if (res.ok) {
          const raw = (await res.json()) as Raw;
          return map(raw);
        }
      } catch {
        // Continue to regular error handling
      }
    }

    if (isApiError(error) && error.kind === 'unauthorized') {
      throw new ApiError('server', { status: error.status, path: error.path, cause: error });
    }
    throw normalizeError(error);
  }
}

export const catalogApi = {
  /** GET /api/public/{movies|series}/popular: TMDB page 1 (the backend has no page parameter). */
  popular: (mediaType: MediaType, signal?: AbortSignal): Promise<MediaList> =>
    getPublic<TmdbPage<TmdbMovieListItem | TmdbTvListItem>, MediaList>(
      `/api/public/${segment(mediaType)}/popular`,
      (page) => toMediaList(page, (raw) => toMediaSummary(raw, mediaType)),
      { signal },
    ),

  /** GET /api/public/{movies|series}/popular with pagination support. */
  popularPaged: (
    mediaType: MediaType,
    page: number = 1,
    signal?: AbortSignal,
  ): Promise<MediaList> =>
    getPublic<TmdbPage<TmdbMovieListItem | TmdbTvListItem>, MediaList>(
      `/api/public/${segment(mediaType)}/popular`,
      (p) => toMediaList(p, (raw) => toMediaSummary(raw, mediaType)),
      { params: { page: String(page) }, signal },
    ),

  /** GET /api/public/trending/today: Trending movies and series today. */
  trendingToday: async (signal?: AbortSignal): Promise<MediaList> => {
    try {
      return await getPublic<TmdbPage<TmdbMultiResult>, MediaList>(
        '/api/public/trending/today',
        (page) => toMediaList(page, fromMultiResult),
        { signal },
      );
    } catch {
      return catalogApi.popular('movie', signal);
    }
  },

  /** GET /api/public/trending/movies: Trending movies this week/day. */
  trendingMovies: async (signal?: AbortSignal): Promise<MediaList> => {
    try {
      return await getPublic<TmdbPage<TmdbMovieListItem>, MediaList>(
        '/api/public/trending/movies',
        (page) => toMediaList(page, (raw) => toMediaSummary(raw, 'movie')),
        { signal },
      );
    } catch {
      return catalogApi.popular('movie', signal);
    }
  },

  /** GET /api/public/trending/series: Trending TV series this week/day. */
  trendingSeries: async (signal?: AbortSignal): Promise<MediaList> => {
    try {
      return await getPublic<TmdbPage<TmdbTvListItem>, MediaList>(
        '/api/public/trending/series',
        (page) => toMediaList(page, (raw) => toMediaSummary(raw, 'tv')),
        { signal },
      );
    } catch {
      return catalogApi.popular('tv', signal);
    }
  },

  /** GET /api/public/{movies|series}/top-rated: Highest rated titles. */
  topRated: async (mediaType: MediaType, signal?: AbortSignal): Promise<MediaList> => {
    try {
      return await getPublic<TmdbPage<TmdbMovieListItem | TmdbTvListItem>, MediaList>(
        `/api/public/${segment(mediaType)}/top-rated`,
        (page) => toMediaList(page, (raw) => toMediaSummary(raw, mediaType)),
        { signal },
      );
    } catch {
      return catalogApi.popular(mediaType, signal);
    }
  },

  /** GET /api/public/movies/now-playing: Movies currently playing in theaters. */
  nowPlaying: async (signal?: AbortSignal): Promise<MediaList> => {
    try {
      return await getPublic<TmdbPage<TmdbMovieListItem>, MediaList>(
        '/api/public/movies/now-playing',
        (page) => toMediaList(page, (raw) => toMediaSummary(raw, 'movie')),
        { signal },
      );
    } catch {
      return catalogApi.popular('movie', signal);
    }
  },

  /** GET /api/public/search?query=: TMDB multi-search page 1, people removed. */
  search: (query: string, signal?: AbortSignal): Promise<MediaList> =>
    getPublic<TmdbPage<TmdbMultiResult>, MediaList>(
      '/api/public/search',
      (page) => toMediaList(page, fromMultiResult),
      { params: { query }, signal },
    ),

  /** GET /api/public/{movies|series}/{id} */
  details: (mediaType: MediaType, id: number, signal?: AbortSignal): Promise<MediaDetails> =>
    getPublic<TmdbMovieDetails | TmdbTvDetails, MediaDetails>(
      `/api/public/${segment(mediaType)}/${id}`,
      (raw) => toMediaDetails(raw, mediaType),
      { signal },
    ),

  /** GET /api/public/{movies|series}/{id}/credits */
  credits: (mediaType: MediaType, id: number, signal?: AbortSignal): Promise<Credits> =>
    getPublic<TmdbCredits, Credits>(`/api/public/${segment(mediaType)}/${id}/credits`, toCredits, {
      signal,
    }),

  /** GET /api/public/{movies|series}/{id}/videos → best trailer, or null when there is none. */
  trailer: (mediaType: MediaType, id: number, signal?: AbortSignal): Promise<Trailer | null> =>
    getPublic<TmdbVideos, Trailer | null>(
      `/api/public/${segment(mediaType)}/${id}/videos`,
      pickTrailer,
      {
        signal,
      },
    ),

  /** GET /api/public/{movies|series}/{id}/similar → more like this / recommendations */
  similar: async (mediaType: MediaType, id: number, signal?: AbortSignal): Promise<MediaList> => {
    try {
      return await getPublic<TmdbPage<TmdbMovieListItem | TmdbTvListItem>, MediaList>(
        `/api/public/${segment(mediaType)}/${id}/similar`,
        (page) => toMediaList(page, (raw) => toMediaSummary(raw, mediaType)),
        { signal },
      );
    } catch {
      return catalogApi.popular(mediaType, signal);
    }
  },

  /** GET /api/public/{movies|series}/{id}/watch-providers → legal offers per country. */
  watchProviders: (
    mediaType: MediaType,
    id: number,
    signal?: AbortSignal,
  ): Promise<WatchAvailability> =>
    getPublic<TmdbWatchProviders, WatchAvailability>(
      `/api/public/${segment(mediaType)}/${id}/watch-providers`,
      toWatchAvailability,
      { signal },
    ),
};
