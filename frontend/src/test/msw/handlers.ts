import { http, HttpResponse } from 'msw';
import { FIXTURE_IDS, fixtures } from '../fixtures';

/**
 * Default handlers mirror endpoints that exist in the Spring Boot code, returning responses
 * recorded from it. Tests add case-specific handlers with `server.use(...)`.
 */

/**
 * What the backend actually returns when a public endpoint fails (e.g. unknown TMDB id):
 * Spring Security blocks the /error dispatch, so the client gets 401 with an empty body.
 */
export const maskedBackendError = () => new HttpResponse(null, { status: 401 });

export const handlers = [
  // MovieController#health returns the plain-text body "OK".
  http.get('/api/public/health', () => HttpResponse.text('OK')),

  http.get('/api/public/movies/popular', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/series/popular', () => HttpResponse.json(fixtures.popularSeries)),
  http.get('/api/public/trending/today', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/trending/movies', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/trending/series', () => HttpResponse.json(fixtures.popularSeries)),
  http.get('/api/public/movies/top-rated', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/series/top-rated', () => HttpResponse.json(fixtures.popularSeries)),
  http.get('/api/public/movies/now-playing', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/arabic/moroccan', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/arabic/egyptian', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/arabic/classic', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/arabic/trending', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/arabic/series', () => HttpResponse.json(fixtures.popularSeries)),

  http.get('/api/public/search', ({ request }) => {
    const query = new URL(request.url).searchParams.get('query')?.toLowerCase();
    return HttpResponse.json(query === 'dune' ? fixtures.searchDune : fixtures.searchEmpty);
  }),

  http.get('/api/public/movies/:id/videos', ({ params }) =>
    params.id === String(FIXTURE_IDS.movie)
      ? HttpResponse.json(fixtures.movieVideos)
      : maskedBackendError(),
  ),
  http.get('/api/public/series/:id/videos', ({ params }) =>
    params.id === String(FIXTURE_IDS.series)
      ? HttpResponse.json(fixtures.seriesVideos)
      : maskedBackendError(),
  ),
  http.get('/api/public/movies/:id/watch-providers', ({ params }) =>
    params.id === String(FIXTURE_IDS.movie)
      ? HttpResponse.json(fixtures.movieProviders)
      : maskedBackendError(),
  ),
  http.get('/api/public/series/:id/watch-providers', ({ params }) =>
    params.id === String(FIXTURE_IDS.series)
      ? HttpResponse.json(fixtures.seriesProviders)
      : maskedBackendError(),
  ),
  http.get('/api/public/movies/:id/credits', ({ params }) =>
    params.id === String(FIXTURE_IDS.movie)
      ? HttpResponse.json(fixtures.movieCredits)
      : maskedBackendError(),
  ),
  http.get('/api/public/series/:id/credits', ({ params }) =>
    params.id === String(FIXTURE_IDS.series)
      ? HttpResponse.json(fixtures.seriesCredits)
      : maskedBackendError(),
  ),
  http.get('/api/public/movies/:id/similar', () => HttpResponse.json(fixtures.popularMovies)),
  http.get('/api/public/series/:id/similar', () => HttpResponse.json(fixtures.popularSeries)),
  http.get('/api/public/movies/:id', ({ params }) =>
    params.id === String(FIXTURE_IDS.movie)
      ? HttpResponse.json(fixtures.movieDetails)
      : maskedBackendError(),
  ),
  http.get('/api/public/series/:id', ({ params }) =>
    params.id === String(FIXTURE_IDS.series)
      ? HttpResponse.json(fixtures.seriesDetails)
      : maskedBackendError(),
  ),
];
