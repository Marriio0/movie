import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/render';

describe('TitleDetailPage', () => {
  it('shows movie details, facts and cast', async () => {
    renderRoute('/movies/693134');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Dune : Deuxième partie' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dune: Part Two')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('2h 45m')).toBeInTheDocument();
    expect(screen.getByText('“Longue vie à la Rébellion !”')).toHaveAttribute('lang', 'fr');
    expect(
      within(screen.getByRole('list', { name: 'Genres' })).getByText('Aventure'),
    ).toBeInTheDocument();
    expect(screen.getByText('Rated 8.1 out of 10')).toBeInTheDocument();
    expect(document.title).toBe('Dune : Deuxième partie · Marquee');

    expect(await screen.findByText('Denis Villeneuve')).toBeInTheDocument();
    const cast = screen.getByRole('region', { name: 'Cast' });
    expect(within(cast).getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows series facts from the details payload', async () => {
    renderRoute('/series/1399');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Game of Thrones' }),
    ).toBeInTheDocument();
    expect(screen.getByText('8 seasons')).toBeInTheDocument();
    expect(screen.getByText('Created by').nextElementSibling).toHaveTextContent(
      'David Benioff, D. B. Weiss',
    );
    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('keeps the page when only the cast fails', async () => {
    server.use(
      http.get('/api/public/movies/:id/credits', () => new HttpResponse(null, { status: 500 })),
    );
    renderRoute('/movies/693134');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Dune : Deuxième partie' }),
    ).toBeInTheDocument();
    const cast = screen.getByRole('region', { name: 'Cast' });
    expect(await within(cast).findByRole('alert')).toHaveTextContent(/Couldn’t load the cast/);
  });

  it('offers retry when the backend fails (unknown ids surface as a masked 401)', async () => {
    renderRoute('/movies/999999999');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'We couldn’t load this movie' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again|Reload/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse movies' })).toHaveAttribute('href', '/movies');
    // Public pages must not ask for sign-in because of the masked 401 (the navbar's button aside).
    expect(within(screen.getByRole('main')).queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it('shows the 404 view when the backend reports not found', async () => {
    server.use(http.get('/api/public/series/:id', () => new HttpResponse(null, { status: 404 })));
    renderRoute('/series/42');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Title not found' }),
    ).toBeInTheDocument();
  });
});

describe('TitleDetailPage: trailer and where to watch', () => {
  beforeEach(() => localStorage.clear());

  it('plays the French trailer in a dialog with captions on', async () => {
    const { user } = renderRoute('/movies/693134');

    await user.click(await screen.findByRole('button', { name: /Watch trailer/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Bande-annonce officielle 3 [VF]' });
    const player = within(dialog).getByTitle(/YouTube video player/);
    const src = player.getAttribute('src')!;
    expect(src).toContain('https://www.youtube-nocookie.com/embed/oGimpDBwkFc');
    expect(src).toContain('cc_load_policy=1');
    expect(src).toContain('cc_lang_pref=fr');

    await user.click(within(dialog).getByRole('button', { name: 'Close trailer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides the trailer button when TMDB has no trailer', async () => {
    server.use(
      http.get('/api/public/movies/:id/videos', () => HttpResponse.json({ id: 1, results: [] })),
    );
    renderRoute('/movies/693134');

    await screen.findByRole('heading', { level: 1, name: 'Dune : Deuxième partie' });
    const section = await screen.findByRole('region', { name: 'Where to watch' });
    await within(section).findByText('Rent');
    expect(screen.queryByRole('button', { name: /Watch trailer/ })).not.toBeInTheDocument();
  });

  it('falls back from Morocco to France, lets the viewer switch country and remembers it', async () => {
    const { user } = renderRoute('/movies/693134');

    const section = await screen.findByRole('region', { name: 'Where to watch' });
    expect(
      await within(section).findByText('No offers listed for Morocco. Showing France.'),
    ).toBeInTheDocument();
    expect(within(section).getByText('Rent')).toBeInTheDocument();
    expect(within(section).queryByText('Stream')).not.toBeInTheDocument();
    expect(within(section).getAllByRole('link', { name: 'Apple TV Store' })[0]).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/movie/693134-dune-part-two/watch?locale=FR',
    );
    expect(within(section).getByText('Availability data by JustWatch.')).toBeInTheDocument();

    await user.selectOptions(within(section).getByLabelText('Country'), 'GB');
    expect(within(section).getByText('Stream')).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'Netflix' })).toBeInTheDocument();
    expect(localStorage.getItem('marquee:watch-region')).toBe('GB');
  });

  it('says so when no country has offers', async () => {
    server.use(
      http.get('/api/public/movies/:id/watch-providers', () =>
        HttpResponse.json({ id: 1, results: {} }),
      ),
    );
    renderRoute('/movies/693134');
    const section = await screen.findByRole('region', { name: 'Where to watch' });
    expect(
      await within(section).findByText(/No streaming, rental or purchase offers/),
    ).toBeInTheDocument();
    expect(within(section).queryByLabelText('Country')).not.toBeInTheDocument();
  });

  it('keeps the page when where-to-watch fails', async () => {
    server.use(
      http.get(
        '/api/public/movies/:id/watch-providers',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    renderRoute('/movies/693134');
    const section = await screen.findByRole('region', { name: 'Where to watch' });
    expect(await within(section).findByRole('alert')).toHaveTextContent(
      /Couldn’t load where to watch/,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dune : Deuxième partie' }),
    ).toBeInTheDocument();
  });
});
