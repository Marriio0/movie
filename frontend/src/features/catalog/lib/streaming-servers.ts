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
    id: 'videasy',
    name: 'Server 1 (Videasy Fast HD)',
    badge: '★ Recommended',
    description: 'Ultra fast streaming with built-in subtitles and zero ads.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://player.videasy.net/movie/${tmdbId}?color=6366f1&sub_lang=${subLang}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=6366f1&sub_lang=${subLang}`,
  },
  {
    id: 'vidsrc',
    name: 'Server 2 (VidSrc)',
    badge: 'Fast Mirror',
    description: 'High definition fast stream mirror with subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&ds_lang=${subLang}`
        : `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&ds_lang=${subLang}`,
  },
  {
    id: 'vidsrcto',
    name: 'Server 3 (VidSrc TO)',
    badge: '1080p Mirror',
    description: 'High quality 1080p mirror for movies and series.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=${subLang}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=${subLang}`,
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
    id: 'vidlink',
    name: 'Server 5 (VidLink)',
    badge: 'Arabic / Multi-Subs',
    description: 'Fast CDN with instant Arabic & multilingual subtitles.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar', subFile }) => {
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
];
