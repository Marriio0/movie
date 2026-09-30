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

export const ARABIC_STREAM_SERVER: StreamingServer = {
  id: 'arabic',
  name: '🇲🇦 🇪🇬 Arabic & Moroccan Cinema',
  badge: '★ Clean HD',
  description: 'سيرفر مخصص للأفلام والمسلسلات المغربية والعربية بدون إعلانات وبجودة أصلية',
  supportsSubtitles: false,
  getUrl: ({ tmdbId, season, episode, title }) => {
    const clean = getArabicCleanStream(tmdbId, season, episode, title);
    if (clean) return clean;
    return `https://vidlink.pro/movie/${tmdbId}?primaryColor=eab308&secondaryColor=ca8a04&iconColor=ffffff&title=true&poster=true&sub_lang=ar`;
  },
};

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidlink',
    name: 'Server 1 (VidLink Fast HD)',
    badge: '★ Recommended',
    description: 'Fast CDN with instant Arabic & multilingual subtitles, 4K/1080p and zero ads.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=eab308&secondaryColor=ca8a04&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}`
        : `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=eab308&secondaryColor=ca8a04&iconColor=ffffff&title=true&poster=true&sub_lang=${subLang}`,
  },
  {
    id: 'autoembed',
    name: 'Server 2 (AutoEmbed VIP)',
    badge: 'Fast Multi-Source',
    description: 'Fast responsive mirror with multi-source video feeds.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://autoembed.co/movie/tmdb/${tmdbId}`
        : `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`,
  },
  {
    id: 'vidsrcsu',
    name: 'Server 3 (VidSrc Fast HD)',
    badge: '1080p Mirror',
    description: 'Ultra fast 1080p stream mirror with high speed and direct CDN.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://vidsrc.su/embed/movie/${tmdbId}`
        : `https://vidsrc.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrcto',
    name: 'Server 4 (VidSrc TO)',
    badge: 'Subtitles Mirror',
    description: 'High quality 1080p mirror with subtitle tracks.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode, subLang = 'ar' }) =>
      mediaType === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}?sub_lang=${subLang}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}?sub_lang=${subLang}`,
  },
  {
    id: 'twoembed',
    name: 'Server 5 (2Embed VIP)',
    badge: '1080p VIP',
    description: 'High reliability multi-source player with VIP streams.',
    supportsSubtitles: true,
    getUrl: ({ mediaType, tmdbId, season, episode }) =>
      mediaType === 'movie'
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
];
