import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Film,
  Info,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Server,
  Settings,
  Sparkles,
  Subtitles,
  Tv,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { MediaDetails } from '../catalog.types';
import { STREAMING_SERVERS, type StreamingServer } from '../lib/streaming-servers';
import { fetchTorrentioStreams } from '../lib/torrentio';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { Spinner } from '@/shared/ui/Spinner';

export interface WatchPlayerProps {
  details: MediaDetails;
}

const TORRENTIO_CONFIG_STORAGE_KEY = 'marquee:torrentio-config';

export function WatchPlayer({ details }: WatchPlayerProps) {
  const isSeries = details.mediaType === 'tv';

  // Server selection: 'torrentio' or server id from STREAMING_SERVERS
  const [selectedServerId, setSelectedServerId] = useState<string>('vidlink');

  // Season and episode state for series
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);

  // Theater / Cinema mode
  const [isTheater, setIsTheater] = useState(false);

  // Reload key to force iframe remount
  const [reloadKey, setReloadKey] = useState(0);

  // Torrentio state
  const [torrentioConfig, setTorrentioConfig] = useState<string>(() => {
    try {
      return localStorage.getItem(TORRENTIO_CONFIG_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(torrentioConfig);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Active direct video stream URL from Debrid (if played through Torrentio)
  const [directVideoUrl, setDirectVideoUrl] = useState<string | null>(null);

  // Calculate available seasons and episodes
  const availableSeasons = useMemo(() => {
    if (!isSeries) return [1];
    if (details.seasons && details.seasons.length > 0) {
      return details.seasons.map((s) => s.seasonNumber).sort((a, b) => a - b);
    }
    const count = details.seasonCount && details.seasonCount > 0 ? details.seasonCount : 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [isSeries, details.seasons, details.seasonCount]);

  const episodesInCurrentSeason = useMemo(() => {
    if (!isSeries) return 1;
    const seasonObj = details.seasons?.find((s) => s.seasonNumber === currentSeason);
    if (seasonObj && seasonObj.episodeCount > 0) {
      return seasonObj.episodeCount;
    }
    return 24; // Sensible default episode range if TMDB didn't list per-season counts
  }, [isSeries, details.seasons, currentSeason]);

  const activeServer: StreamingServer | undefined = useMemo(() => {
    return STREAMING_SERVERS.find((s) => s.id === selectedServerId);
  }, [selectedServerId]);

  // Compute active embed player URL
  const currentEmbedUrl = useMemo(() => {
    if (!activeServer) return '';
    return activeServer.getUrl({
      mediaType: details.mediaType,
      tmdbId: details.id,
      imdbId: details.imdbId,
      season: currentSeason,
      episode: currentEpisode,
    });
  }, [activeServer, details.mediaType, details.id, details.imdbId, currentSeason, currentEpisode]);

  // Torrentio query via TanStack Query
  const torrentQuery = useQuery({
    queryKey: [
      'torrentio',
      details.mediaType,
      details.imdbId,
      currentSeason,
      currentEpisode,
      torrentioConfig,
    ],
    queryFn: ({ signal }) =>
      fetchTorrentioStreams({
        mediaType: details.mediaType,
        imdbId: details.imdbId!,
        season: currentSeason,
        episode: currentEpisode,
        config: torrentioConfig.trim() || undefined,
        signal,
      }),
    enabled: selectedServerId === 'torrentio' && Boolean(details.imdbId),
    staleTime: 5 * 60 * 1000,
  });

  const torrentStreams = torrentQuery.data ?? [];
  const isTorrentLoading = torrentQuery.isLoading;
  const torrentError = !details.imdbId
    ? 'No IMDb ID found for this title (required by Torrentio).'
    : torrentQuery.isError
      ? 'Failed to connect to Torrentio. Check your network or configuration.'
      : torrentQuery.isSuccess && torrentStreams.length === 0
        ? 'No torrent streams found on Torrentio for this title.'
        : null;

  const handleCopyMagnet = async (magnetLink: string, infoHash: string) => {
    try {
      await navigator.clipboard.writeText(magnetLink);
      setCopiedHash(infoHash);
      setTimeout(() => setCopiedHash(null), 2500);
    } catch {
      // Fallback
      window.prompt('Copy Magnet Link:', magnetLink);
    }
  };

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(TORRENTIO_CONFIG_STORAGE_KEY, tempConfig.trim());
    } catch {
      // Ignore
    }
    setTorrentioConfig(tempConfig.trim());
    setIsConfigOpen(false);
  };

  const openSubtitlesUrl = details.imdbId
    ? `https://www.opensubtitles.org/en/search/sublanguageid-all/idmovie-${details.imdbId}`
    : `https://www.opensubtitles.org/en/search/sublanguageid-all/moviename-${encodeURIComponent(details.title)}`;

  return (
    <section
      id="watch-player"
      aria-label={`Stream ${details.title}`}
      className={cn(
        'relative scroll-mt-24 transition-all duration-300',
        isTheater && 'fixed inset-0 z-50 overflow-y-auto bg-black/95 p-4 backdrop-blur-md sm:p-8',
      )}
    >
      <div className={cn(isTheater ? 'mx-auto max-w-7xl' : 'w-full space-y-6')}>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-accent/20 text-accent">
                <Play className="size-4 fill-current" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
                {isSeries
                  ? `Watch S${currentSeason} : E${currentEpisode}`
                  : `Watch ${details.title}`}
              </h2>
            </div>
            <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted sm:text-sm">
              <span>{isSeries ? 'TV Series' : 'Full Movie'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-emerald-400">
                <Subtitles className="size-3.5" />
                Subtitles (CC) Available
              </span>
              {details.imdbId && (
                <>
                  <span>•</span>
                  <span className="font-mono text-fg-subtle">{details.imdbId}</span>
                </>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <IconButton
              label="Reload Player"
              onClick={() => {
                setReloadKey((k) => k + 1);
                setDirectVideoUrl(null);
              }}
              className="text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <RefreshCw className="size-4" />
            </IconButton>

            <IconButton
              label={isTheater ? 'Exit Cinema Mode' : 'Cinema Mode'}
              onClick={() => setIsTheater(!isTheater)}
              className="text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              {isTheater ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </IconButton>
          </div>
        </div>

        {/* Server Switcher Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-fg-muted uppercase">
            <span className="flex items-center gap-1.5">
              <Server className="size-3.5 text-accent" />
              Select Server
            </span>
            <span className="text-fg-subtle">
              If a server is slow or offline, choose another below
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STREAMING_SERVERS.map((server) => {
              const isSelected = selectedServerId === server.id && !directVideoUrl;
              return (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => {
                    setSelectedServerId(server.id);
                    setDirectVideoUrl(null);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all sm:text-sm',
                    isSelected
                      ? 'bg-accent text-accent-fg shadow-sm shadow-accent/25'
                      : 'bg-surface-2 text-fg ring-1 ring-line hover:bg-surface-3',
                  )}
                >
                  <Server className="size-3.5" />
                  <span>{server.name}</span>
                  {server.badge && (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        isSelected ? 'bg-black/20 text-white' : 'bg-surface-3 text-fg-muted',
                      )}
                    >
                      {server.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Torrentio Server Tab */}
            <button
              type="button"
              onClick={() => {
                setSelectedServerId('torrentio');
                setDirectVideoUrl(null);
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all sm:text-sm',
                selectedServerId === 'torrentio'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-surface-2 text-fg ring-1 ring-line hover:bg-surface-3',
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Torrentio (torrentio.org)</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                Torrents & Debrid
              </span>
            </button>
          </div>
        </div>

        {/* Season & Episode Selector (Series only) */}
        {isSeries && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-1 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tv className="size-4 text-accent" />
                <span className="text-sm font-semibold text-fg">Seasons & Episodes</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentEpisode <= 1}
                  onClick={() => setCurrentEpisode((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="size-3.5" />
                  Previous Ep
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentEpisode >= episodesInCurrentSeason}
                  onClick={() =>
                    setCurrentEpisode((prev) => Math.min(episodesInCurrentSeason, prev + 1))
                  }
                >
                  Next Ep
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Season Selector Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-fg-muted">Season:</span>
              {availableSeasons.map((seasonNum) => (
                <button
                  key={seasonNum}
                  type="button"
                  onClick={() => {
                    setCurrentSeason(seasonNum);
                    setCurrentEpisode(1);
                  }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition',
                    currentSeason === seasonNum
                      ? 'bg-accent font-semibold text-accent-fg'
                      : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                  )}
                >
                  Season {seasonNum}
                </button>
              ))}
            </div>

            {/* Episodes Grid / Chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-fg-muted">Episodes:</span>
              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {Array.from({ length: episodesInCurrentSeason }, (_, i) => i + 1).map((epNum) => (
                  <button
                    key={epNum}
                    type="button"
                    onClick={() => setCurrentEpisode(epNum)}
                    className={cn(
                      'min-w-10 rounded-md px-2.5 py-1 font-mono text-xs transition',
                      currentEpisode === epNum
                        ? 'bg-fg font-bold text-canvas'
                        : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                    )}
                  >
                    E{epNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Video Player Area */}
        {selectedServerId !== 'torrentio' || directVideoUrl ? (
          <div className="space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-pop ring-1 ring-line">
              {directVideoUrl ? (
                <video
                  key={directVideoUrl}
                  src={directVideoUrl}
                  controls
                  autoPlay
                  className="size-full"
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              ) : (
                <iframe
                  key={`${selectedServerId}-${currentSeason}-${currentEpisode}-${reloadKey}`}
                  src={currentEmbedUrl}
                  title={`Watch ${details.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  referrerPolicy="origin"
                  className="size-full border-0"
                />
              )}
            </div>

            {/* Subtitles & Tips Helper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-3.5 text-xs text-fg-muted">
              <div className="flex items-center gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Subtitles className="size-3.5" />
                </span>
                <div>
                  <span className="font-semibold text-fg">Sous-titres / Subtitles: </span>
                  <span>
                    Cliquez sur l’icône <strong>CC</strong> ou l’engrenage dans le lecteur pour
                    activer les sous-titres (العربية, Français, English, Español).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={openSubtitlesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2.5 py-1 text-fg transition hover:bg-surface-3 hover:text-fg"
                >
                  <ExternalLink className="size-3" />
                  <span>Download .SRT (OpenSubtitles)</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Torrentio Dedicated Dashboard (https://torrentio.org) */
          <div className="space-y-6 rounded-xl border border-line bg-surface-1 p-5">
            {/* Torrentio Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-indigo-500/30 bg-indigo-500/20 text-indigo-300">
                    Torrentio Streams
                  </Badge>
                  <a
                    href="https://torrentio.org"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                  >
                    <span>torrentio.org</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <p className="max-w-2xl text-xs text-fg-muted">
                  Torrentio indexes torrent streams from 1337x, YTS, EZTV, ThePirateBay,
                  TorrentGalaxy and Debrid cloud providers. Open in Stremio, copy magnet links, or
                  stream with Real-Debrid.
                </p>
              </div>

              {/* Configure Addon Button */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="text-xs"
              >
                <Settings className="size-3.5" />
                {torrentioConfig ? 'Custom Config: Active' : 'Configure Addon / Debrid'}
              </Button>
            </div>

            {/* Custom Configuration Panel */}
            {isConfigOpen && (
              <div className="space-y-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Info className="size-4" />
                  <span>Torrentio Configuration / Real-Debrid</span>
                </div>
                <p className="text-xs text-fg-muted">
                  Configure your add-on at{' '}
                  <a
                    href="https://torrentio.strem.fun/configure"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 underline"
                  >
                    torrentio.strem.fun/configure
                  </a>{' '}
                  (e.g. with RealDebrid, AllDebrid or custom providers) and paste the configuration
                  part of the URL here (e.g.{' '}
                  <code className="text-indigo-200">providers=yts,eztv|realdebrid=YOUR_TOKEN</code>
                  ).
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempConfig}
                    onChange={(e) => setTempConfig(e.target.value)}
                    placeholder="e.g. providers=yts,1337x|sort=qualitysize"
                    className="flex-1 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs text-fg focus:border-indigo-500 focus:outline-none"
                  />
                  <Button size="sm" onClick={handleSaveConfig}>
                    Save Config
                  </Button>
                  {torrentioConfig && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTempConfig('');
                        setTorrentioConfig('');
                        try {
                          localStorage.removeItem(TORRENTIO_CONFIG_STORAGE_KEY);
                        } catch {
                          // Ignore
                        }
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Loading / Error / Stream List */}
            {isTorrentLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
                <Spinner className="size-8 text-indigo-500" />
                <p className="text-sm text-fg-muted">Scraping torrent streams from Torrentio...</p>
              </div>
            ) : torrentError && torrentStreams.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-line bg-surface-2 p-6 text-center">
                <p className="text-sm font-medium text-fg">{torrentError}</p>
                <p className="text-xs text-fg-muted">
                  You can watch instantly using the Web Streaming servers above (Server 1 VidLink,
                  Server 2 VidSrc, etc.) with subtitles!
                </p>
                <Button size="sm" variant="primary" onClick={() => setSelectedServerId('vidlink')}>
                  <Play className="size-3.5 fill-current" />
                  Switch to Server 1 (VidLink)
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-fg-muted">
                  <span>Available Streams ({torrentStreams.length})</span>
                  <span>Click Copy Magnet to download or Open in Stremio</span>
                </div>

                <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
                  {torrentStreams.map((s, idx) => (
                    <div
                      key={`${s.stream.infoHash}-${idx}`}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3 transition hover:border-indigo-500/40 hover:bg-surface-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                            {s.quality}
                          </Badge>
                          {s.provider && (
                            <span className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
                              ⚙️ {s.provider}
                            </span>
                          )}
                          {s.size && <span className="text-[11px] text-fg-muted">💾 {s.size}</span>}
                          {s.seeders !== null && (
                            <span className="text-[11px] font-medium text-emerald-400">
                              👤 {s.seeders} seeds
                            </span>
                          )}
                          {s.languages.length > 0 && (
                            <span className="text-[11px] text-fg-subtle">
                              {s.languages.join(' ')}
                            </span>
                          )}
                        </div>

                        <p className="truncate font-mono text-xs text-fg" title={s.releaseTitle}>
                          {s.releaseTitle}
                        </p>
                      </div>

                      {/* Stream Action Buttons */}
                      <div className="flex shrink-0 items-center gap-2">
                        {s.isDirectStream && (
                          <Button
                            size="sm"
                            onClick={() => setDirectVideoUrl(s.stream.url!)}
                            className="bg-indigo-600 text-xs hover:bg-indigo-700"
                          >
                            <Play className="size-3.5 fill-current" />
                            Stream Debrid
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyMagnet(s.magnetLink, s.stream.infoHash)}
                          className="text-xs"
                        >
                          {copiedHash === s.stream.infoHash ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              <span>Magnet</span>
                            </>
                          )}
                        </Button>

                        <a
                          href={s.stremioLink}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-surface-2"
                        >
                          <Film className="size-3.5 text-indigo-400" />
                          <span>Stremio</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
