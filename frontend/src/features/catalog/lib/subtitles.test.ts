import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_SUBTITLE_LANGUAGES,
  getOpenSubtitlesUrl,
  getSubDLUrl,
  getYifySubtitlesUrl,
} from './subtitles';

describe('subtitles helper', () => {
  it('has 10 supported subtitle languages with Arabic, English, and French included', () => {
    expect(SUPPORTED_SUBTITLE_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    const codes = SUPPORTED_SUBTITLE_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('ar');
    expect(codes).toContain('en');
    expect(codes).toContain('fr');
    expect(codes).toContain('es');
  });

  it('builds OpenSubtitles URL with IMDb ID for movies and series', () => {
    const movieUrl = getOpenSubtitlesUrl({
      title: 'Inception',
      mediaType: 'movie',
      imdbId: 'tt1375666',
      langCode: 'ar',
    });
    expect(movieUrl).toContain('opensubtitles.org');
    expect(movieUrl).toContain('sublanguageid-ara');
    expect(movieUrl).toContain('idmovie-1375666');

    const tvUrl = getOpenSubtitlesUrl({
      title: 'Breaking Bad',
      mediaType: 'tv',
      imdbId: 'tt0903747',
      season: 2,
      episode: 5,
      langCode: 'fr',
    });
    expect(tvUrl).toContain('sublanguageid-fre');
    expect(tvUrl).toContain('season-2');
    expect(tvUrl).toContain('episode-5');
  });

  it('builds SubDL and YIFY URLs correctly', () => {
    const subDlUrl = getSubDLUrl({
      title: 'Interstellar',
      mediaType: 'movie',
      langCode: 'en',
    });
    expect(subDlUrl).toContain('subdl.com/search/Interstellar');

    const yifyUrl = getYifySubtitlesUrl({
      title: 'Gladiator',
      mediaType: 'movie',
      imdbId: 'tt0172495',
      langCode: 'ar',
    });
    expect(yifyUrl).toContain('yifysubtitles.ch/movie-imdb/tt0172495');
  });
});
