import { fixtures } from '@/test/fixtures';
import { pickTrailer, toWatchAvailability } from './catalog.mappers';
import type { TmdbVideo, TmdbVideos, TmdbWatchProviders } from './tmdb.types';

const as = <T>(value: unknown) => value as T;

describe('pickTrailer', () => {
  it('prefers a French trailer over teasers, clips and English trailers (movie)', () => {
    expect(pickTrailer(as<TmdbVideos>(fixtures.movieVideos))).toEqual({
      youtubeKey: 'oGimpDBwkFc',
      name: 'Bande-annonce officielle 3 [VF]',
      language: 'fr',
      kind: 'trailer',
    });
  });

  it('prefers a French trailer over a newer English one (series)', () => {
    expect(pickTrailer(as<TmdbVideos>(fixtures.seriesVideos))).toMatchObject({
      youtubeKey: 'aAF12LNAeNI',
      language: 'fr',
      kind: 'trailer',
    });
  });

  it('falls back to a teaser, and ignores non-YouTube videos (synthetic)', () => {
    const base = as<TmdbVideos>(fixtures.movieVideos).results[0]!;
    const video = (overrides: Partial<TmdbVideo>): TmdbVideo => ({ ...base, ...overrides });
    const raw: TmdbVideos = {
      id: 1,
      results: [
        video({ key: 'vimeo', site: 'Vimeo', type: 'Trailer' }),
        video({ key: 'clip', type: 'Clip' }),
        video({ key: 'teaser', type: 'Teaser', iso_639_1: 'en' }),
      ],
    };
    expect(pickTrailer(raw)).toMatchObject({ youtubeKey: 'teaser', kind: 'teaser' });
  });

  it('returns null when there is no trailer or teaser', () => {
    expect(pickTrailer({ id: 1, results: [] })).toBeNull();
  });
});

describe('toWatchAvailability', () => {
  it('lists countries with offers and maps each category', () => {
    const availability = toWatchAvailability(as<TmdbWatchProviders>(fixtures.movieProviders));
    expect(availability.regions).toEqual(['BE', 'FR', 'GB', 'US']);

    const france = availability.byRegion.FR!;
    expect(france.link).toBe(
      'https://www.themoviedb.org/movie/693134-dune-part-two/watch?locale=FR',
    );
    expect(france.stream).toEqual([]);
    expect(france.rent.map((provider) => provider.name)).toContain('Apple TV Store');
    expect(availability.byRegion.GB!.stream.map((provider) => provider.name)).toContain('Netflix');
  });

  it('merges free and ad-supported offers and drops empty countries (synthetic)', () => {
    const provider = (id: number, name: string) => ({
      provider_id: id,
      provider_name: name,
      logo_path: null,
      display_priority: id,
    });
    const availability = toWatchAvailability({
      id: 1,
      results: {
        FR: {
          link: 'https://example.test/fr',
          free: [provider(2, 'Arte')],
          ads: [provider(1, 'Pluto'), provider(2, 'Arte')],
        },
        MA: { link: 'https://example.test/ma' },
      },
    });
    expect(availability.regions).toEqual(['FR']);
    expect(availability.byRegion.FR!.free.map((p) => p.name)).toEqual(['Pluto', 'Arte']);
  });
});
