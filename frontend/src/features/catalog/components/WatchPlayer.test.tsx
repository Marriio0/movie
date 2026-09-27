import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { MediaDetails } from '../catalog.types';
import { WatchPlayer } from './WatchPlayer';
import { createTestQueryClient } from '@/test/render';

const mockMovie: MediaDetails = {
  id: 693134,
  mediaType: 'movie',
  title: 'Dune: Part Two',
  originalTitle: 'Dune: Part Two',
  overview: 'Paul Atreides unites with Chani and the Fremen...',
  posterPath: '/poster.jpg',
  backdropPath: '/backdrop.jpg',
  releaseDate: '2024-02-27',
  year: 2024,
  rating: 8.5,
  voteCount: 5000,
  tagline: 'Long live the fighters',
  genres: [{ id: 878, name: 'Sci-Fi' }],
  runtimeMinutes: 166,
  status: 'Released',
  originalLanguage: 'en',
  seasonCount: null,
  episodeCount: null,
  creators: [],
  imdbId: 'tt15239678',
};

const mockSeries: MediaDetails = {
  id: 1399,
  mediaType: 'tv',
  title: 'Game of Thrones',
  originalTitle: 'Game of Thrones',
  overview: 'Seven noble families fight for control of the mythical land of Westeros.',
  posterPath: '/got.jpg',
  backdropPath: '/got_backdrop.jpg',
  releaseDate: '2011-04-17',
  year: 2011,
  rating: 9.3,
  voteCount: 20000,
  tagline: 'Winter is Coming',
  genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }],
  runtimeMinutes: 60,
  status: 'Ended',
  originalLanguage: 'en',
  seasonCount: 8,
  episodeCount: 73,
  creators: ['David Benioff', 'D. B. Weiss'],
  imdbId: 'tt0944947',
  seasons: [
    { seasonNumber: 1, name: 'Season 1', episodeCount: 10 },
    { seasonNumber: 2, name: 'Season 2', episodeCount: 10 },
  ],
};

function renderWatchPlayer(details: MediaDetails) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <WatchPlayer details={details} />
    </QueryClientProvider>,
  );
}

describe('WatchPlayer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders streaming servers and default player for movie', () => {
    renderWatchPlayer(mockMovie);

    expect(screen.getByRole('heading', { name: /Watch Dune: Part Two/i })).toBeInTheDocument();
    expect(screen.getByText(/Subtitles \(CC\) Available/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Server 1 \(Videasy Fast HD\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Server 2 \(VidSrc\)/i })).toBeInTheDocument();

    const iframe = screen.getByTitle(/Watch Dune: Part Two/i);
    expect(iframe).toHaveAttribute('src', expect.stringContaining('player.videasy.net/movie/693134'));
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
  });

  it('switches between servers when clicked', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockMovie);

    const vidsrcBtn = screen.getByRole('button', { name: /Server 2 \(VidSrc\)/i });
    await user.click(vidsrcBtn);

    const iframe = screen.getByTitle(/Watch Dune: Part Two/i);
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('vidsrc.me/embed/movie?tmdb=693134'),
    );
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
  });

  it('renders series seasons and episodes and updates iframe src', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockSeries);

    expect(screen.getByRole('heading', { name: /Watch S1 : E1/i })).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /Next Ep/i });
    await user.click(nextBtn);

    expect(screen.getByRole('heading', { name: /Watch S1 : E2/i })).toBeInTheDocument();

    const iframe = screen.getByTitle(/Watch Game of Thrones/i);
    expect(iframe).toHaveAttribute('src', expect.stringContaining('player.videasy.net/tv/1399/1/2'));
  });



  it('configures default Arabic subtitles in player and displays CC indicator', () => {
    renderWatchPlayer(mockMovie);

    expect(screen.getByTitle(/Watch Dune: Part Two/i)).toHaveAttribute(
      'src',
      expect.stringContaining('sub_lang=ar'),
    );
    expect(screen.getByText(/Subtitles \(CC\) Available/i)).toBeInTheDocument();
  });

  it('opens Download Center and displays direct download links and Arabic subtitles', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockMovie);

    const downloadTabs = screen.getAllByRole('button', { name: /Download Movie/i });
    expect(downloadTabs[0]).toBeDefined();
    await user.click(downloadTabs[0]!);

    expect(screen.getByText(/تحميل: Dune: Part Two/i)).toBeInTheDocument();
    expect(
      screen.getByText(/الترجمة متوفرة تلقائياً في المشغل/i),
    ).toBeInTheDocument();
  });

  it('automatically starts with preferred subtitle language saved in localStorage from the start', () => {
    localStorage.setItem('marquee:preferred-subtitle-lang', 'es');
    renderWatchPlayer(mockMovie);

    expect(screen.getByTitle(/Watch Dune: Part Two/i)).toHaveAttribute(
      'src',
      expect.stringContaining('sub_lang=es'),
    );
  });

  it('allows user to change subtitle language dynamically and updates player url and localStorage', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockMovie);

    const downloadTabs = screen.getAllByRole('button', { name: /Download Movie/i });
    await user.click(downloadTabs[0]!);

    const frBtn = screen.getByRole('button', { name: /Français/i });
    await user.click(frBtn);

    const watchOnlineBtn = screen.getByRole('button', { name: /Watch Online/i });
    await user.click(watchOnlineBtn);

    expect(screen.getByTitle(/Watch Dune: Part Two/i)).toHaveAttribute(
      'src',
      expect.stringContaining('sub_lang=fr'),
    );
    expect(localStorage.getItem('marquee:preferred-subtitle-lang')).toBe('fr');
  });

  it('opens installation guide modal when install button is clicked in Download Center', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockMovie);

    const downloadTabs = screen.getAllByRole('button', { name: /Download Movie/i });
    await user.click(downloadTabs[0]!);

    const installBtn = screen.getByRole('button', { name: /تثبيت التطبيق الآن/i });
    await user.click(installBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText(/تثبيت تطبيق/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/هواتف آيفون وآيباد/i)).toBeInTheDocument();
    expect(screen.getByText(/أندرويد/i)).toBeInTheDocument();
  });
});
