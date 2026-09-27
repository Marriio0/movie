export interface SubtitleLanguage {
  code: string;
  openSubCode: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_SUBTITLE_LANGUAGES: SubtitleLanguage[] = [
  {
    code: 'ar',
    openSubCode: 'ara',
    name: 'Arabic (العربية)',
    nativeName: 'العربية',
    flag: '🇲🇦',
  },
  {
    code: 'fr',
    openSubCode: 'fre',
    name: 'French (Français)',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'en',
    openSubCode: 'eng',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'es',
    openSubCode: 'spa',
    name: 'Spanish (Español)',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'de',
    openSubCode: 'ger',
    name: 'German (Deutsch)',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    code: 'it',
    openSubCode: 'ita',
    name: 'Italian (Italiano)',
    nativeName: 'Italiano',
    flag: '🇮🇹',
  },
  {
    code: 'pt',
    openSubCode: 'por',
    name: 'Portuguese (Português)',
    nativeName: 'Português',
    flag: '🇵🇹',
  },
  {
    code: 'tr',
    openSubCode: 'tur',
    name: 'Turkish (Türkçe)',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
  },
  {
    code: 'ru',
    openSubCode: 'rus',
    name: 'Russian (Русский)',
    nativeName: 'Русский',
    flag: '🇷🇺',
  },
  {
    code: 'nl',
    openSubCode: 'dut',
    name: 'Dutch (Nederlands)',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
  },
];

export interface SubtitleQueryOptions {
  title: string;
  mediaType: 'movie' | 'tv';
  imdbId?: string | null;
  season?: number;
  episode?: number;
  langCode: string;
}

/**
 * Builds OpenSubtitles direct search URL
 */
export function getOpenSubtitlesUrl({
  title,
  mediaType,
  imdbId,
  season,
  episode,
  langCode,
}: SubtitleQueryOptions): string {
  const langObj =
    SUPPORTED_SUBTITLE_LANGUAGES.find((l) => l.code === langCode) ||
    SUPPORTED_SUBTITLE_LANGUAGES[0]!;
  const subLang = langObj.openSubCode;

  // If we have an IMDb ID (e.g. tt15239678), OpenSubtitles can search directly by IMDb ID
  if (imdbId && imdbId.startsWith('tt')) {
    const numericImdb = imdbId.replace('tt', '');
    if (mediaType === 'movie') {
      return `https://www.opensubtitles.org/en/search/sublanguageid-${subLang}/idmovie-${numericImdb}`;
    }
    if (season !== undefined && episode !== undefined) {
      return `https://www.opensubtitles.org/en/search/sublanguageid-${subLang}/searchonlytvseries-on/season-${season}/episode-${episode}/moviename-${encodeURIComponent(imdbId)}`;
    }
  }

  // Fallback by title
  const cleanTitle = encodeURIComponent(title.trim());
  if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
    return `https://www.opensubtitles.org/en/search/sublanguageid-${subLang}/searchonlytvseries-on/season-${season}/episode-${episode}/moviename-${cleanTitle}`;
  }

  return `https://www.opensubtitles.org/en/search/sublanguageid-${subLang}/moviename-${cleanTitle}`;
}

/**
 * Builds SubDL search URL
 */
export function getSubDLUrl({ title, season, episode, mediaType }: SubtitleQueryOptions): string {
  let query = title.trim();
  if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
    query += ` S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  }
  return `https://subdl.com/search/${encodeURIComponent(query)}`;
}

/**
 * Builds YTS / YIFY Subtitles URL for movies
 */
export function getYifySubtitlesUrl({ imdbId, title }: SubtitleQueryOptions): string {
  if (imdbId && imdbId.startsWith('tt')) {
    return `https://yifysubtitles.ch/movie-imdb/${imdbId}`;
  }
  return `https://yifysubtitles.ch/search?q=${encodeURIComponent(title)}`;
}
