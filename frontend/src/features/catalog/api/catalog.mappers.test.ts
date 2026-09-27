import { fixtures } from '@/test/fixtures';
import {
  fromMultiResult,
  toCredits,
  toMediaDetails,
  toMediaList,
  toMediaSummary,
} from './catalog.mappers';
import type {
  TmdbCredits,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbMultiResult,
  TmdbPage,
  TmdbTvDetails,
  TmdbTvListItem,
} from './tmdb.types';

// Fixtures are real backend responses; cast them to the raw types under test.
const as = <T>(value: unknown) => value as T;
const popularMovies = as<TmdbPage<TmdbMovieListItem>>(fixtures.popularMovies);
const popularSeries = as<TmdbPage<TmdbTvListItem>>(fixtures.popularSeries);
const searchDune = as<TmdbPage<TmdbMultiResult>>(fixtures.searchDune);

describe('toMediaSummary', () => {
  it('maps a TMDB movie', () => {
    expect(toMediaSummary(popularMovies.results[0]!, 'movie')).toEqual({
      id: 969681,
      mediaType: 'movie',
      title: 'Spider-Man : Brand New Day',
      originalTitle: 'Spider-Man: Brand New Day',
      overview: expect.any(String),
      posterPath: '/jjCCZcCtggGjKik2gXjyux1VEdZ.jpg',
      backdropPath: '/qeQJx07rK2xm8SD2sJxFKhE7gs0.jpg',
      releaseDate: '2026-07-29',
      year: 2026,
      rating: 7.865,
      voteCount: 2881,
    });
  });

  it('maps a TMDB series (name, first_air_date)', () => {
    const series = popularSeries.results[0]!;
    const summary = toMediaSummary(series, 'tv');
    expect(summary).toMatchObject({ id: series.id, mediaType: 'tv', title: series.name });
    expect(summary.year).toBe(Number(series.first_air_date!.slice(0, 4)));
  });

  it('turns an untranslated (empty) overview into null', () => {
    const untranslated = popularMovies.results.find((movie) => movie.overview === '')!;
    expect(toMediaSummary(untranslated, 'movie').overview).toBeNull();
  });

  it('normalizes missing data (synthetic edge case)', () => {
    const raw: TmdbMovieListItem = {
      ...popularMovies.results[0]!,
      release_date: '',
      poster_path: null,
      backdrop_path: null,
      vote_average: 0,
      vote_count: 0,
    };
    expect(toMediaSummary(raw, 'movie')).toMatchObject({
      releaseDate: null,
      year: null,
      posterPath: null,
      backdropPath: null,
      rating: null,
    });
  });
});

describe('search results', () => {
  it('keeps movies and series and drops people', () => {
    const list = toMediaList(searchDune, fromMultiResult);
    expect(list.items.map((item) => item.mediaType)).toEqual(['movie', 'movie', 'tv']);
    expect(searchDune.results.some((result) => result.media_type === 'person')).toBe(true);
  });

  it('removes duplicate titles (synthetic edge case)', () => {
    const page = {
      ...popularMovies,
      results: [popularMovies.results[0]!, popularMovies.results[0]!],
    };
    expect(toMediaList(page, (raw) => toMediaSummary(raw, 'movie')).items).toHaveLength(1);
  });
});

describe('toMediaDetails', () => {
  it('maps movie details', () => {
    const details = toMediaDetails(as<TmdbMovieDetails>(fixtures.movieDetails), 'movie');
    expect(details).toMatchObject({
      id: 693134,
      title: 'Dune : Deuxième partie',
      originalTitle: 'Dune: Part Two',
      tagline: 'Longue vie à la Rébellion !',
      runtimeMinutes: 165,
      status: 'Released',
      originalLanguage: 'en',
      seasonCount: null,
      episodeCount: null,
      creators: [],
      genres: [
        { id: 878, name: 'Science-Fiction' },
        { id: 12, name: 'Aventure' },
      ],
    });
  });

  it('maps series details; an empty episode_run_time means unknown runtime', () => {
    const details = toMediaDetails(as<TmdbTvDetails>(fixtures.seriesDetails), 'tv');
    expect(details).toMatchObject({
      id: 1399,
      title: 'Game of Thrones',
      runtimeMinutes: null,
      seasonCount: 8,
      episodeCount: 73,
      creators: ['David Benioff', 'D. B. Weiss'],
      status: 'Ended',
    });
  });
});

describe('toCredits', () => {
  it('orders the cast by billing and extracts directors', () => {
    const credits = toCredits(as<TmdbCredits>(fixtures.movieCredits));
    expect(credits.directors).toEqual(['Denis Villeneuve']);
    expect(credits.cast.map((member) => member.name)).toEqual(
      as<TmdbCredits>(fixtures.movieCredits)
        .cast.toSorted((a, b) => a.order - b.order)
        .map((member) => member.name),
    );
  });

  it('keeps at most 12 cast members (synthetic edge case)', () => {
    const base = as<TmdbCredits>(fixtures.movieCredits);
    const many = Array.from({ length: 20 }, (_, index) => ({
      ...base.cast[0]!,
      id: index,
      order: 19 - index,
    }));
    const credits = toCredits({ ...base, cast: many });
    expect(credits.cast).toHaveLength(12);
    expect(credits.cast[0]!.id).toBe(19);
  });
});
