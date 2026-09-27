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
    expect(screen.getByRole('button', { name: /Server 1 \(VidLink\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Server 2 \(VidSrc\)/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Torrentio \(torrentio\.org\)/i }),
    ).toBeInTheDocument();

    const iframe = screen.getByTitle(/Watch Dune: Part Two/i);
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vidlink.pro/movie/693134'));
  });

  it('switches between servers when clicked', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockMovie);

    const vidsrcBtn = screen.getByRole('button', { name: /Server 2 \(VidSrc\)/i });
    await user.click(vidsrcBtn);

    const iframe = screen.getByTitle(/Watch Dune: Part Two/i);
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('vidsrc.cc/v2/embed/movie/693134'),
    );
  });

  it('renders series seasons and episodes and updates iframe src', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockSeries);

    expect(screen.getByRole('heading', { name: /Watch S1 : E1/i })).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /Next Ep/i });
    await user.click(nextBtn);

    expect(screen.getByRole('heading', { name: /Watch S1 : E2/i })).toBeInTheDocument();

    const iframe = screen.getByTitle(/Watch Game of Thrones/i);
    expect(iframe).toHaveAttribute('src', expect.stringContaining('vidlink.pro/tv/1399/1/2'));
  });

  it('displays Torrentio panel when Torrentio tab is clicked', async () => {
    const user = userEvent.setup();
    renderWatchPlayer(mockMovie);

    const torrentioBtn = screen.getByRole('button', { name: /Torrentio \(torrentio\.org\)/i });
    await user.click(torrentioBtn);

    expect(screen.getByText(/Torrentio Streams/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /torrentio\.org/i })).toBeInTheDocument();
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
      screen.getByText(/الترجمة متوفرة تلقائياً في مشغل الموقع/i),
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
});
