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

/**
 * Background ambient trailer URL (Netflix/Apple TV+ style):
 * - Auto-plays seamlessly
 * - Muted by default so browsers allow instant autoplay
 * - Controls hidden, branding minimized, looping enabled
 */
export function youtubeBackgroundTrailerUrl(videoKey: string, isMuted = true): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: isMuted ? '1' : '0',
    controls: '0',
    loop: '1',
    playlist: videoKey,
    playsinline: '1',
    rel: '0',
    showinfo: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?${params}`;
}

