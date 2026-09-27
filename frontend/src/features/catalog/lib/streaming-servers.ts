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
      const subParam = subFile ? `&sub_file=${encodeURIComponent(subFile)}&sub_label=Arabic` : '';
      return mediaType === 'movie'
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}${subParam}`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}${subParam}`;
    },
  },
  {
    id: 'vidsrc',
    name: 'Server 2 (VidSrc)',
    badge: 'HD + Subtitles',
    description: 'High definition stream with integrated subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}?ds_lang=${subLang}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}?ds_lang=${subLang}`,
  },
  {
    id: 'multiembed',
    name: 'Server 3 (SuperEmbed)',
    badge: 'Multi-Source HD',
    description: 'Reliable multi-server player with integrated subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: 'embedsu',
    name: 'Server 4 (Embed.su)',
    badge: 'Multi-Res HD',
    description: 'Adaptive streaming with subtitle language selector.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'autoembed',
    name: 'Server 5 (AutoEmbed)',
    badge: 'Auto-Source',
    description: 'Auto-switching streaming server with built-in captions.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'twoembed',
    name: 'Server 6 (2Embed)',
    badge: 'Alternative',
    description: 'Classic reliable stream player for movies and series.',
    supportsSubtitles: false,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
  {
    id: 'vidsrcrip',
    name: 'Server 7 (VidSrc Rip)',
    badge: 'Fast Mirror',
    description: 'Direct high-speed stream mirror for high-demand titles.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://vidsrc.rip/embed/movie/${tmdbId}`
        : `https://vidsrc.rip/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'smashystream',
    name: 'Server 8 (Smashy)',
    badge: 'Multi-Audio',
    description: 'Multi-source stream provider with player selection.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://player.smashy.stream/movie/${tmdbId}`
        : `https://player.smashy.stream/tv/${tmdbId}?s=${season}&e=${episode}`,
  },
  {
    id: 'moviesapi',
    name: 'Server 9 (MoviesAPI)',
    badge: 'Ultra HD',
    description: 'Cloud stream server with high resolution support.',
    supportsSubtitles: false,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://moviesapi.club/movie/${tmdbId}`
        : `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`,
  },
];
