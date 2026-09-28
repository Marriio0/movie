import { yearOf } from '@/shared/lib/format';
import type { MediaType } from '@/shared/types/media';
import type {
  CastMember,
  Credits,
  MediaDetails,
  MediaList,
  MediaSeason,
  MediaSummary,
  RegionOffers,
  Trailer,
  WatchAvailability,
  WatchProvider,
} from '../catalog.types';
import type {
  TmdbCredits,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbMultiResult,
  TmdbPage,
  TmdbProvider,
  TmdbTvDetails,
  TmdbTvListItem,
  TmdbVideos,
  TmdbWatchProviders,
} from './tmdb.types';

/** The only place that knows TMDB's field names. */

const MAX_CAST = 12;

const textOrNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isMovie = (raw: TmdbMovieListItem | TmdbTvListItem): raw is TmdbMovieListItem =>
  'title' in raw;

export function toMediaSummary(
  raw: TmdbMovieListItem | TmdbTvListItem,
  mediaType: MediaType,
): MediaSummary {
  const movie = isMovie(raw);
  const releaseDate = textOrNull(movie ? raw.release_date : raw.first_air_date);
  return {
    id: raw.id,
    mediaType,
    title: movie ? raw.title : raw.name,
    originalTitle: movie ? raw.original_title : raw.original_name,
    overview: textOrNull(raw.overview),
    posterPath: raw.poster_path || null,
    backdropPath: raw.backdrop_path || null,
    releaseDate,
    year: yearOf(releaseDate),
    rating: raw.vote_count > 0 ? raw.vote_average : null,
    voteCount: raw.vote_count,
    genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids : [],
  };
}

/** Multi-search result → summary; people are not titles, so they map to null. */
export function fromMultiResult(raw: TmdbMultiResult): MediaSummary | null {
  if (raw.media_type === 'movie' || raw.media_type === 'tv')
    return toMediaSummary(raw, raw.media_type);
  return null;
}

/** Maps a TMDB page, dropping nulls and duplicate titles. */
export function toMediaList<R>(page: TmdbPage<R>, map: (raw: R) => MediaSummary | null): MediaList {
  const seen = new Set<string>();
  const items: MediaSummary[] = [];
  for (const raw of page.results) {
    const item = map(raw);
    if (!item) continue;
    const key = `${item.mediaType}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return { items, page: page.page, totalPages: page.total_pages };
}

export function toMediaDetails(
  raw: TmdbMovieDetails | TmdbTvDetails,
  mediaType: MediaType,
): MediaDetails {
  const movie = isMovie(raw);
  const runtime = movie ? raw.runtime : (raw.episode_run_time[0] ?? null);
  const rawObj = raw as TmdbMovieDetails & TmdbTvDetails;
  const imdbId = rawObj.imdb_id ?? rawObj.external_ids?.imdb_id ?? null;
  const seasons: MediaSeason[] = Array.isArray(rawObj.seasons)
    ? rawObj.seasons
        .filter((s) => s && s.season_number > 0)
        .map((s) => ({
          seasonNumber: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          episodeCount: s.episode_count || 1,
        }))
    : [];

  return {
    ...toMediaSummary(raw, mediaType),
    tagline: textOrNull(raw.tagline),
    genres: raw.genres.map(({ id, name }) => ({ id, name })),
    runtimeMinutes: runtime && runtime > 0 ? runtime : null,
    status: textOrNull(raw.status),
    originalLanguage: raw.original_language,
    seasonCount: movie ? null : (raw.number_of_seasons ?? null),
    episodeCount: movie ? null : (raw.number_of_episodes ?? null),
    creators: movie ? [] : raw.created_by.map((creator) => creator.name),
    imdbId,
    seasons: movie ? [] : seasons,
  };
}

export function toCredits(raw: TmdbCredits): Credits {
  const cast: CastMember[] = [...raw.cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_CAST)
    .map((member) => ({
      id: member.id,
      name: member.name,
      character: textOrNull(member.character),
      profilePath: member.profile_path || null,
    }));
  const directors = [
    ...new Set(raw.crew.filter((member) => member.job === 'Director').map((member) => member.name)),
  ];
  return { cast, directors };
}

const TRAILER_TYPES = ['Trailer', 'Teaser'] as const;
// Content is requested in French (TmdbService), so French trailers come first.
const TRAILER_LANGUAGES = ['fr', 'en', null] as const;

const rankOf = <T>(list: readonly T[], value: T) => {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
};

/**
 * Picks the most relevant YouTube trailer: trailers before teasers, French before English,
 * official before unofficial, newest first. Clips and featurettes are ignored.
 */
export function pickTrailer(raw: TmdbVideos): Trailer | null {
  if (!raw?.results || raw.results.length === 0) return null;
  const youtubeVideos = raw.results.filter((v) => v.site === 'YouTube' && v.key);
  if (youtubeVideos.length === 0) return null;

  const candidates = youtubeVideos.filter((video) =>
    (TRAILER_TYPES as readonly string[]).includes(video.type),
  );
  const pool = candidates.length > 0 ? candidates : youtubeVideos;

  pool.sort(
    (a, b) =>
      rankOf(TRAILER_TYPES as readonly string[], a.type) -
        rankOf(TRAILER_TYPES as readonly string[], b.type) ||
      rankOf<string | null>(TRAILER_LANGUAGES, a.iso_639_1) -
        rankOf<string | null>(TRAILER_LANGUAGES, b.iso_639_1) ||
      Number(b.official) - Number(a.official) ||
      b.published_at.localeCompare(a.published_at),
  );
  const best = pool[0];
  if (!best) return null;
  return {
    youtubeKey: best.key,
    name: best.name,
    language: best.iso_639_1 || null,
    kind: best.type === 'Trailer' ? 'trailer' : 'teaser',
  };
}

const toProviders = (...groups: (TmdbProvider[] | undefined)[]): WatchProvider[] => {
  const seen = new Set<number>();
  return groups
    .flatMap((group) => group ?? [])
    .toSorted((a, b) => a.display_priority - b.display_priority)
    .filter((provider) => !seen.has(provider.provider_id) && seen.add(provider.provider_id))
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logoPath: provider.logo_path || null,
    }));
};

export function toWatchAvailability(raw: TmdbWatchProviders): WatchAvailability {
  const byRegion: Record<string, RegionOffers> = {};
  for (const [region, offers] of Object.entries(raw.results)) {
    const mapped: RegionOffers = {
      link: offers.link,
      stream: toProviders(offers.flatrate),
      free: toProviders(offers.free, offers.ads),
      rent: toProviders(offers.rent),
      buy: toProviders(offers.buy),
    };
    if (mapped.stream.length + mapped.free.length + mapped.rent.length + mapped.buy.length > 0) {
      byRegion[region] = mapped;
    }
  }
  return { regions: Object.keys(byRegion).sort(), byRegion };
}
