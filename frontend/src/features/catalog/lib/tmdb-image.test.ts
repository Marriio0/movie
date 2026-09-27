import { tmdbDefaultSrc, tmdbSrcSet } from './tmdb-image';

describe('tmdb image helpers', () => {
  it('builds a width-described srcset from TMDB sizes', () => {
    expect(tmdbSrcSet('/abc.jpg', 'backdrop')).toBe(
      'https://image.tmdb.org/t/p/w300/abc.jpg 300w, https://image.tmdb.org/t/p/w780/abc.jpg 780w, https://image.tmdb.org/t/p/w1280/abc.jpg 1280w',
    );
  });

  it('uses a mid-size default source', () => {
    expect(tmdbDefaultSrc('/abc.jpg', 'poster')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg');
    expect(tmdbDefaultSrc('/abc.jpg', 'profile')).toBe('https://image.tmdb.org/t/p/w185/abc.jpg');
  });
});
