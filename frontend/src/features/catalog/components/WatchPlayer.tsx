import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Info,
  Languages,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Server,
  Settings,
  SkipForward,
  Sparkles,
  Subtitles,
  Tv,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { MediaDetails } from '../catalog.types';
import { STREAMING_SERVERS, type StreamingServer } from '../lib/streaming-servers';
import {
  SUPPORTED_SUBTITLE_LANGUAGES,
  type SubtitleLanguage,
  fetchLiveSubtitles,
  downloadSubtitleBlob,
} from '../lib/subtitles';
import { fetchTorrentioStreams, type ParsedTorrentioStream } from '../lib/torrentio';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { Spinner } from '@/shared/ui/Spinner';

export interface WatchPlayerProps {
  details: MediaDetails;
}

const TORRENTIO_CONFIG_STORAGE_KEY = 'marquee:torrentio-config';
const PREFERRED_SUB_LANG_KEY = 'marquee:preferred-subtitle-lang';

type ViewMode = 'stream' | 'download' | 'torrentio';

export function WatchPlayer({ details }: WatchPlayerProps) {
  const isSeries = details.mediaType === 'tv';

  // Active view mode: stream player, download center, or torrentio explorer
  const [viewMode, setViewMode] = useState<ViewMode>('stream');

  // Server selection (default Server 1: VidLink with multi-subs)
  const [selectedServerId, setSelectedServerId] = useState<string>('vidlink');

  // Subtitle language preference (persists across all movies & series)
  const [selectedSubLang, setSelectedSubLangState] = useState<string>(() => {
    try {
      return localStorage.getItem(PREFERRED_SUB_LANG_KEY) || 'ar';
    } catch {
      return 'ar';
    }
  });

  const setSelectedSubLang = (langCode: string) => {
    setSelectedSubLangState(langCode);
    try {
      localStorage.setItem(PREFERRED_SUB_LANG_KEY, langCode);
    } catch {
      // Ignore
    }
  };

  // Season and episode state for series
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);

  // Theater / Cinema mode
  const [isTheater, setIsTheater] = useState(false);

  // Reload key to force iframe remount if stream gets stuck
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
    return 24; // Default safe fallback range
  }, [isSeries, details.seasons, currentSeason]);

  const activeServer: StreamingServer | undefined = useMemo(() => {
    return STREAMING_SERVERS.find((s) => s.id === selectedServerId);
  }, [selectedServerId]);

  // Live Subtitles query via Stremio OpenSubtitles v3 addon
  const subtitlesQuery = useQuery({
    queryKey: [
      'subtitles',
      details.mediaType,
      details.imdbId,
      currentSeason,
      currentEpisode,
    ],
    queryFn: ({ signal }) =>
      fetchLiveSubtitles({
        mediaType: details.mediaType,
        imdbId: details.imdbId,
        season: isSeries ? currentSeason : undefined,
        episode: isSeries ? currentEpisode : undefined,
        signal,
      }),
    enabled: Boolean(details.imdbId),
    staleTime: 10 * 60 * 1000,
  });

  const availableSubs = subtitlesQuery.data ?? [];
  const arabicSubs = useMemo(
    () => availableSubs.filter((s) => s.lang === 'ara'),
    [availableSubs],
  );
  const bestArabicSub = arabicSubs[0];
  const [isDownloadingSub, setIsDownloadingSub] = useState(false);

  const handleDownloadArabicSub = async () => {
    if (!bestArabicSub) return;
    setIsDownloadingSub(true);
    const filename = isSeries
      ? `${details.title}_S${currentSeason}E${currentEpisode}_Arabic.srt`
      : `${details.title}_Arabic.srt`;
    await downloadSubtitleBlob(bestArabicSub.url, filename);
    setIsDownloadingSub(false);
  };

  // Compute active embed player URL with subtitle preference and live sub_file injection
  const currentEmbedUrl = useMemo(() => {
    if (!activeServer) return '';
    return activeServer.getUrl({
      mediaType: details.mediaType,
      tmdbId: details.id,
      imdbId: details.imdbId,
      season: currentSeason,
      episode: currentEpisode,
      subLang: selectedSubLang,
      subFile: selectedSubLang === 'ar' ? bestArabicSub?.url : undefined,
    });
  }, [
    activeServer,
    details.mediaType,
    details.id,
    details.imdbId,
    currentSeason,
    currentEpisode,
    selectedSubLang,
    bestArabicSub?.url,
  ]);

  // Quick switch to next server if current is buffering
  const handleNextServer = () => {
    const currentIndex = STREAMING_SERVERS.findIndex((s) => s.id === selectedServerId);
    const nextIndex = (currentIndex + 1) % STREAMING_SERVERS.length;
    const nextServer = STREAMING_SERVERS[nextIndex] ?? STREAMING_SERVERS[0]!;
    setSelectedServerId(nextServer.id);
    setDirectVideoUrl(null);
  };

  // Torrentio query via TanStack Query (auto-fetches when in torrentio mode or download center)
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
    enabled:
      (selectedServerId === 'torrentio' || viewMode === 'download') && Boolean(details.imdbId),
    staleTime: 5 * 60 * 1000,
  });

  const torrentStreams: ParsedTorrentioStream[] = useMemo(
    () => torrentQuery.data ?? [],
    [torrentQuery.data],
  );
  const isTorrentLoading = torrentQuery.isLoading;
  const torrentError = !details.imdbId
    ? 'No IMDb ID found for this title (required by Torrentio).'
    : torrentQuery.isError
      ? 'Failed to connect to Torrentio. Check your network or configuration.'
      : torrentQuery.isSuccess && torrentStreams.length === 0
        ? 'No torrent streams found on Torrentio for this title.'
        : null;

  // Filter torrent streams by quality for easy 1-click download cards
  const downloadOptions = useMemo(() => {
    const fhd = torrentStreams.find((s) => s.quality.includes('1080p'));
    const uhd = torrentStreams.find(
      (s) => s.quality.includes('4k') || s.quality.includes('2160p') || s.quality.includes('UHD'),
    );
    const hd = torrentStreams.find((s) => s.quality.includes('720p'));
    return {
      fhd: fhd || torrentStreams[0],
      uhd: uhd || torrentStreams.find((s) => s !== fhd),
      hd: hd || torrentStreams[torrentStreams.length - 1],
    };
  }, [torrentStreams]);

  const handleCopyMagnet = async (magnetLink: string, infoHash: string) => {
    try {
      await navigator.clipboard.writeText(magnetLink);
      setCopiedHash(infoHash);
      setTimeout(() => setCopiedHash(null), 2500);
    } catch {
      window.prompt('Copy Magnet Link:', magnetLink);
    }
  };

  // Direct .torrent file download (never forces Stremio)
  const handleDownloadTorrentFile = (infoHash: string, title: string) => {
    const torrentUrl = `https://itorrents.net/torrent/${infoHash.toUpperCase()}.torrent`;
    const a = document.createElement('a');
    a.href = torrentUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.torrent`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  // Subtitle language for currently selected language
  const activeSubLangObj: SubtitleLanguage = useMemo(() => {
    return (
      SUPPORTED_SUBTITLE_LANGUAGES.find((l) => l.code === selectedSubLang) ||
      SUPPORTED_SUBTITLE_LANGUAGES[0]!
    );
  }, [selectedSubLang]);

  return (
    <section
      id="watch-player"
      aria-label={`Stream ${details.title}`}
      className={cn(
        'relative transform-gpu scroll-mt-24 transition-all duration-300 will-change-transform',
        isTheater && 'fixed inset-0 z-50 overflow-y-auto bg-black/95 p-4 backdrop-blur-md sm:p-8',
      )}
    >
      <div className={cn(isTheater ? 'mx-auto max-w-7xl' : 'w-full space-y-4')}>
        {/* Sleek Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Play className="size-4 fill-current" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
              {isSeries ? `Watch S${currentSeason} : E${currentEpisode}` : `Watch ${details.title}`}
            </h2>
            <span className="text-xs font-medium text-fg-muted">
              {isSeries ? 'TV Series' : 'Full Movie'}
            </span>
            <span className="text-fg-subtle">•</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <Subtitles className="size-3.5" />
              Subtitles (CC) Available
            </span>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode('stream');
                if (selectedServerId === 'torrentio') setSelectedServerId('vidlink');
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'stream' && selectedServerId !== 'torrentio'
                  ? 'bg-accent text-accent-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Play className="size-3 fill-current" />
              <span>Watch Online</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('download')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'download'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Download className="size-3" />
              <span>{isSeries ? 'Download Episodes' : 'Download Movie'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('torrentio');
                setSelectedServerId('torrentio');
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                selectedServerId === 'torrentio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Sparkles className="size-3" />
              <span>Torrentio</span>
            </button>

            <div className="mx-1 h-3.5 w-px bg-line" />

            <IconButton
              label="Reload Player"
              onClick={() => {
                setReloadKey((k) => k + 1);
                setDirectVideoUrl(null);
              }}
              className="text-fg-muted hover:text-fg"
            >
              <RefreshCw className="size-3" />
            </IconButton>

            <IconButton
              label={isTheater ? 'Exit Cinema Mode' : 'Cinema Mode'}
              onClick={() => setIsTheater(!isTheater)}
              className="text-fg-muted hover:text-fg"
            >
              {isTheater ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            </IconButton>
          </div>
        </div>

        {/* Clean Subtitle & Server Bar (when in streaming mode) */}
        {viewMode === 'stream' && selectedServerId !== 'torrentio' && (
          <div className="space-y-2">
            {/* Subtitle Selector Bar (Right from its place, minimalist & clean) */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-1 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-fg">
                <Languages className="size-3.5 text-emerald-400" />
                <span>Subtitles:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {SUPPORTED_SUBTITLE_LANGUAGES.map((lang) => {
                  const isSelected = selectedSubLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedSubLang(lang.code)}
                      className={cn(
                        'flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition',
                        isSelected
                          ? 'bg-emerald-500 font-bold text-white shadow-sm'
                          : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Server Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
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
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
                        isSelected
                          ? 'bg-accent text-accent-fg shadow-sm'
                          : 'bg-surface-2 text-fg ring-1 ring-line hover:bg-surface-3',
                      )}
                    >
                      <Server className="size-3" />
                      <span>{server.name}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedServerId('torrentio');
                    setViewMode('torrentio');
                    setDirectVideoUrl(null);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
                    selectedServerId === 'torrentio'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-surface-2 text-fg ring-1 ring-line hover:bg-surface-3',
                  )}
                >
                  <Sparkles className="size-3" />
                  <span>Torrentio (torrentio.org)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextServer}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <span>Next Server</span>
                <SkipForward className="size-3" />
              </button>
            </div>
          </div>
        )}

        {/* Series Season & Episode Navigation */}
        {isSeries && (
          <div className="space-y-2 rounded-lg border border-line bg-surface-1 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tv className="size-3.5 text-accent" />
                <span className="font-semibold text-fg">
                  Season {currentSeason} • Episode {currentEpisode} of {episodesInCurrentSeason}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentEpisode <= 1}
                  onClick={() => setCurrentEpisode((prev) => Math.max(1, prev - 1))}
                  className="h-7 text-xs"
                >
                  <ChevronLeft className="size-3" />
                  <span>Previous Ep</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentEpisode >= episodesInCurrentSeason}
                  onClick={() =>
                    setCurrentEpisode((prev) => Math.min(episodesInCurrentSeason, prev + 1))
                  }
                  className="h-7 text-xs"
                >
                  <span>Next Ep</span>
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>

            {/* Season Selector */}
            {availableSeasons.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-2">
                <span className="font-medium text-fg-muted">Season:</span>
                {availableSeasons.map((seasonNum) => {
                  const isSelected = currentSeason === seasonNum;
                  return (
                    <button
                      key={seasonNum}
                      type="button"
                      onClick={() => {
                        setCurrentSeason(seasonNum);
                        setCurrentEpisode(1);
                      }}
                      className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium transition',
                        isSelected
                          ? 'bg-accent font-bold text-accent-fg'
                          : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                      )}
                    >
                      S{seasonNum}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Episode Chips Grid */}
            <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto pr-1">
              {Array.from({ length: episodesInCurrentSeason }, (_, i) => i + 1).map((epNum) => {
                const isActive = currentEpisode === epNum;
                return (
                  <button
                    key={epNum}
                    type="button"
                    onClick={() => setCurrentEpisode(epNum)}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 font-mono text-xs transition',
                      isActive
                        ? 'bg-fg font-bold text-canvas shadow-sm ring-1 ring-accent'
                        : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                    )}
                  >
                    <Play className={cn('size-2.5', isActive ? 'fill-current' : 'opacity-60')} />
                    <span>E{epNum}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 1: Video Player (Stream Mode) */}
        {viewMode === 'stream' && selectedServerId !== 'torrentio' && (
          <div className="space-y-2">
            {/* Cinema Video Container */}
            <div className="relative aspect-video w-full transform-gpu overflow-hidden rounded-xl bg-black shadow-xl ring-1 ring-white/10 contain-paint">
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
                  key={`${selectedServerId}-${currentSeason}-${currentEpisode}-${selectedSubLang}-${reloadKey}`}
                  src={currentEmbedUrl}
                  title={`Watch ${details.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="origin"
                  className="size-full border-0"
                />
              )}
            </div>

            {/* Minimal Under-Player Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-1 px-3 py-2 text-xs text-fg-muted">
              <div className="flex flex-wrap items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-fg">{activeServer?.name}</span>
                <span>•</span>
                <span>Subtitles: {activeSubLangObj.name}</span>
                {bestArabicSub && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
                    🟢 متوفرة الترجمة العربية ({arabicSubs.length})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {bestArabicSub && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownloadArabicSub}
                    disabled={isDownloadingSub}
                    className="h-6 px-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                    title="تحميل ملف الترجمة العربية المتزامن مع الصوت مباشرة"
                  >
                    <Download className="size-3" />
                    <span>تحميل الترجمة (.SRT)</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleNextServer}
                  className="h-6 px-2 text-xs"
                >
                  <SkipForward className="size-3" />
                  <span>Next Server</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setViewMode('download')}
                  className="h-6 px-2 text-xs"
                >
                  <Download className="size-3" />
                  <span>{isSeries ? `Download Ep ${currentEpisode}` : 'Download Movie'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Clean Download Center */}
        {viewMode === 'download' && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-1 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Download className="size-4 text-emerald-400" />
                <h3 className="text-base font-bold text-fg">
                  {isSeries
                    ? `تحميل الحلقات: الموسم ${currentSeason} - الحلقة ${currentEpisode}`
                    : `تحميل: ${details.title}`}
                </h3>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setViewMode('stream')}
                className="h-7 text-xs"
              >
                <Play className="size-3 fill-current" />
                <span>Return to Watch</span>
              </Button>
            </div>

            {/* Series Season & Episode Navigation inside Download Center */}
            {isSeries && (
              <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tv className="size-3.5 text-emerald-400" />
                    <span className="font-semibold text-fg">
                      اختر الحلقة لتحميلها: الموسم {currentSeason} • الحلقة {currentEpisode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={currentEpisode <= 1}
                      onClick={() => setCurrentEpisode((prev) => Math.max(1, prev - 1))}
                      className="h-6 text-xs"
                    >
                      <ChevronLeft className="size-3" />
                      <span>الحلقة السابقة</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={currentEpisode >= episodesInCurrentSeason}
                      onClick={() =>
                        setCurrentEpisode((prev) => Math.min(episodesInCurrentSeason, prev + 1))
                      }
                      className="h-6 text-xs"
                    >
                      <span>الحلقة التالية</span>
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>

                {availableSeasons.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-2">
                    <span className="font-medium text-fg-muted">الموسم:</span>
                    {availableSeasons.map((seasonNum) => {
                      const isSelected = currentSeason === seasonNum;
                      return (
                        <button
                          key={seasonNum}
                          type="button"
                          onClick={() => {
                            setCurrentSeason(seasonNum);
                            setCurrentEpisode(1);
                          }}
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium transition',
                            isSelected
                              ? 'bg-accent font-bold text-accent-fg'
                              : 'bg-surface-3 text-fg-muted hover:text-fg',
                          )}
                        >
                          S{seasonNum}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto pr-1">
                  {Array.from({ length: episodesInCurrentSeason }, (_, i) => i + 1).map((epNum) => {
                    const isActive = currentEpisode === epNum;
                    return (
                      <button
                        key={epNum}
                        type="button"
                        onClick={() => setCurrentEpisode(epNum)}
                        className={cn(
                          'flex items-center gap-1 rounded px-2.5 py-1 font-mono text-xs transition',
                          isActive
                            ? 'bg-emerald-600 font-bold text-white shadow-sm ring-1 ring-emerald-400'
                            : 'bg-surface-3 text-fg-muted hover:bg-surface-1 hover:text-fg',
                        )}
                      >
                        <Download className="size-2.5" />
                        <span>E{epNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear explanation of how to download video to device */}
            <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-fg">
                <Info className="size-4 text-emerald-400 shrink-0" />
                <span>طريقة تنزيل الفيديو لجهازك (الهاتف أو الحاسوب):</span>
              </div>
              <p className="text-fg-muted leading-relaxed">
                • <strong>تحميل فوري عبر برامج التحميل</strong>: اضغط على <strong>تحميل مباشر</strong> وسيبدأ التنزيل تلقائياً في برنامج التحميل عندك (مثل <strong>uTorrent</strong> أو <strong>BitTorrent</strong> أو <strong>IDM</strong> أو <strong>1DM</strong> في أندرويد).
              </p>
              <p className="text-fg-muted leading-relaxed">
                • <strong>تحميل سحابي بدون برامج</strong>: اضغط <strong>نسخ الرابط</strong> واستعمل خدمة التحميل المباشر المجانية <a href="https://www.seedr.cc" target="_blank" rel="noreferrer" className="text-emerald-400 font-semibold underline">Seedr.cc</a> لتيليشارجي الفيديو MP4 ديريكت فـ المتصفح.
              </p>
            </div>

            {/* Direct Quality Downloads */}
            {isTorrentLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-8">
                <Spinner className="size-5 text-emerald-400" />
                <p className="text-xs text-fg-muted">Searching download sources...</p>
              </div>
            ) : torrentStreams.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {/* 1080p Full HD */}
                {downloadOptions.fhd && (
                  <div className="flex flex-col justify-between space-y-2.5 rounded-lg border border-line bg-surface-2 p-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500/20 text-[10px] font-bold text-blue-300">
                          1080p Full HD
                        </Badge>
                        {downloadOptions.fhd.size && (
                          <span className="font-mono text-fg-muted">
                            {downloadOptions.fhd.size}
                          </span>
                        )}
                      </div>
                      <p
                        className="truncate font-mono text-[11px] text-fg-subtle"
                        title={downloadOptions.fhd.releaseTitle}
                      >
                        {downloadOptions.fhd.releaseTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={downloadOptions.fhd!.magnetLink}
                        className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded bg-emerald-600 px-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        title="تحميل مباشر عبر uTorrent أو IDM أو BitTorrent"
                      >
                        <Download className="size-3" />
                        <span>تحميل مباشر</span>
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleDownloadTorrentFile(
                            downloadOptions.fhd!.stream.infoHash,
                            isSeries
                              ? `${details.title}_S${currentSeason}E${currentEpisode}`
                              : details.title,
                          )
                        }
                        className="h-7 px-2 text-[11px]"
                        title="تحميل ملف .torrent"
                      >
                        <span>.torrent</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleCopyMagnet(
                            downloadOptions.fhd!.magnetLink,
                            downloadOptions.fhd!.stream.infoHash,
                          )
                        }
                        className="h-7 px-2 text-xs"
                        title="Copy Magnet Link"
                      >
                        {copiedHash === downloadOptions.fhd.stream.infoHash ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 720p HD */}
                {downloadOptions.hd && (
                  <div className="flex flex-col justify-between space-y-2.5 rounded-lg border border-line bg-surface-2 p-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                          720p HD (Fast)
                        </Badge>
                        {downloadOptions.hd.size && (
                          <span className="font-mono text-fg-muted">{downloadOptions.hd.size}</span>
                        )}
                      </div>
                      <p
                        className="truncate font-mono text-[11px] text-fg-subtle"
                        title={downloadOptions.hd.releaseTitle}
                      >
                        {downloadOptions.hd.releaseTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={downloadOptions.hd!.magnetLink}
                        className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded bg-emerald-600 px-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        title="تحميل مباشر عبر uTorrent أو IDM أو BitTorrent"
                      >
                        <Download className="size-3" />
                        <span>تحميل مباشر</span>
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleDownloadTorrentFile(
                            downloadOptions.hd!.stream.infoHash,
                            isSeries
                              ? `${details.title}_S${currentSeason}E${currentEpisode}`
                              : details.title,
                          )
                        }
                        className="h-7 px-2 text-[11px]"
                        title="تحميل ملف .torrent"
                      >
                        <span>.torrent</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleCopyMagnet(
                            downloadOptions.hd!.magnetLink,
                            downloadOptions.hd!.stream.infoHash,
                          )
                        }
                        className="h-7 px-2 text-xs"
                        title="Copy Magnet Link"
                      >
                        {copiedHash === downloadOptions.hd.stream.infoHash ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 4K Ultra HD */}
                {downloadOptions.uhd && (
                  <div className="flex flex-col justify-between space-y-2.5 rounded-lg border border-line bg-surface-2 p-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/20 text-[10px] font-bold text-purple-300">
                          4K Ultra HD
                        </Badge>
                        {downloadOptions.uhd.size && (
                          <span className="font-mono text-fg-muted">
                            {downloadOptions.uhd.size}
                          </span>
                        )}
                      </div>
                      <p
                        className="truncate font-mono text-[11px] text-fg-subtle"
                        title={downloadOptions.uhd.releaseTitle}
                      >
                        {downloadOptions.uhd.releaseTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={downloadOptions.uhd!.magnetLink}
                        className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded bg-purple-600 px-2 text-xs font-semibold text-white transition hover:bg-purple-700"
                        title="تحميل 4K عبر uTorrent أو IDM أو BitTorrent"
                      >
                        <Download className="size-3" />
                        <span>تحميل 4K</span>
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleDownloadTorrentFile(
                            downloadOptions.uhd!.stream.infoHash,
                            isSeries
                              ? `${details.title}_S${currentSeason}E${currentEpisode}`
                              : details.title,
                          )
                        }
                        className="h-7 px-2 text-[11px]"
                        title="تحميل ملف .torrent"
                      >
                        <span>.torrent</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleCopyMagnet(
                            downloadOptions.uhd!.magnetLink,
                            downloadOptions.uhd!.stream.infoHash,
                          )
                        }
                        className="h-7 px-2 text-xs"
                        title="Copy Magnet Link"
                      >
                        {copiedHash === downloadOptions.uhd.stream.infoHash ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-surface-2 p-4 text-center text-xs text-fg-muted">
                <span>
                  Direct torrent sources are loading or unavailable for this title. You can watch
                  online above.
                </span>
              </div>
            )}

            {/* Subtitle direct download in Download Center */}
            {bestArabicSub && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-semibold text-fg shrink-0">ملف الترجمة العربية المزامنة (.SRT):</span>
                  <span className="text-emerald-400 font-mono text-[11px] truncate">
                    {bestArabicSub.subtitleFileName || `${details.title} Arabic`}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={handleDownloadArabicSub}
                  disabled={isDownloadingSub}
                  className="h-7 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700 font-semibold shrink-0"
                  title="تحميل ملف الترجمة العربية .SRT لجهازك"
                >
                  <Download className="size-3" />
                  <span>تحميل ملف الترجمة (.SRT)</span>
                </Button>
              </div>
            )}

            {/* In-Site Synchronized Subtitles Guarantee */}
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 p-3 text-xs text-fg-muted">
              <Check className="size-4 shrink-0 text-emerald-400" />
              <span>
                الترجمة متوفرة تلقائياً في مشغل الموقع بجودة عالية ومتزامنة مع الصوت، كما تتضمن ملفات التورنت ترجمات متعددة اللغات مدمجة (Multi-Subtitles).
              </span>
            </div>
          </div>
        )}

        {/* VIEW 3: Torrentio View */}
        {(viewMode === 'torrentio' || selectedServerId === 'torrentio') && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-1 p-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Badge className="border-indigo-500/30 bg-indigo-500/20 font-bold text-indigo-300">
                  Torrentio Streams
                </Badge>
                <a
                  href="https://torrentio.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                >
                  <span>torrentio.org</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="h-7 text-xs"
                >
                  <Settings className="size-3" />
                  <span>{torrentioConfig ? 'Config Active' : 'Configure Debrid'}</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setViewMode('stream');
                    setSelectedServerId('vidlink');
                  }}
                  className="h-7 text-xs"
                >
                  <Play className="size-3 fill-current" />
                  <span>Watch Online</span>
                </Button>
              </div>
            </div>

            {isConfigOpen && (
              <div className="space-y-2 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                  <Info className="size-3.5" />
                  <span>Real-Debrid / AllDebrid Config</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempConfig}
                    onChange={(e) => setTempConfig(e.target.value)}
                    placeholder="providers=yts,1337x|realdebrid=TOKEN"
                    className="flex-1 rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg focus:border-indigo-500 focus:outline-none"
                  />
                  <Button size="sm" onClick={handleSaveConfig} className="h-7 text-xs">
                    Save
                  </Button>
                </div>
              </div>
            )}

            {isTorrentLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-8 text-center">
                <Spinner className="size-6 text-indigo-500" />
                <p className="text-fg-muted">Loading torrent streams...</p>
              </div>
            ) : torrentError && torrentStreams.length === 0 ? (
              <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-4 text-center">
                <p className="font-medium text-fg">{torrentError}</p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedServerId('vidlink');
                    setViewMode('stream');
                  }}
                  className="h-7 text-xs"
                >
                  <span>Switch to Server 1 (VidLink)</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                  {torrentStreams.map((s, idx) => (
                    <div
                      key={`${s.stream.infoHash}-${idx}`}
                      className="flex flex-col justify-between gap-2 rounded-lg border border-line bg-surface-2 p-2.5 transition hover:border-indigo-500/40 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className="bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                            {s.quality}
                          </Badge>
                          {s.size && <span className="font-mono text-fg-muted">{s.size}</span>}
                          {s.seeders !== null && (
                            <span className="font-medium text-emerald-400">
                              👤 {s.seeders} seeds
                            </span>
                          )}
                        </div>
                        <p
                          className="truncate font-mono text-[11px] text-fg"
                          title={s.releaseTitle}
                        >
                          {s.releaseTitle}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {s.isDirectStream && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDirectVideoUrl(s.stream.url!);
                              setViewMode('stream');
                            }}
                            className="h-7 bg-indigo-600 px-2 text-xs hover:bg-indigo-700"
                          >
                            <Play className="size-3 fill-current" />
                            <span>Stream</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() =>
                            handleDownloadTorrentFile(s.stream.infoHash, details.title)
                          }
                          className="h-7 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700"
                          title="Direct .torrent download"
                        >
                          <Download className="size-3" />
                          <span>Download</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyMagnet(s.magnetLink, s.stream.infoHash)}
                          className="h-7 px-2 text-xs"
                          title="Copy Magnet Link"
                        >
                          {copiedHash === s.stream.infoHash ? (
                            <Check className="size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
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
