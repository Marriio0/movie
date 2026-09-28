import { youtubeBackgroundTrailerUrl, youtubeEmbedUrl } from './youtube';

describe('youtubeEmbedUrl', () => {
  it('builds a privacy-enhanced embed with captions on in French', () => {
    const url = new URL(youtubeEmbedUrl('oGimpDBwkFc'));
    expect(url.origin + url.pathname).toBe('https://www.youtube-nocookie.com/embed/oGimpDBwkFc');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      autoplay: '1',
      cc_load_policy: '1',
      cc_lang_pref: 'fr',
      rel: '0',
    });
  });

  it('encodes the video key', () => {
    expect(youtubeEmbedUrl('a/b?c')).toContain('/embed/a%2Fb%3Fc?');
  });
});

describe('youtubeBackgroundTrailerUrl', () => {
  it('builds a background trailer URL with autoplay, mute and controls disabled', () => {
    const url = new URL(youtubeBackgroundTrailerUrl('dQw4w9WgXcQ', true));
    expect(url.origin + url.pathname).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      autoplay: '1',
      mute: '1',
      controls: '0',
      loop: '1',
      playlist: 'dQw4w9WgXcQ',
      rel: '0',
    });
  });

  it('allows unmuting audio', () => {
    const url = new URL(youtubeBackgroundTrailerUrl('dQw4w9WgXcQ', false));
    expect(url.searchParams.get('mute')).toBe('0');
  });
});

