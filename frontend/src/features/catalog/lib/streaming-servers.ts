import type { MediaType } from '@/shared/types/media';
import { getArabicCleanStream } from './arabic-streams';

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
    description: 'Fast direct CDN with instant playback, Arabic & multilingual subtitles, and zero ads.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'en' }) => {
      const cleanUrl = getArabicCleanStream(tmdbId, season, episode);
      if (cleanUrl) {
        return cleanUrl;
      }
      return mediaType === 'movie'
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=6366f1&secondaryColor=a855f7&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}`;
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
    id: 'superembed',
    name: 'Server 3 (SuperEmbed VIP)',
    badge: 'Multi-Source & Subs',
    description: 'High reliability multi-source player with VIP streams and built-in subtitles.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
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
        : `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`,
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
