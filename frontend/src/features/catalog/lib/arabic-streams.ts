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
  // القسم 8 (Classe 8)
  389148: { videoId: 'Hsv3OQg9IzE' },
  // البحث عن زوج امرأتي
  504543: { videoId: 'Z1StIGZqsnY' },
  // يا خيل الله (Horses of God)
  134908: { videoId: 'q4O8rzw8xhU' },
  // الزين اللي فيك (Much Loved)
  336805: { videoId: 'zJLqSnPFJ4k' },
  // أزرق القفطان (The Blue Caftan)
  958279: { videoId: 'RY_0itqz_Vk' },
  // ماروك (Marock)
  61686: { videoId: '5oTl8Ae3V4g' },
  // زيرو (Zero)
  120288: { videoId: 'LZXpv2ZD5Tc' },
  // باب الحديد (Cairo Station)
  47324: { videoId: 'ma9sDu-aLZw' },
  // فيلم الكيف
  326943: { videoId: 'TASVT3bo4qc' },
  // مدرسة المشاغبين
  326938: { videoId: 'kUGlsDCiC7A' },
  // شاهد ما شفش حاجة
  326940: { videoId: 'vQyDRVKFoJk' },
  // الواد سيد الشغال
  326941: { videoId: 'M86-JJwg14U' },
  // سلام يا صاحبي
  23158: { videoId: 'b3sT4HNH2aY' },
  // الرسالة (The Message)
  26842: { videoId: 'uV_p05wEw38' },
  // كبور والحبيب
  135226: {
    videoId: '7muaWxXAVns',
    episodes: {
      1: '7muaWxXAVns',
      2: 'NrQ2xP_6PtU',
      3: 'NfXfS71NU40',
    },
  },
  // بنات لالة منانة
  245594: {
    videoId: 'f_iiKeGNxNY',
    episodes: {
      1: 'f_iiKeGNxNY',
      2: 'OoC2NIRBPhw',
    },
  },
  // سلمات أبو البنات
  102365: {
    videoId: 'jiEXsjh-6qE',
    episodes: {
      1: 'jiEXsjh-6qE',
    },
  },
  // لمكتوب (L'Maktoub)
  216818: {
    videoId: 'dajwLD7vM1M',
    episodes: {
      1: 'dajwLD7vM1M',
    },
  },
  // دار النسا (Dar Nsa)
  249585: {
    videoId: 'cIYKlbeivlU',
    episodes: {
      1: 'cIYKlbeivlU',
    },
  },
  // جعفر العمدة
  223366: {
    videoId: 'yBZTfBuKvAM',
    episodes: {
      1: 'yBZTfBuKvAM',
    },
  },
  // البرنس
  102237: {
    videoId: 'dEY6AxD44YM',
    episodes: {
      1: 'dEY6AxD44YM',
    },
  },
  // الأسطورة
  67073: {
    videoId: 'KjTw5pkUpr8',
    episodes: {
      1: 'KjTw5pkUpr8',
    },
  },
};

