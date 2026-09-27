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
  }) => string;
}

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidlink',
    name: 'Server 1 (VidLink)',
    badge: 'Multi-Subs / Fast',
    description: 'Fast CDN with multilingual subtitles (Arabic, French, English, Spanish...).',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true`,
  },
  {
    id: 'vidsrc',
    name: 'Server 2 (VidSrc)',
    badge: 'HD + Subtitles',
    description: 'High definition stream with integrated subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'embedsu',
    name: 'Server 3 (Embed.su)',
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
    name: 'Server 4 (AutoEmbed)',
    badge: 'Auto-Source',
    description: 'Auto-switching streaming server with built-in captions.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'multiembed',
    name: 'Server 5 (SuperEmbed)',
    badge: 'Backup Mirr.',
    description: 'Reliable fallback mirror with multiple player servers.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
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
];
