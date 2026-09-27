import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/render';

const HOME_HEADING = 'Discover popular movies and series';

function renderAt(path: string) {
  return renderRoute(path).router;
}

describe('routing', () => {
  it('renders the home page inside the main layout', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: HOME_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/uses the TMDB API/);
    expect(document.title).toBe('Marquee');
  });

  it('marks the active primary nav link', async () => {
    renderAt('/movies');
    await screen.findByRole('heading', { level: 1, name: 'Movies' });
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'Movies' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('shows the 404 page for unknown URLs', async () => {
    renderAt('/does-not-exist');
    expect(
      await screen.findByRole('heading', { level: 1, name: /isn’t showing/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it.each(['/movies/abc', '/movies/0', '/series/-4'])('rejects invalid id %s', async (path) => {
    renderAt(path);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Title not found' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/movies/693134', 'Dune : Deuxième partie'],
    ['/series/1399', 'Game of Thrones'],
  ])('accepts a valid id at %s', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('renders auth screens in the auth layout, without browsing navigation', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Marquee home' })).toBeInTheDocument();
  });

  it('opens the mobile menu and closes it on navigation', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');
    await screen.findByRole('heading', { level: 1, name: HOME_HEADING });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });
    expect(within(dialog).getByRole('group', { name: 'Theme' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('link', { name: 'Series' }));
    // The location commits only after the lazy page chunk has loaded.
    expect(await screen.findByRole('heading', { level: 1, name: 'Series' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/series');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches theme from the mobile menu', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await screen.findByRole('heading', { level: 1, name: HOME_HEADING });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(await screen.findByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
