import type { MediaType } from '@/shared/types/media';

export interface TorrentioStream {
  name: string;
  title: string;
  infoHash: string;
  fileIdx?: number;
  url?: string;
  behaviorHints?: {
    bingeGroup?: string;
    filename?: string;
  };
}

export interface TorrentioApiResponse {
  streams?: TorrentioStream[];
}

export interface ParsedTorrentioStream {
  stream: TorrentioStream;
  name: string;
  quality: string;
  releaseTitle: string;
  seeders: number | null;
  size: string | null;
  provider: string | null;
  languages: string[];
  magnetLink: string;
  stremioLink: string;
  isDirectStream: boolean;
}

const DEFAULT_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://explodie.org:6969/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.leechers-paradise.org:6969/announce',
];

export function buildMagnetLink(infoHash: string, filename?: string): string {
  const tr = DEFAULT_TRACKERS.map((tracker) => `tr=${encodeURIComponent(tracker)}`).join('&');
  const dn = filename ? `&dn=${encodeURIComponent(filename)}` : '';
  return `magnet:?xt=urn:btih:${infoHash}${dn}&${tr}`;
}

export function parseTorrentioStream(
  stream: TorrentioStream,
  mediaType: MediaType,
  imdbId: string,
): ParsedTorrentioStream {
  const rawTitle = stream.title || '';
  const lines = rawTitle
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const releaseTitle = lines[0] || stream.behaviorHints?.filename || 'Torrent Stream';

  // Seeders: 👤 284
  const seedersMatch = rawTitle.match(/👤\s*(\d+)/);
  const seeders = seedersMatch ? parseInt(seedersMatch[1]!, 10) : null;

  // Size: 💾 8.91 GB
  const sizeMatch = rawTitle.match(/💾\s*([\d.]+\s*(?:GB|MB|TB|KB|GiB|MiB))/i);
  const size = sizeMatch ? sizeMatch[1]! : null;

  // Provider: ⚙️ 1337x
  const providerMatch = rawTitle.match(/⚙️\s*([^\n\r]+)/);
  const provider = providerMatch ? providerMatch[1]!.trim() : null;

  // Quality: e.g. "Torrentio\n4k HDR" -> "4k HDR"
  const quality = stream.name ? stream.name.replace(/^Torrentio\n?/i, '').trim() || 'HD' : 'HD';

  // Extract flag or language emojis if present
  const langLine = lines.find((l) => l.includes('/') || /[\uD83C][\uDDE6-\uDDFF]/.test(l));
  const languages = langLine
    ? langLine
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const magnetLink = buildMagnetLink(stream.infoHash, stream.behaviorHints?.filename);
  const stremioLink = `stremio:///detail/${mediaType}/${imdbId}`;
  const isDirectStream = Boolean(stream.url);

  return {
    stream,
    name: stream.name || 'Torrentio',
    quality,
    releaseTitle,
    seeders,
    size,
    provider,
    languages,
    magnetLink,
    stremioLink,
    isDirectStream,
  };
}

export async function fetchTorrentioStreams(options: {
  mediaType: MediaType;
  imdbId: string;
  season?: number;
  episode?: number;
  config?: string;
  signal?: AbortSignal;
}): Promise<ParsedTorrentioStream[]> {
  const { mediaType, imdbId, season, episode, config, signal } = options;

  if (!imdbId) return [];

  const cleanConfig = config ? `${config.replace(/^\/+|\/+$/g, '')}/` : '';
  const idPath =
    mediaType === 'movie' ? `movie/${imdbId}` : `series/${imdbId}:${season ?? 1}:${episode ?? 1}`;

  const url = `https://torrentio.strem.fun/${cleanConfig}stream/${idPath}.json`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as TorrentioApiResponse;
    if (!data.streams || !Array.isArray(data.streams)) return [];
    return data.streams.map((s) => parseTorrentioStream(s, mediaType, imdbId));
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    return [];
  }
}