const TITLE_PATTERNS: Array<{
  pattern: RegExp;
  videoId: string;
  episodes?: Record<string | number, string>;
}> = [
  { pattern: /كازانيكرا|casanegra/i, videoId: 'US-tS8HWsaw' },
  { pattern: /علي زاوا|ali zaoua/i, videoId: 'PEzMrbaUR4o' },
  { pattern: /كابول|kabul/i, videoId: 'MSQHciQtYYQ' },
  { pattern: /القسم 8|classe 8/i, videoId: 'Hsv3OQg9IzE' },
  { pattern: /زوج امرأتي|zawj/i, videoId: 'Z1StIGZqsnY' },
  { pattern: /خيل الله|chevaux de dieu/i, videoId: 'q4O8rzw8xhU' },
  { pattern: /الزين اللي فيك|much loved/i, videoId: 'zJLqSnPFJ4k' },
  { pattern: /أزرق القفطان|blue caftan/i, videoId: 'RY_0itqz_Vk' },
  { pattern: /ماروك|marock/i, videoId: '5oTl8Ae3V4g' },
  { pattern: /زيرو|zero/i, videoId: 'LZXpv2ZD5Tc' },
  { pattern: /باب الحديد|cairo station/i, videoId: 'ma9sDu-aLZw' },
  { pattern: /الكيف|el keif/i, videoId: 'TASVT3bo4qc' },
  { pattern: /المشاغبين|moshaghebeen/i, videoId: 'kUGlsDCiC7A' },
  { pattern: /شاهد ما شفش|mabshafsh/i, videoId: 'vQyDRVKFoJk' },
  { pattern: /سيد الشغال|sayed el shaghal/i, videoId: 'M86-JJwg14U' },
  { pattern: /سلام يا صاحبي|salam ya sahbi/i, videoId: 'b3sT4HNH2aY' },
  { pattern: /الرسالة|the message/i, videoId: 'uV_p05wEw38' },
  {
    pattern: /كبور|kbour/i,
    videoId: '7muaWxXAVns',
    episodes: { 1: '7muaWxXAVns', 2: 'NrQ2xP_6PtU', 3: 'NfXfS71NU40' },
  },
  {
    pattern: /منانة|mennana/i,
    videoId: 'f_iiKeGNxNY',
    episodes: { 1: 'f_iiKeGNxNY', 2: 'OoC2NIRBPhw' },
  },
  { pattern: /سلمات|salamat/i, videoId: 'jiEXsjh-6qE' },
  { pattern: /المكتوب|لمكتوب|maktoub/i, videoId: 'dajwLD7vM1M' },
  { pattern: /دار النسا|dar nsa|dar nessa/i, videoId: 'cIYKlbeivlU' },
  { pattern: /جعفر العمدة|gaafar/i, videoId: 'yBZTfBuKvAM' },
  { pattern: /البرنس|el prince/i, videoId: 'dEY6AxD44YM' },
  { pattern: /الأسطورة|الاسطورة|el ostora/i, videoId: 'KjTw5pkUpr8' },
];

export function buildEmbedUrl(videoIdOrUrl: string): string {
  if (videoIdOrUrl.startsWith('http://') || videoIdOrUrl.startsWith('https://')) {
    return videoIdOrUrl;
  }
  return `https://www.youtube-nocookie.com/embed/${videoIdOrUrl}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&fs=1&controls=1`;
}

/**
 * Checks if a title belongs to the Arabic or Moroccan cinema catalog.
 */
export function isArabicTitle(media: {
  originalLanguage?: string;
  title?: string;
  originalTitle?: string;
  id?: number;
}): boolean {
  if (media.originalLanguage === 'ar') return true;
  const arabicRegex = /[\u0600-\u06FF]/;
  if (media.title && arabicRegex.test(media.title)) return true;
  if (media.originalTitle && arabicRegex.test(media.originalTitle)) return true;
  if (media.id && ARABIC_CLEAN_STREAMS[media.id]) return true;
  return false;
}

/**
 * Returns a clean, zero-popup player embed URL for a given title if available.
 * Strips branding, controls popups, and plays directly in the player.
 */
export function getArabicCleanStream(
  tmdbId: number,
  _season: number = 1,
  episode: number = 1,
  title?: string,
): string | null {
  // 1. Check by TMDB ID
  const entry = ARABIC_CLEAN_STREAMS[tmdbId];
  if (entry) {
    if (entry.directUrl) return entry.directUrl;
    let vid = entry.videoId;
    if (entry.episodes && entry.episodes[episode]) {
      vid = entry.episodes[episode];
    }
    if (vid) return buildEmbedUrl(vid);
  }

  // 2. Check by title matching (strictly when Arabic text is present to avoid false positives)
  if (title) {
    const hasArabicLetters = /[\u0600-\u06FF]/.test(title);
    const matched = TITLE_PATTERNS.find((tp) => {
      if (!hasArabicLetters && !/casanegra|ali zaoua|much loved|blue caftan|marock/i.test(title)) {
        return false;
      }
      return tp.pattern.test(title);
    });
    if (matched) {
      let vid = matched.videoId;
      if (matched.episodes && matched.episodes[episode]) {
        vid = matched.episodes[episode];
      }
      if (vid) return buildEmbedUrl(vid);
    }
  }

  return null;
}

/**
 * Dynamically queries our backend resolver for an Arabic title's clean stream.
 */
export async function fetchDynamicArabicStream({
  title,
  season = 1,
  episode = 1,
  mediaType = 'movie',
  signal,
}: {
  title: string;
  season?: number;
  episode?: number;
  mediaType?: 'movie' | 'tv';
  signal?: AbortSignal;
}): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      title,
      season: String(season),
      episode: String(episode),
      type: mediaType,
    });
    const res = await fetch(`/api/public/arabic/stream?${params.toString()}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { embedUrl?: string };
    return data.embedUrl || null;
  } catch {
    return null;
  }
}
