import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Info,
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
import { useEffect, useMemo, useState } from 'react';
import type { MediaDetails } from '../catalog.types';
import { STREAMING_SERVERS, type StreamingServer } from '../lib/streaming-servers';
import {
  fetchLiveSubtitles,
  downloadSubtitleBlob,
  getOpenSubtitlesUrl,
  SUPPORTED_SUBTITLE_LANGUAGES,
} from '../lib/subtitles';
import { fetchTorrentioStreams, type ParsedTorrentioStream } from '../lib/torrentio';
import { cn } from '@/shared/lib/cn';
import { env } from '@/shared/config/env';
import { usePwaInstall } from '@/shared/hooks/usePwaInstall';
import { InstallModal } from '@/shared/components/InstallModal';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { Spinner } from '@/shared/ui/Spinner';

export interface WatchPlayerProps {
  details: MediaDetails;
}

const PREFERRED_SUB_LANG_KEY = 'marquee:preferred-subtitle-lang';
const PREFERRED_VIEW_MODE_KEY = 'marquee:preferred-view-mode';
const TORRENTIO_CONFIG_STORAGE_KEY = 'marquee:torrentio-config';

type ViewMode = 'stream' | 'torrentio' | 'download';

export function WatchPlayer({ details }: WatchPlayerProps) {
  const isSeries = details.mediaType === 'tv';
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  // Active view mode: default to stream for instant direct streaming
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(PREFERRED_VIEW_MODE_KEY);
      if (saved === 'download') {
        return 'download';
      }
      return 'stream';
    } catch {
      return 'stream';
    }
  });

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(PREFERRED_VIEW_MODE_KEY, mode);
    } catch {
      // Ignore
    }
  };

  // Server selection (default Server 1: Videasy Fast HD)
  const [selectedServerId, setSelectedServerId] = useState<string>('videasy');

  // Interactive Subtitle language preference (defaults to English 'en' or saved user preference)
  const [selectedSubLang, setSelectedSubLang] = useState<string>(() => {
    try {
      return localStorage.getItem(PREFERRED_SUB_LANG_KEY) || 'en';
    } catch {
      return 'en';
    }
  });

  const handleSelectSubLang = (langCode: string) => {
    setSelectedSubLang(langCode);
    try {
      localStorage.setItem(PREFERRED_SUB_LANG_KEY, langCode);
    } catch {
      // Ignore
    }
  };

  // State to control guided PWA installation dialog
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await installApp();
      if (!outcome) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Season and episode state for series
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);

  // Theater / Cinema mode
  const [isTheater, setIsTheater] = useState(false);
  const [isWidePlayer, setIsWidePlayer] = useState(false);

  // Reload key to force iframe remount if stream gets stuck
  const [reloadKey, setReloadKey] = useState(0);

  const [torrentioConfig, setTorrentioConfig] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(TORRENTIO_CONFIG_STORAGE_KEY) ||
        env.torrentioDefaultConfig ||
        ''
      );
    } catch {
      return env.torrentioDefaultConfig || '';
    }
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState(torrentioConfig);
  const [copiedMagnet, setCopiedMagnet] = useState<string | null>(null);

  const handleCopyMagnet = async (magnet: string) => {
    try {
      await navigator.clipboard.writeText(magnet);
      setCopiedMagnet(magnet);
      setTimeout(() => setCopiedMagnet(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSaveTorrentioConfig = () => {
    const trimmed = tempConfig.trim();
    setTorrentioConfig(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(TORRENTIO_CONFIG_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(TORRENTIO_CONFIG_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
    setIsConfigOpen(false);
  };

  // Active direct video stream URL from Debrid (if played through Torrentio)
  const [directVideoUrl, setDirectVideoUrl] = useState<string | null>(null);

  // Prevent third-party embed scripts from automatically redirecting the user away to external ad sites or opening popups
  useEffect(() => {
    let isInternalClick = false;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a, button');
      if (target) {
        isInternalClick = true;
        setTimeout(() => {
          isInternalClick = false;
        }, 1200);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isInternalClick) {
        // Stop embed scripts from hijacking parent window top navigation
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const originalOpen = window.open;
    window.open = function (url?: string | URL, target?: string, features?: string) {
      if (isInternalClick) {
        return originalOpen.call(window, url, target, features);
      }
      // Block third-party embed popups
      return null;
    };

    window.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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

  // Active language descriptor
  const currentSubLangObj = useMemo(() => {
    return (
      SUPPORTED_SUBTITLE_LANGUAGES.find((l) => l.code === selectedSubLang) ||
      SUPPORTED_SUBTITLE_LANGUAGES[0]!
    );
  }, [selectedSubLang]);

  // Synchronized subtitle track matching the user's selected language
  const currentLangSub = useMemo(() => {
    return (
      availableSubs.find((s) => s.lang === currentSubLangObj.openSubCode) ||
      availableSubs.find((s) => s.lang.toLowerCase().startsWith(selectedSubLang))
    );
  }, [availableSubs, currentSubLangObj, selectedSubLang]);

  const arabicSubs = useMemo(
    () => availableSubs.filter((s) => s.lang === 'ara'),
    [availableSubs],
  );
  const bestArabicSub = arabicSubs[0];
  const [isDownloadingSub, setIsDownloadingSub] = useState(false);

  // Dynamic subtitle download in the client's chosen language directly (.SRT)
  const handleDownloadSelectedSub = async () => {
    const subToDownload = currentLangSub || bestArabicSub;
    if (!subToDownload) {
      // Fallback: Open OpenSubtitles for this title and language directly
      const openSubUrl = getOpenSubtitlesUrl({
        mediaType: details.mediaType,
        title: details.title,
        imdbId: details.imdbId,
        season: isSeries ? currentSeason : undefined,
        episode: isSeries ? currentEpisode : undefined,
        langCode: selectedSubLang,
      });
      window.open(openSubUrl, '_blank');
      return;
    }
    setIsDownloadingSub(true);
    const safeLangName = currentSubLangObj.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = isSeries
      ? `${details.title}_S${currentSeason}E${currentEpisode}_${safeLangName}.srt`
      : `${details.title}_${safeLangName}.srt`;
    await downloadSubtitleBlob(subToDownload.url, filename);
    setIsDownloadingSub(false);
  };


  // Compute active embed player URL with subtitle preference and live sub_file injection
  const currentEmbedUrl = useMemo(() => {
    if (!activeServer) return '';
    const activeSubFile = currentLangSub?.url || bestArabicSub?.url;
    return activeServer.getUrl({
      mediaType: details.mediaType,
      tmdbId: details.id,
      imdbId: details.imdbId,
      season: currentSeason,
      episode: currentEpisode,
      subLang: selectedSubLang,
      subFile: activeSubFile,
    });
  }, [
    activeServer,
    details.mediaType,
    details.id,
    details.imdbId,
    currentSeason,
    currentEpisode,
    selectedSubLang,
    currentLangSub?.url,
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

  // Torrentio query via TanStack Query (auto-fetches when in download center)
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
    enabled: (viewMode === 'download' || viewMode === 'torrentio') && Boolean(details.imdbId),
    staleTime: 5 * 60 * 1000,
  });

  const torrentStreams: ParsedTorrentioStream[] = useMemo(
    () => torrentQuery.data ?? [],
    [torrentQuery.data],
  );
  const isTorrentLoading = torrentQuery.isLoading;


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

  const downloadFilename = useMemo(() => {
    return isSeries
      ? `${details.title}_S${currentSeason}E${currentEpisode}`
      : details.title;
  }, [isSeries, details.title, currentSeason, currentEpisode]);

  // Direct MP4 video download (never downloads .torrent files that launch Stremio)
  const handleDownloadDirectVideo = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWatchVideoNow = (directUrl?: string | null) => {
    if (directUrl) {
      setDirectVideoUrl(directUrl);
      handleSetViewMode('torrentio');
    } else {
      handleSetViewMode('stream');
    }
    const el = document.getElementById('watch-player');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
                handleSetViewMode('torrentio');
                setDirectVideoUrl(null);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'torrentio'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Sparkles className="size-3" />
              <span>⚡ Premium (No Ads)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSetViewMode('stream');
                setDirectVideoUrl(null);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'stream'
                  ? 'bg-accent text-accent-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Server className="size-3" />
              <span>Servers (1-5)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('download')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'download'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Download className="size-3" />
              <span>{isSeries ? 'Download Episodes' : 'Download'}</span>
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

        {/* Server & Subtitle Selector Bar (when in streaming mode) */}
        {viewMode === 'stream' && (
          <div className="space-y-2">
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
                    setViewMode('torrentio');
                    setDirectVideoUrl(null);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-900/60 transition"
                  title="Premium Ad-Free Server"
                >
                  <Sparkles className="size-3 text-emerald-400" />
                  <span>Ad-Free (4K/HQ)</span>
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

            {/* Subtitle Language Quick Select & Enlarge Video Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line/60 bg-surface-1/80 px-2.5 py-1.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 font-medium text-fg-muted shrink-0">
                  <Subtitles className="size-3.5 text-emerald-400" />
                  <span>Subtitles:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {SUPPORTED_SUBTITLE_LANGUAGES.map((lang) => {
                    const isSelected = selectedSubLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectSubLang(lang.code)}
                        className={cn(
                          'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold transition',
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                            : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Directly next to subtitle: Enlarge Video / Cinema Wide Toggle */}
              <button
                type="button"
                onClick={() => setIsWidePlayer(!isWidePlayer)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition shadow-xs',
                  isWidePlayer
                    ? 'bg-accent text-accent-fg ring-1 ring-accent'
                    : 'bg-surface-2 text-fg ring-1 ring-line hover:bg-surface-3 hover:text-accent',
                )}
                title="Expand video player to cinema wide view"
              >
                {isWidePlayer ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                <span>{isWidePlayer ? 'Standard View' : 'Cinema Wide'}</span>
              </button>
            </div>

            {/* Quick tip about pop-ups */}
            <div className="flex items-center gap-2.5 rounded-lg border border-line/60 bg-surface-2/80 px-3 py-2 text-xs">
              <Info className="size-4 shrink-0 text-accent" />
              <span className="text-fg-muted">
                If a pop-up appears on first play, just close it — the video will start immediately.
              </span>
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
        {viewMode === 'stream' && (
          <div className="space-y-2">
            {/* Cinema Video Container */}
            <div
              className={cn(
                'relative w-full transform-gpu overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10 contain-paint transition-all duration-300',
                isWidePlayer
                  ? 'h-[70vh] sm:h-[80vh] md:h-[90vh] w-full max-w-full'
                  : 'aspect-video w-full min-h-[320px] sm:min-h-[480px] md:min-h-[560px]',
              )}
            >
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
                <span className="font-semibold text-fg">{activeServer?.name}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Subtitles className="size-3.5" />
                  Subtitles (CC) Active
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
                  🟢 {currentSubLangObj.nativeName} {currentLangSub ? 'synced' : 'embedded'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDownloadSelectedSub}
                  disabled={isDownloadingSub}
                  className="h-6 px-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  title={`Download subtitle file (${currentSubLangObj.nativeName})`}
                >
                  <Download className="size-3" />
                  <span>Download Subs ({currentSubLangObj.nativeName}) .SRT</span>
                </Button>

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
                  onClick={() => setViewMode('torrentio')}
                  className="h-6 px-2 text-xs font-semibold text-purple-400 hover:text-purple-300"
                  title="Premium ad-free server"
                >
                  <Sparkles className="size-3" />
                  <span>Ad-Free 4K</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setViewMode('download')}
                  className="h-6 px-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Download className="size-3" />
                  <span>{isSeries ? `Download E${currentEpisode}` : 'Download Center'}</span>
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
                    ? `Download: Season ${currentSeason} – Episode ${currentEpisode}`
                    : `Download: ${details.title}`}
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
                      Select episode: Season {currentSeason} • Episode {currentEpisode}
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
                      <span>Previous</span>
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
                      <span>Next</span>
                      <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>

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

            {/* Install App on Device Banner (PWA) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3 text-xs" dir="rtl">
              <div className="flex items-center gap-2.5">
                <Download className="size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-fg">
                    Install <bdi className="font-bold text-accent">Netfarjo</bdi> on your device
                  </p>
                  <p className="text-fg-muted">
                    Install as a native app on your phone or computer to stream and download movies directly.
                  </p>
                </div>
              </div>
              {isInstalled ? (
                <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  ✓ App installed
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="h-8 bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  <Download className="size-3.5 mr-1" />
                  <span>Install Now</span>
                </Button>
              )}
            </div>

            {/* Clean one-line note */}
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs" dir="rtl">
              <Info className="size-3.5 shrink-0 text-emerald-400" />
              <span className="text-fg-muted">Select quality below to stream in HD or download the subtitle file.</span>
            </div>

            {/* Direct Quality Downloads */}
            {isTorrentLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-8">
                <Spinner className="size-5 text-emerald-400" />
                <p className="text-xs text-fg-muted">Searching for direct download links...</p>
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

                    <div className="space-y-1.5 pt-1">
                      {downloadOptions.fhd.isDirectStream && downloadOptions.fhd.stream.url ? (
                        <Button
                          type="button"
                          onClick={() =>
                            handleDownloadDirectVideo(
                              downloadOptions.fhd!.stream.url!,
                              downloadFilename,
                            )
                          }
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          title="Download MP4 to device"
                        >
                          <Download className="size-3.5" />
                          <span>Download MP4</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleWatchVideoNow()}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          title="Play in browser"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>Play (1080p)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWatchVideoNow(downloadOptions.fhd?.stream.url)}
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-surface-3 px-1 text-[11px] font-medium text-fg ring-1 ring-line hover:bg-surface-1 transition"
                          title="Watch directly in player"
                        >
                          <Play className="size-2.5 fill-current" />
                          <span>▶ Watch ({currentSubLangObj.nativeName})</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleDownloadSelectedSub}
                          disabled={!currentLangSub && !bestArabicSub}
                          className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                          title={`Download subtitle (${currentSubLangObj.nativeName}) .SRT`}
                        >
                          <Download className="size-3" />
                          <span>Subs ({currentSubLangObj.nativeName})</span>
                        </Button>
                      </div>
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

                    <div className="space-y-1.5 pt-1">
                      {downloadOptions.hd.isDirectStream && downloadOptions.hd.stream.url ? (
                        <Button
                          type="button"
                          onClick={() =>
                            handleDownloadDirectVideo(
                              downloadOptions.hd!.stream.url!,
                              downloadFilename,
                            )
                          }
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          title="Download MP4 to device"
                        >
                          <Download className="size-3.5" />
                          <span>Download MP4</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleWatchVideoNow()}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          title="Play in browser"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>Play (720p)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWatchVideoNow(downloadOptions.hd?.stream.url)}
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-surface-3 px-1 text-[11px] font-medium text-fg ring-1 ring-line hover:bg-surface-1 transition"
                          title="Watch directly in player"
                        >
                          <Play className="size-2.5 fill-current" />
                          <span>▶ Watch ({currentSubLangObj.nativeName})</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleDownloadSelectedSub}
                          disabled={!currentLangSub && !bestArabicSub}
                          className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                          title={`Download subtitle (${currentSubLangObj.nativeName}) .SRT`}
                        >
                          <Download className="size-3" />
                          <span>Subs ({currentSubLangObj.nativeName})</span>
                        </Button>
                      </div>
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

                    <div className="space-y-1.5 pt-1">
                      {downloadOptions.uhd.isDirectStream && downloadOptions.uhd.stream.url ? (
                        <Button
                          type="button"
                          onClick={() =>
                            handleDownloadDirectVideo(
                              downloadOptions.uhd!.stream.url!,
                              downloadFilename,
                            )
                          }
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-purple-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
                          title="Download MP4 to device"
                        >
                          <Download className="size-3.5" />
                          <span>Download MP4</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleWatchVideoNow()}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-purple-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
                          title="Play in browser"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>Play (4K)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWatchVideoNow(downloadOptions.uhd?.stream.url)}
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-surface-3 px-1 text-[11px] font-medium text-fg ring-1 ring-line hover:bg-surface-1 transition"
                          title="Watch directly in player"
                        >
                          <Play className="size-2.5 fill-current" />
                          <span>▶ Watch ({currentSubLangObj.nativeName})</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleDownloadSelectedSub}
                          disabled={!currentLangSub && !bestArabicSub}
                          className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                          title={`Download subtitle (${currentSubLangObj.nativeName}) .SRT`}
                        >
                          <Download className="size-3" />
                          <span>Subs ({currentSubLangObj.nativeName})</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-surface-2 p-4 text-center text-xs text-fg-muted">
                <span>
Direct download links are not available for this title. You can watch it directly using the player above.
                </span>
              </div>
            )}

            {/* Multilingual Subtitle Center */}
            <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs" dir="rtl">
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-emerald-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Subtitles className="size-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-fg">Choose subtitle language:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1" dir="ltr">
                  {SUPPORTED_SUBTITLE_LANGUAGES.map((lang) => {
                    const isSelected = selectedSubLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectSubLang(lang.code)}
                        className={cn(
                          'flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition',
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                            : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtitle track details & direct download */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-semibold text-fg shrink-0">
                    {currentSubLangObj.nativeName} subtitle file (.SRT):
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px] truncate">
                    {currentLangSub?.subtitleFileName || `${details.title} ${currentSubLangObj.name}`}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={handleDownloadSelectedSub}
                  disabled={isDownloadingSub || (!currentLangSub && !bestArabicSub)}
                  className="h-7 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700 font-semibold shrink-0 shadow-sm"
                  title={`Download subtitle (${currentSubLangObj.nativeName}) .SRT`}
                >
                  <Download className="size-3" />
                  <span>Download {currentSubLangObj.nativeName} Subtitles (.SRT)</span>
                </Button>
              </div>
            </div>

            {/* In-Site Synchronized Subtitles Guarantee */}
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 p-3 text-xs text-fg-muted" dir="rtl">
              <Check className="size-4 shrink-0 text-emerald-400" />
              <span>
                Subtitles are automatically available and synchronized in the player.
              </span>
            </div>
          </div>
        )}

        {/* VIEW 3: Torrentio Streams View */}
        {viewMode === 'torrentio' && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
            {/* Prominent En Cours / Under Development Status Banner */}
            <div
              className="relative overflow-hidden rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/80 via-purple-900/50 to-surface-2 p-4 sm:p-5 shadow-lg"
              dir="rtl"
            >
              <div className="pointer-events-none absolute -top-12 -left-12 size-40 rounded-full bg-purple-500/20 blur-2xl animate-pulse" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/30 text-purple-300">
                      <Sparkles className="size-4 animate-spin text-purple-400" />
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-fg">
                      Premium Ad-Free Servers (Coming Soon)
                    </h3>
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30">
                      Bientôt disponible
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted max-w-2xl leading-relaxed">
                    We're setting up high-speed ad-free 4K servers for direct in-site playback. Meanwhile, use Servers 1-5 or the Download Center.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    onClick={() => handleSetViewMode('stream')}
                    className="gap-1.5 bg-accent text-accent-fg hover:bg-accent-hover font-bold text-xs shadow-md"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Go to Player (Servers 1-5)</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleSetViewMode('download')}
                    className="gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <Download className="size-3.5" />
                    <span>Download Center</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Header & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3" dir="rtl">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-fg sm:text-base">Premium ad-free server (Ad-Free 4K / 1080p)</h3>
                    <Badge className="bg-purple-500/20 text-[10px] font-bold text-purple-300">
                      {torrentStreams.length > 0 ? `${torrentStreams.length} available` : 'Premium HQ'}
                    </Badge>
                  </div>
                  <p className="text-xs text-fg-muted">
                    High-speed 4K and 1080p servers with zero ads and top quality audio/video.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsConfigOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg"
                  title="Debrid settings"
                >
                  <Settings className="size-3.5" />
                  <span>{torrentioConfig ? 'Debrid active' : 'Setup Debrid'}</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setViewMode('stream')}
                  className="flex items-center gap-1.5 bg-brand-primary text-xs font-semibold text-white hover:bg-brand-primary/90"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>Standard Player</span>
                </Button>
              </div>
            </div>

            {/* Collapsible Debrid / RealDebrid Config Panel */}
            {isConfigOpen && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3.5 text-xs" dir="rtl">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-purple-300">Debrid Provider Settings (RealDebrid / Torbox):</span>
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="text-fg-subtle hover:text-fg"
                  >
                    Close ✕
                  </button>
                </div>
                <p className="mb-2 text-fg-muted">
                  If you have a RealDebrid, AllDebrid, or Torbox account, enter your Torrentio config code for instant 4K playback:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempConfig}
                    onChange={(e) => setTempConfig(e.target.value)}
                    placeholder="e.g. realdebrid=APIKEY or torbox=APIKEY"
                    className="flex-1 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs text-fg outline-none focus:border-purple-500 font-mono"
                    dir="ltr"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTorrentioConfig}
                    className="bg-purple-600 px-3 text-xs text-white hover:bg-purple-700"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Native In-Site Direct HTML5 Video Player */}
            {directVideoUrl && (
              <div className="space-y-2" dir="ltr">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-purple-500/50">
                  <video
                    key={directVideoUrl}
                    src={directVideoUrl}
                    controls
                    autoPlay
                    className="size-full"
                    playsInline
                  >
                    {currentLangSub && (
                      <track
                        kind="subtitles"
                        src={currentLangSub.url}
                        srcLang={selectedSubLang}
                        label={currentSubLangObj.nativeName}
                        default
                      />
                    )}
                    Your browser does not support HTML5 video streaming.
                  </video>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 p-2.5 text-xs" dir="rtl">
                  <span className="font-semibold text-purple-300">
                    Playing directly in-site in original 4K quality — ad-free (Direct Stream)
                  </span>
                  <button
                    type="button"
                    onClick={() => setDirectVideoUrl(null)}
                    className="text-xs text-fg-subtle hover:text-fg font-medium"
                  >
                    Close Player ✕
                  </button>
                </div>
              </div>
            )}

            {/* TV Series Season & Episode Picker */}
            {isSeries && (
              <div className="space-y-2 rounded-lg border border-line bg-surface-2 p-3" dir="rtl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg">Select season and episode:</span>
                  <span className="text-fg-muted font-mono">
                    Season {currentSeason} – Episode {currentEpisode}
                  </span>
                </div>

                {availableSeasons.length > 1 && (
                  <div className="flex flex-wrap gap-1 border-b border-line/60 pb-2">
                    {availableSeasons.map((seasonNum) => {
                      const isActive = currentSeason === seasonNum;
                      return (
                        <button
                          key={seasonNum}
                          type="button"
                          onClick={() => {
                            setCurrentSeason(seasonNum);
                            setCurrentEpisode(1);
                          }}
                          className={cn(
                            'rounded px-2.5 py-1 text-xs font-semibold transition',
                            isActive
                              ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                              : 'bg-surface-3 text-fg-muted hover:bg-surface-1 hover:text-fg',
                          )}
                        >
                          Season {seasonNum}
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
                            ? 'bg-purple-600 font-bold text-white shadow-sm ring-1 ring-purple-400'
                            : 'bg-surface-3 text-fg-muted hover:bg-surface-1 hover:text-fg',
                        )}
                      >
                        <Play className="size-2.5 fill-current" />
                        <span>Episode {epNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stream List / Cards */}
            {isTorrentLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-12">
                <Spinner className="size-6 text-purple-400" />
                <p className="text-xs text-fg-muted">Searching for premium streams...</p>
              </div>
            ) : torrentStreams.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-line bg-surface-2 p-8 text-center" dir="rtl">
                <Info className="size-8 text-fg-subtle" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-fg">No premium streams found for this title</p>
                  <p className="text-xs text-fg-muted">You can use the standard player (Server 1 or 2) to watch in high quality.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setViewMode('stream')}
                  className="bg-brand-primary text-xs text-white"
                >
                  Back to Player
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid gap-2">
                  {torrentStreams.map((s, idx) => {
                    const is4k = s.quality.includes('4k') || s.quality.includes('2160p') || s.quality.includes('UHD');
                    const is1080p = s.quality.includes('1080p');
                    const isCopied = copiedMagnet === s.magnetLink;

                    return (
                      <div
                        key={`${s.stream.infoHash}-${idx}`}
                        className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface-2 p-3 transition hover:border-purple-500/40 sm:flex-row sm:items-center sm:justify-between"
                        dir="rtl"
                      >
                        <div className="min-w-0 flex-1 space-y-1 text-right">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={cn(
                                'text-[10px] font-bold',
                                is4k
                                  ? 'bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/40'
                                  : is1080p
                                    ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/40'
                                    : 'bg-surface-3 text-fg-muted',
                              )}
                            >
                              {s.quality || 'HD'}
                            </Badge>

                            {s.size && (
                              <span className="font-mono text-xs font-semibold text-fg-muted">
                                💾 {s.size}
                              </span>
                            )}

                            {s.seeders !== null && (
                              <span className="font-mono text-xs font-semibold text-emerald-400">
                                👤 {s.seeders} seeds
                              </span>
                            )}

                            {s.provider && (
                              <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-fg-subtle">
                                {s.provider}
                              </span>
                            )}
                          </div>

                          <p
                            className="truncate font-mono text-xs text-fg"
                            dir="ltr"
                            title={s.releaseTitle}
                          >
                            {s.releaseTitle}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0" dir="ltr">
                          {s.isDirectStream && s.stream.url ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleWatchVideoNow(s.stream.url)}
                                className="h-8 gap-1.5 bg-purple-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                                title="Play directly in browser"
                              >
                                <Play className="size-3 fill-current" />
                                <span>▶ Play Now</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownloadDirectVideo(s.stream.url!, downloadFilename)}
                                className="h-8 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                                title="Download MP4 file"
                              >
                                <Download className="size-3" />
                                <span>Download MP4</span>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleWatchVideoNow()}
                                className="h-8 gap-1.5 bg-purple-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                                title="Play in site player"
                              >
                                <Play className="size-3 fill-current" />
                                <span>▶ Play in Browser</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCopyMagnet(s.magnetLink)}
                                className={cn(
                                  'h-8 gap-1.5 px-3 text-xs font-semibold transition',
                                  isCopied
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-surface-3 text-fg hover:bg-surface-1',
                                )}
                                title="Copy Magnet link"
                              >
                                {isCopied ? <Check className="size-3 text-white" /> : <Copy className="size-3" />}
                                <span>{isCopied ? 'Copied ✔' : 'Copy Magnet'}</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Helpful Guide Note */}
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2 p-3 text-xs text-fg-muted" dir="rtl">
              <Info className="size-4 shrink-0 text-purple-400" />
              <span>
                Premium servers fetch original video files in top quality (4K HDR / 1080p). Press Play to watch instantly, or enter a Debrid code for direct MP4 playback.
              </span>
            </div>
          </div>
        )}

        {/* Guided PWA Installation Modal */}
        <InstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          onInstallNative={isInstallable ? installApp : undefined}
          canPromptNative={isInstallable}
        />
      </div>
    </section>
  );
}
