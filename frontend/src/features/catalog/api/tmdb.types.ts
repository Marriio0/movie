/**
 * Raw TMDB payloads exactly as the Spring Boot backend passes them through
 * (TmdbService returns TMDB's JSON unchanged). Shapes verified against live responses from
 * the /api/public/* endpoints; only the fields the app reads are typed.
 */

export interface TmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TmdbMediaBase {
  id: number;
  adult: boolean;
  backdrop_path: string | null;
  poster_path: string | null;
  original_language: string;
  overview: string; // '' when TMDB has no translation for the requested language
  vote_average: number;
  vote_count: number;
}

export interface TmdbMovieListItem extends TmdbMediaBase {
  title: string;
  original_title: string;
  release_date?: string; // may be '' or missing
}

export interface TmdbTvListItem extends TmdbMediaBase {
  name: string;
  original_name: string;
  first_air_date?: string;
}

export interface TmdbPersonResult {
  media_type: 'person';
  id: number;
  name: string;
}

/** /search/multi mixes movies, series and people, tagged with media_type. */
export type TmdbMultiResult =
  | (TmdbMovieListItem & { media_type: 'movie' })
  | (TmdbTvListItem & { media_type: 'tv' })
  | TmdbPersonResult;

export interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetailsExtras {
  genres: TmdbGenre[];
  status: string | null;
  tagline: string | null;
}

export interface TmdbSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date?: string | null;
  poster_path?: string | null;
  overview?: string;
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
}

export interface TmdbMovieDetails extends TmdbMovieListItem, TmdbDetailsExtras {
  runtime: number | null;
  imdb_id?: string | null;
  external_ids?: TmdbExternalIds;
}

export interface TmdbTvDetails extends TmdbTvListItem, TmdbDetailsExtras {
  episode_run_time: number[];
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  created_by: { id: number; name: string }[];
  seasons?: TmdbSeason[];
  external_ids?: TmdbExternalIds;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string | null;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

/** GET /api/public/{movies|series}/{id}/videos (fr, en and language-less videos). */
export interface TmdbVideo {
  id: string;
  key: string; // YouTube video id when site === 'YouTube'
  name: string;
  site: string;
  type: string; // 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | …
  official: boolean;
  iso_639_1: string | null;
  published_at: string;
}

export interface TmdbVideos {
  id: number;
  results: TmdbVideo[];
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

/** Offers in one country. Every category is optional; `ads` means free with ads. */
export interface TmdbRegionProviders {
  link: string;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

/** GET /api/public/{movies|series}/{id}/watch-providers, keyed by ISO 3166-1 country code. */
export interface TmdbWatchProviders {
  id: number;
  results: Record<string, TmdbRegionProviders>;
}
