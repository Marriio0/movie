/**
 * Real responses recorded from the running Spring Boot backend (GET /api/public/*) on
 * 2026-09-27, trimmed to a few items. TMDB content is French because TmdbService requests fr-FR.
 * Typed loosely here; tests cast to the raw TMDB types they exercise.
 */
import movieCredits from './movie-credits.json';
import movieDetails from './movie-details.json';
import movieProviders from './movie-providers.json';
import movieVideos from './movie-videos.json';
import popularMovies from './popular-movies.json';
import popularSeries from './popular-series.json';
import searchDune from './search-dune.json';
import searchEmpty from './search-empty.json';
import seriesCredits from './series-credits.json';
import seriesDetails from './series-details.json';
import seriesProviders from './series-providers.json';
import seriesVideos from './series-videos.json';

export const fixtures = {
  movieCredits,
  movieDetails,
  movieProviders,
  movieVideos,
  popularMovies,
  popularSeries,
  searchDune,
  searchEmpty,
  seriesCredits,
  seriesDetails,
  seriesProviders,
  seriesVideos,
};

/** Known ids in the fixtures. */
export const FIXTURE_IDS = { movie: movieDetails.id, series: seriesDetails.id } as const;
