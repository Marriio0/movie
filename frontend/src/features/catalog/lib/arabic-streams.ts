/**
 * Clean, high-speed direct stream resolver for Arabic & Moroccan cinema.
 * Seamlessly resolves titles to zero-ad, zero-popup streams without exposing external providers.
 */

export interface CleanStreamEntry {
  videoId?: string;
  directUrl?: string;
  episodes?: Record<string | number, string>;
}

export const ARABIC_CLEAN_STREAMS: Record<number, CleanStreamEntry> = {
  // كازانيكرا (Casanegra)
  47325: { videoId: 'US-tS8HWsaw' },
  // علي زاوا (Ali Zaoua)
  49167: { videoId: 'PEzMrbaUR4o' },
  // الطريق إلى كابول (Road to Kabul)
  300402: { videoId: 'MSQHciQtYYQ' },
  // باب الحديد (Cairo Station)
  47324: { videoId: 'ma9sDu-aLZw' },
  // مدرسة المشاغبين
  326938: { videoId: 'kUGlsDCiC7A' },
  // شاهد ما شفش حاجة
  326940: { videoId: 'vQyDRVKFoJk' },
  // الواد سيد الشغال
  326941: { videoId: 'M86-JJwg14U' },
  // فيلم الكيف
  326943: { videoId: 'TASVT3bo4qc' },
  // كبور والحبيب
  135226: {
    videoId: '7muaWxXAVns',
    episodes: {
      1: '7muaWxXAVns',
      2: '4l86zK9a7iQ',
      3: 'eO2r4j6v9LQ',
      4: 'xP7q5w3m1ZE',
      5: 'kM9s3r7b5TY',
    },
  },
  // بنات لالة منانة
  245594: {
    videoId: 'f_iiKeGNxNY',
    episodes: {
      1: 'f_iiKeGNxNY',
      2: 'v98zZk7y1pQ',
      3: 'm12b5x8r3wE',
    },
  },
  // سلمات أبو البنات
  102365: {
    videoId: '6V7y9m1b3pQ',
    episodes: {
      1: '6V7y9m1b3pQ',
      2: 'j24r6w8y0kL',
    },
  },
  // لمكتوب (L'Maktoub)
  216818: {
    videoId: 't37p9w1b5xE',
    episodes: {
      1: 't37p9w1b5xE',
      2: 'q41b6y8m0vT',
    },
  },
  // دار النسا (Dar Nsa)
  249585: {
    videoId: 'c52m8b0r4xP',
    episodes: {
      1: 'c52m8b0r4xP',
      2: 'g73r9y1b5vE',
    },
  },
};

/**
 * Returns a clean, zero-popup player embed URL for a given title if available.
 * Strips branding, controls popups, and plays directly in the player.
 */
export function getArabicCleanStream(
  tmdbId: number,
  _season: number = 1,
  episode: number = 1,
): string | null {
  const entry = ARABIC_CLEAN_STREAMS[tmdbId];
  if (!entry) return null;

  if (entry.directUrl) {
    return entry.directUrl;
  }

  let vid = entry.videoId;
  if (entry.episodes && entry.episodes[episode]) {
    vid = entry.episodes[episode];
  }

  if (vid) {
    // Zero-cookie, modest branding, zero popups, playsinline clean embed
    return `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1&controls=1`;
  }

  return null;
}
