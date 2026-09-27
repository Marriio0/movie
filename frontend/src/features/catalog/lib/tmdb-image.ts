/**
 * TMDB image CDN helpers. Images load straight from TMDB's public CDN, not through the backend.
 * Available widths per type: https://developer.themoviedb.org/docs/image-basics
 */

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export type TmdbImageKind = 'poster' | 'backdrop' | 'profile' | 'logo';

const WIDTHS: Record<TmdbImageKind, readonly number[]> = {
  poster: [185, 342, 500, 780],
  backdrop: [300, 780, 1280],
  profile: [185],
  logo: [92, 154],
};

export function tmdbImageUrl(path: string, width: number): string {
  return `${TMDB_IMAGE_BASE}/w${width}${path}`;
}

export function tmdbSrcSet(path: string, kind: TmdbImageKind): string {
  return WIDTHS[kind].map((width) => `${tmdbImageUrl(path, width)} ${width}w`).join(', ');
}

/** Fallback `src` for browsers without srcset support: a mid-size rendition. */
export function tmdbDefaultSrc(path: string, kind: TmdbImageKind): string {
  const widths = WIDTHS[kind];
  return tmdbImageUrl(path, widths[Math.floor((widths.length - 1) / 2)]!);
}

/** `sizes` for posters in rails and grids: ~2.3 per row on phones, ~4.5 on tablets, 6 on desktop. */
export const POSTER_SIZES = '(min-width: 1024px) 15vw, (min-width: 640px) 22vw, 42vw';
