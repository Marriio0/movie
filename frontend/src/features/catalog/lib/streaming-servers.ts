import type { MediaType } from '@/shared/types/media';

export interface StreamingServer {
  id: string;
  name: string;
  badge: string;
  description: string;
  supportsSubtitles: boolean;
  getUrl: (params: {
    mediaType: MediaType;
    tmdbId: number;
    imdbId?: string | null;
    season: number;
    episode: number;
    subLang?: string;
    subFile?: string;
  }) => string;
}

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidlink',
    name: 'Server 1 (VidLink Fast HD)',
    badge: '★ Recommended',
    description: 'Fast CDN with instant Arabic & multilingual subtitles, 4K/1080p and zero ads.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'en', subFile }) => {
      const subLabel =
        subLang === 'ar'
          ? 'Arabic'
          : subLang === 'fr'
            ? 'French'
            : subLang === 'en'
              ? 'English'
              : subLang.toUpperCase();
      const subParam = subFile
        ? `&sub_file=${encodeURIComponent(subFile)}&sub_label=${encodeURIComponent(subLabel)}`
        : '';
      return mediaType === 'movie'
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}${subParam}`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}${subParam}`;
    },
  },
  {
    id: 'vidsrcsu',
    name: 'Server 2 (VidSrc SU)',
    badge: 'Fast HD',
    description: 'Ultra fast 1080p stream mirror with high speed and zero buffering.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://vidsrc.su/embed/movie/${tmdbId}`
        : `https://vidsrc.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrcpm',
    name: 'Server 3 (VidSrc PM)',
    badge: 'HTML5 Mirror',
    description: 'Modern Vidstack HTML5 player with multi-language subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'en' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}&ds_lang=${subLang}`
        : `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&ds_lang=${subLang}`,
  },
  {
    id: 'autoembed',
    name: 'Server 4 (AutoEmbed)',
    badge: 'Multi-Source',
    description: 'Fast responsive mirror with multi-source video feeds.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://autoembed.co/movie/tmdb/${tmdbId}`
        : `https://autoembed.co/tv/tmdb/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrcto',
    name: 'Server 5 (VidSrc TO)',
    badge: '1080p Mirror',
    description: 'High quality 1080p mirror for movies and series.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'en' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=${subLang}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=${subLang}`,
  },
];
