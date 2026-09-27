import { focusManager, onlineManager } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { fixtures } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createTestQueryClient, renderRoute } from '@/test/render';

const rail = (name: string) => screen.getByRole('region', { name });

describe('HomePage', () => {
  it('features the first popular movie and shows both rails', async () => {
    renderRoute('/');

    const hero = await screen.findByRole('heading', {
      level: 2,
      name: 'Spider-Man : Brand New Day',
    });
    expect(hero).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View details/ })).toHaveAttribute(
      'href',
      '/movies/969681',
    );

    const movies = rail('Popular movies');
    expect(within(movies).getAllByRole('listitem')).toHaveLength(4);
    expect(within(movies).getByRole('link', { name: 'See all' })).toHaveAttribute(
      'href',
      '/movies',
    );

    const series = await screen.findByRole('region', { name: 'Popular series' });
    expect(within(series).getAllByRole('listitem')).toHaveLength(3);
  });

  it('isolates a failing rail and recovers on retry', async () => {
    server.use(
      http.get('/api/public/series/popular', () => new HttpResponse(null, { status: 503 }), {
        once: true,
      }),
    );
    const { user } = renderRoute('/');

    const series = await screen.findByRole('region', { name: 'Popular series' });
    expect(await within(series).findByRole('alert')).toHaveTextContent(
      /Couldn’t load popular series/,
    );
    // The other rail is unaffected.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Spider-Man : Brand New Day' }),
    ).toBeInTheDocument();

    await user.click(within(series).getByRole('button', { name: /Try again/ }));
    expect(await within(series).findAllByRole('listitem')).toHaveLength(3);
  });

  it('hides a rail that has no titles', async () => {
    server.use(
      http.get('/api/public/series/popular', () =>
        HttpResponse.json({ ...fixtures.popularSeries, results: [] }),
      ),
    );
    renderRoute('/');
    await screen.findByRole('region', { name: 'Popular movies' });
    await screen.findAllByRole('listitem');
    expect(screen.queryByRole('region', { name: 'Popular series' })).not.toBeInTheDocument();
  });

  it('shows offline notices instead of endless skeletons, then loads on reconnect', async () => {
    onlineManager.setOnline(false);
    renderRoute('/');

    expect(
      await screen.findAllByText(/You’re offline. This will load when you reconnect./),
    ).toHaveLength(2);

    act(() => onlineManager.setOnline(true));
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Spider-Man : Brand New Day' }),
    ).toBeInTheDocument();
  });

  // Regression: with the backend down, a retry that paused because the tab was hidden used to
  // show "You're offline" although the browser was online.
  it('does not claim to be offline when a retry pauses in a background tab', async () => {
    server.use(
      http.get('/api/public/movies/popular', () => new HttpResponse(null, { status: 502 })),
      http.get('/api/public/series/popular', () => new HttpResponse(null, { status: 502 })),
    );
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({
      queries: { ...queryClient.getDefaultOptions().queries, retry: 1, retryDelay: 0 },
    });
    focusManager.setFocused(false);

    try {
      renderRoute('/', queryClient);
      const movies = await screen.findByRole('region', { name: 'Popular movies' });
      await waitFor(() =>
        expect(queryClient.getQueryState(['catalog', 'popular', 'movie'])?.fetchStatus).toBe(
          'paused',
        ),
      );
      expect(screen.queryByText(/You’re offline/)).not.toBeInTheDocument();
      expect(within(movies).getByLabelText('Loading Popular movies')).toBeInTheDocument();

      act(() => focusManager.setFocused(true));
      expect(await within(movies).findByRole('alert')).toHaveTextContent(
        /Couldn’t load popular movies/,
      );
    } finally {
      focusManager.setFocused(undefined);
    }
  });
});
