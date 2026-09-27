import { youtubeEmbedUrl } from './youtube';

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
