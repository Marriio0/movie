import type { MediaType } from '@/shared/types/media';

/** A movie or series as the UI uses it, independent of TMDB's field names. */
export interface MediaSummary {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  year: number | null;
  /** TMDB vote average out of 10; null when nobody has voted. */
  rating: number | null;
  voteCount: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MediaSeason {
  seasonNumber: number;
  name: string;
  episodeCount: number;
}

export interface MediaDetails extends MediaSummary {
  tagline: string | null;
  genres: Genre[];
  runtimeMinutes: number | null;
  status: string | null;
  originalLanguage: string;
  seasonCount: number | null;
  episodeCount: number | null;
  /** Series creators; empty for movies (directors come from credits). */
  creators: string[];
  imdbId?: string | null;
  seasons?: MediaSeason[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string | null;
  profilePath: string | null;
}

export interface Credits {
  cast: CastMember[];
  directors: string[];
}

/**
 * First page of a TMDB list. The backend has no `page` parameter yet, so pagination
 * is not exposed.
 */
export interface MediaList {
  items: MediaSummary[];
  page?: number;
  totalPages?: number;
}

/**
 * TmdbService requests every TMDB resource with language=fr-FR, so translated text (overviews,
 * taglines, genres) is French. Used for `lang` attributes; update when the backend accepts a
 * `language` parameter.
 */
export const TMDB_CONTENT_LANG = 'fr';

/** A YouTube trailer or teaser chosen for the title. */
export interface Trailer {
  youtubeKey: string;
  name: string;
  /** ISO 639-1 language of the audio, when TMDB knows it. */
  language: string | null;
  kind: 'trailer' | 'teaser';
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface RegionOffers {
  /** TMDB's "where to watch" page for this country (data by JustWatch). */
  link: string;
  stream: WatchProvider[];
  free: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface WatchAvailability {
  /** Country codes with at least one offer. */
  regions: string[];
  byRegion: Record<string, RegionOffers>;
}
