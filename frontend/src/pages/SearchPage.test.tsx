import { act, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { fixtures } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { renderRoute } from '@/test/render';

const searchBox = () => screen.getByRole('searchbox', { name: 'Search movies and series' });

describe('SearchPage', () => {
  it('writes the query to the URL after typing pauses and shows movies and series only', async () => {
    const { user, router } = renderRoute('/search');
    await screen.findByRole('heading', { level: 1, name: 'Search' });

    await user.type(searchBox(), 'dune');

    const results = await screen.findByRole('heading', { name: 'Top matches for “dune”' });
    expect(router.state.location.search).toBe('?q=dune');
    const items = within(results.parentElement!).getAllByRole('listitem');
    expect(items).toHaveLength(3); // the person in the payload is excluded
    expect(within(items[2]!).getByText('Series')).toBeInTheDocument();
    expect(await screen.findByText('3 matches for dune.')).toBeInTheDocument();
    expect(document.title).toBe('Search: dune · Netfarjo');
  });

  it('does not search for fewer than two characters', async () => {
    const seen: string[] = [];
    server.use(
      http.get('/api/public/search', ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('query') ?? '');
        return HttpResponse.json(fixtures.searchEmpty);
      }),
    );
    const { user } = renderRoute('/search');
    await screen.findByRole('heading', { level: 1, name: 'Search' });

    await user.type(searchBox(), 'd');
    expect(await screen.findByText(/searches start at 2 characters/)).toBeInTheDocument();
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    expect(seen).toEqual([]);
  });

  it('shows an empty state when nothing matches', async () => {
    renderRoute('/search?q=zzqqxx');
    expect(
      await screen.findByRole('heading', { name: 'No matches for “zzqqxx”' }),
    ).toBeInTheDocument();
    expect(searchBox()).toHaveValue('zzqqxx');
  });

  it('follows URL changes such as back and forward', async () => {
    const { router } = renderRoute('/search?q=dune');
    await screen.findByRole('heading', { name: 'Top matches for “dune”' });

    await act(() => router.navigate('/search?q=zzqqxx'));
    expect(searchBox()).toHaveValue('zzqqxx');
    await act(() => router.navigate(-1));
    expect(searchBox()).toHaveValue('dune');
    expect(
      await screen.findByRole('heading', { name: 'Top matches for “dune”' }),
    ).toBeInTheDocument();
  });

  it('clears the query', async () => {
    const { user, router } = renderRoute('/search?q=dune');
    await screen.findByRole('heading', { name: 'Top matches for “dune”' });

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(searchBox()).toHaveValue('');
    expect(
      await screen.findByRole('heading', { name: 'Find a movie or series' }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
  });

  it('offers retry when search fails', async () => {
    server.use(http.get('/api/public/search', () => new HttpResponse(null, { status: 500 })));
    renderRoute('/search?q=dune');
    expect(await screen.findByRole('heading', { name: 'Search failed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });
});
