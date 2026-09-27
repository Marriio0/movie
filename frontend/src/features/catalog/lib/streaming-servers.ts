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
    name: 'Server 1 (VidLink)',
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
  {
    id: 'vidsrc',
    name: 'Server 2 (VidSrc)',
    badge: 'Ultra Fast HD',
    description: 'High definition fast stream mirror with subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.pm/embed/movie/${tmdbId}?ds_lang=${subLang}`
        : `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}?ds_lang=${subLang}`,
  },
  {
    id: 'vidsrcto',
    name: 'Server 3 (VidSrc TO)',
    badge: '1080p Mirror',
    description: 'High quality 1080p mirror for movies and series.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'twoembed',
    name: 'Server 4 (2Embed)',
    badge: 'Fast Mirror',
    description: 'Fast responsive mirror with multi-source video feeds.',
    supportsSubtitles: false,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://www.2embed.skin/embed/${tmdbId}`
        : `https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
  {
    id: 'multiembed',
    name: 'Server 5 (SuperEmbed)',
    badge: 'Multi-Source',
    description: 'Multi-server backup player for high-demand titles.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
];
