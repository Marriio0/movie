/**
 * Privacy-enhanced YouTube embed (no cookies until playback) that opens with captions on,
 * in French when the video has them.
 * Player parameters: https://developers.google.com/youtube/player_parameters
 */
export function youtubeEmbedUrl(videoKey: string, captionLanguage = 'fr'): string {
  const params = new URLSearchParams({
    autoplay: '1',
    cc_load_policy: '1', // show captions by default
    cc_lang_pref: captionLanguage,
    hl: captionLanguage,
    rel: '0', // related videos only from the same channel
    playsinline: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?${params}`;
}
