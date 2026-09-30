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
    title?: string;
    imdbId?: string | null;
    season: number;
    episode: number;
    subLang?: string;
    subFile?: string;
  }) => string;
}

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidsrcsu',
    name: 'Server 1 (VidSrc Fast HD)',
    badge: '★ Recommended',
    description: 'Fast direct CDN with instant 1080p playback, multi-language subtitles, and zero ads.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar', title }) => {
      const cleanUrl = getArabicCleanStream(tmdbId, season, episode, title);
      if (cleanUrl) {
        return cleanUrl;
      }
      return mediaType === 'movie'
        ? `https://vidsrc.su/embed/movie/${tmdbId}?sub_lang=${subLang}`
        : `https://vidsrc.su/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=${subLang}`;
    },
  },
  {
    id: 'vidsrcme',
    name: 'Server 2 (VidSrc VIP)',
    badge: 'Multi-Subs VIP',
    description: 'Official VidSrc player with instant multi-language subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.me/embed/movie?tmdb=${tmdbId}&ds_lang=${subLang}`
        : `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&ds_lang=${subLang}`,
  },
  {
    id: 'vidsrcpm',
    name: 'Server 3 (VidSrc PM)',
    badge: 'HTML5 Mirror',
    description: 'Modern HTML5 player with multi-language subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.pm/embed/movie?tmdb=${tmdbId}&ds_lang=${subLang}`
        : `https://vidsrc.pm/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}&ds_lang=${subLang}`,
  },
  {
    id: 'twoembed',
    name: 'Server 4 (2Embed VIP)',
    badge: '1080p Mirror',
    description: 'High reliability multi-source player with VIP streams.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
  {
    id: 'vidsrcto',
    name: 'Server 5 (VidSrc TO)',
    badge: 'Clean 1080p',
    description: 'High quality 1080p mirror for movies and series with subtitles.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=${subLang}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=${subLang}`,
  },
];
