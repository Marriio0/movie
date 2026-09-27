import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { fixtures } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/render';

describe('BrowsePage', () => {
  it('lists popular movies linking to their detail pages', async () => {
    renderRoute('/movies');
    expect(await screen.findByRole('heading', { level: 1, name: 'Movies' })).toBeInTheDocument();
    const links = await screen.findAllByRole('link', { name: /Spider-Man : Brand New Day/ });
    expect(links[0]).toHaveAttribute('href', '/movies/969681');
    expect(document.title).toBe('Movies · Netfarjo');
  });

  it('lists popular series', async () => {
    renderRoute('/series');
    const first = fixtures.popularSeries.results[0]!;
    const link = await screen.findByRole('link', { name: new RegExp(first.name) });
    expect(link).toHaveAttribute('href', `/series/${first.id}`);
  });

  it('shows an empty state', async () => {
    server.use(
      http.get('/api/public/movies/popular', () =>
        HttpResponse.json({ ...fixtures.popularMovies, results: [] }),
      ),
    );
    renderRoute('/movies');
    expect(
      await screen.findByRole('heading', { name: 'No movies to show right now' }),
    ).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    server.use(http.get('/api/public/movies/popular', () => HttpResponse.error()));
    renderRoute('/movies');
    expect(
      await screen.findByRole('heading', { name: 'Couldn’t load popular movies' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });
});
