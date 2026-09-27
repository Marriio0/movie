import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Film,
  Globe2,
  HardDrive,
  Info,
  Languages,
  Maximize2,
  Minimize2,
  Play,
  Radio,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
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
  getOpenSubtitlesUrl,
  getSubDLUrl,
  getYifySubtitlesUrl,
  type SubtitleLanguage,
} from '../lib/subtitles';
import { fetchTorrentioStreams, type ParsedTorrentioStream } from '../lib/torrentio';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { usePwaInstall } from '@/shared/hooks/usePwaInstall';
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
  const { isInstallable, installApp } = usePwaInstall();

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

  // Quality filter for torrent downloads
  const [qualityFilter, setQualityFilter] = useState<'all' | '4k' | '1080p' | '720p'>('all');

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

  // Compute active embed player URL with subtitle preference
  const currentEmbedUrl = useMemo(() => {
    if (!activeServer) return '';
    return activeServer.getUrl({
      mediaType: details.mediaType,
      tmdbId: details.id,
      imdbId: details.imdbId,
      season: currentSeason,
      episode: currentEpisode,
      subLang: selectedSubLang,
    });
  }, [
    activeServer,
    details.mediaType,
    details.id,
    details.imdbId,
    currentSeason,
    currentEpisode,
    selectedSubLang,
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

  // Filter streams by quality selection tab
  const filteredStreams = useMemo(() => {
    if (qualityFilter === 'all') return torrentStreams;
    if (qualityFilter === '4k') {
      return torrentStreams.filter(
        (s) => s.quality.includes('4k') || s.quality.includes('2160p') || s.quality.includes('UHD'),
      );
    }
    if (qualityFilter === '1080p') {
      return torrentStreams.filter((s) => s.quality.includes('1080p'));
    }
    if (qualityFilter === '720p') {
      return torrentStreams.filter((s) => s.quality.includes('720p'));
    }
    return torrentStreams;
  }, [torrentStreams, qualityFilter]);

  const handleCopyMagnet = async (magnetLink: string, infoHash: string) => {
    try {
      await navigator.clipboard.writeText(magnetLink);
      setCopiedHash(infoHash);
      setTimeout(() => setCopiedHash(null), 2500);
    } catch {
      window.prompt('Copy Magnet Link:', magnetLink);
    }
  };

  const handleDirectDownload = (magnetLink: string) => {
    window.location.href = magnetLink;
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

  // Subtitle URLs for currently selected language
  const activeSubLangObj: SubtitleLanguage = useMemo(() => {
    return (
      SUPPORTED_SUBTITLE_LANGUAGES.find((l) => l.code === selectedSubLang) ||
      SUPPORTED_SUBTITLE_LANGUAGES[0]!
    );
  }, [selectedSubLang]);

  const openSubtitlesSelectedUrl = useMemo(() => {
    return getOpenSubtitlesUrl({
      title: details.title,
      mediaType: details.mediaType,
      imdbId: details.imdbId,
      season: isSeries ? currentSeason : undefined,
      episode: isSeries ? currentEpisode : undefined,
      langCode: selectedSubLang,
    });
  }, [
    details.title,
    details.mediaType,
    details.imdbId,
    isSeries,
    currentSeason,
    currentEpisode,
    selectedSubLang,
  ]);

  const subDlSelectedUrl = useMemo(() => {
    return getSubDLUrl({
      title: details.title,
      mediaType: details.mediaType,
      imdbId: details.imdbId,
      season: isSeries ? currentSeason : undefined,
      episode: isSeries ? currentEpisode : undefined,
      langCode: selectedSubLang,
    });
  }, [
    details.title,
    details.mediaType,
    details.imdbId,
    isSeries,
    currentSeason,
    currentEpisode,
    selectedSubLang,
  ]);

  const ytsSelectedUrl = useMemo(() => {
    return getYifySubtitlesUrl({
      title: details.title,
      mediaType: details.mediaType,
      imdbId: details.imdbId,
      langCode: selectedSubLang,
    });
  }, [details.title, details.mediaType, details.imdbId, selectedSubLang]);

  return (
    <section
      id="watch-player"
      aria-label={`Stream ${details.title}`}
      className={cn(
        'relative transform-gpu scroll-mt-24 transition-all duration-300 will-change-transform',
        isTheater && 'fixed inset-0 z-50 overflow-y-auto bg-black/95 p-4 backdrop-blur-md sm:p-8',
      )}
    >
      <div className={cn(isTheater ? 'mx-auto max-w-7xl' : 'w-full space-y-5')}>
        {/* Main Title, Badges and Quick Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-accent shadow-sm">
                <Play className="size-4 fill-current" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
                {isSeries
                  ? `Watch S${currentSeason} : E${currentEpisode}`
                  : `Watch ${details.title}`}
              </h2>
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-400">
                <Radio className="mr-1 size-3 animate-pulse text-emerald-400" />
                4K Ultra HD • Multi-Audio
              </Badge>
            </div>

            <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted sm:text-sm">
              <span className="font-medium text-fg">{isSeries ? 'TV Series' : 'Full Movie'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Subtitles className="size-3.5" />
                Subtitles (CC) Available
              </span>
              {details.imdbId && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs text-fg-subtle">{details.imdbId}</span>
                </>
              )}
              <span>•</span>
              <span className="text-fg-subtle">
                {STREAMING_SERVERS.length} Fast Streaming Servers Available
              </span>
            </p>
          </div>

          {/* View Mode Switcher: Stream, Download Center, Torrentio */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface-2/80 p-1.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setViewMode('stream');
                if (selectedServerId === 'torrentio') setSelectedServerId('vidlink');
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition',
                viewMode === 'stream' && selectedServerId !== 'torrentio'
                  ? 'bg-accent text-accent-fg shadow-md shadow-accent/20'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              <Play className="size-3.5 fill-current" />
              <span>Watch Online</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('download')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition',
                viewMode === 'download'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              <Download className="size-3.5" />
              <span>{isSeries ? 'Download Episodes' : 'Download Movie'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('torrentio');
                setSelectedServerId('torrentio');
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition',
                selectedServerId === 'torrentio'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              <Sparkles className="size-3.5" />
              <span>Torrentio</span>
            </button>

            {isInstallable && (
              <button
                type="button"
                onClick={installApp}
                className="hidden items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600 hover:text-white sm:flex"
                title="تثبيت تطبيق Marquee Cinema على جهازك"
              >
                <Download className="size-3.5" />
                <span>Install App (تثبيت)</span>
              </button>
            )}

            <div className="mx-1 h-4 w-px bg-line" />

            <IconButton
              label="Reload Player"
              onClick={() => {
                setReloadKey((k) => k + 1);
                setDirectVideoUrl(null);
              }}
              className="text-fg-muted hover:bg-surface-3 hover:text-fg"
            >
              <RefreshCw className="size-3.5" />
            </IconButton>

            <IconButton
              label={isTheater ? 'Exit Cinema Mode' : 'Cinema Mode'}
              onClick={() => setIsTheater(!isTheater)}
              className="text-fg-muted hover:bg-surface-3 hover:text-fg"
            >
              {isTheater ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </IconButton>
          </div>
        </div>

        {/* Global Subtitle Language Selector Bar (Quick 1-Click for Stream & Download) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-1/90 p-2.5 backdrop-blur-sm sm:px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-fg">
            <Languages className="size-4 text-emerald-400" />
            <span>Subtitle Language (لغة الترجمة):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SUPPORTED_SUBTITLE_LANGUAGES.map((lang) => {
              const isSelected = selectedSubLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedSubLang(lang.code)}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition',
                    isSelected
                      ? 'bg-emerald-500 font-bold text-white shadow-sm'
                      : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                  )}
                  title={`Select ${lang.name} Subtitles`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Server Selection Bar (when in streaming mode) */}
        {viewMode === 'stream' && selectedServerId !== 'torrentio' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-fg-muted uppercase">
              <span className="flex items-center gap-1.5">
                <Server className="size-3.5 text-accent" />
                Select Streaming Server ({STREAMING_SERVERS.length} Servers Available)
              </span>
              <button
                type="button"
                onClick={handleNextServer}
                className="flex items-center gap-1 text-xs font-medium tracking-normal text-accent lowercase hover:underline"
              >
                <span>next server</span>
                <SkipForward className="size-3" />
              </button>
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
                      'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm',
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

              {/* Torrentio Server Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedServerId('torrentio');
                  setViewMode('torrentio');
                  setDirectVideoUrl(null);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm',
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
        )}

        {/* Season & Episode Selector for Series */}
        {isSeries && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-1/90 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tv className="size-4 text-accent" />
                <span className="text-sm font-semibold text-fg">
                  Seasons & Episodes (المواسم والحلقات)
                </span>
                <Badge className="bg-surface-2 font-mono text-[10px] text-fg-muted">
                  Season {currentSeason} • Episode {currentEpisode} of {episodesInCurrentSeason}
                </Badge>
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
                  <span>Next Ep</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Season Pills */}
            {availableSeasons.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3">
                <span className="text-xs font-semibold text-fg-muted">Season:</span>
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
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                        isSelected
                          ? 'bg-accent font-bold text-accent-fg shadow-sm'
                          : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                      )}
                    >
                      Season {seasonNum}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Episode Selector Pills Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-fg-muted">
                <span>Select Episode (اختار الحلقة):</span>
                <span>
                  {episodesInCurrentSeason} episodes in Season {currentSeason}
                </span>
              </div>

              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {Array.from({ length: episodesInCurrentSeason }, (_, i) => i + 1).map((epNum) => {
                  const isActive = currentEpisode === epNum;
                  return (
                    <button
                      key={epNum}
                      type="button"
                      onClick={() => setCurrentEpisode(epNum)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition',
                        isActive
                          ? 'bg-fg font-bold text-canvas shadow-md ring-2 ring-accent'
                          : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
                      )}
                    >
                      <Play className={cn('size-3', isActive ? 'fill-current' : 'opacity-70')} />
                      <span>E{epNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: Video Player (Stream Mode) */}
        {viewMode === 'stream' && selectedServerId !== 'torrentio' && (
          <div className="space-y-3">
            {/* Cinema Video Container with Ambient Back-Glow & GPU Compositing */}
            <div className="relative aspect-video w-full transform-gpu overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10 contain-paint">
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

            {/* Subtitle Audio Synchronization & Delay Calibration Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-1/90 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="size-3.5" />
                </span>
                <div>
                  <span className="font-semibold text-fg">
                    مزامنة الترجمة مع الصوت (Subtitle Sync):{' '}
                  </span>
                  <span className="font-semibold text-emerald-400">
                    متزامنة ومتماشية 100% مع كلام الممثلين (0.0s Delay).
                  </span>
                  <span className="block text-[11px] text-fg-subtle">
                    الترجمة تبدأ أوتوماتيكياً بلغة {activeSubLangObj.name} من الديبار (à départ) وتم
                    حفظ اختيارك لجميع الأفلام والمسلسلات.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-fg-muted">
                  💡 إيلا بغيتي تزيد تسبقها أو تعطلها: كليكي على <strong>CC</strong> داخل المشغل
                  واختار <strong>Delay</strong> (+/-).
                </span>
                <a
                  href={openSubtitlesSelectedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg transition hover:bg-surface-3"
                >
                  <Download className="size-3 text-emerald-400" />
                  <span>تحميل .SRT متزامن</span>
                </a>
              </div>
            </div>

            {/* Quick Player Control & Fast Switch Notice */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-3 text-xs text-fg-muted">
              <div className="flex items-center gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                </span>
                <div>
                  <span className="font-semibold text-fg">مشكل فالفيديو أو التقطاع؟ </span>
                  <span>
                    كليكي على <strong>Next Server</strong> الفوق أو اختار أي سيرفر آخر من القائمة،
                    والترجمة بالعربية شغالة مباشرة أوتوماتيكياً (أو ضغط على <strong>CC</strong> داخل
                    الفيديو).
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleNextServer}
                  className="text-xs"
                >
                  <SkipForward className="size-3.5" />
                  <span>Next Server ⏭️</span>
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setViewMode('download')}
                  className="text-xs"
                >
                  <Download className="size-3.5" />
                  <span>{isSeries ? `Download Ep ${currentEpisode}` : 'Download Movie'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Direct Download Center (تحميل الحلقات والأفلام والترجمات) */}
        {viewMode === 'download' && (
          <div className="space-y-6 rounded-2xl border border-emerald-500/30 bg-surface-1/90 p-6 backdrop-blur-sm">
            {/* Download Center Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shadow-sm">
                    <Download className="size-4" />
                  </span>
                  <h3 className="text-lg font-bold text-fg sm:text-xl">
                    {isSeries
                      ? `تحميل الحلقة: S${currentSeason} : E${currentEpisode}`
                      : `تحميل فيلم: ${details.title}`}
                  </h3>
                  <Badge className="border-emerald-500/30 bg-emerald-500/20 font-bold text-emerald-300">
                    Direct Download
                  </Badge>
                </div>
                <p className="text-xs text-fg-muted">
                  تيليشارجي بجودة عالية (4K / 1080p / 720p) مع ملفات الترجمة بجميع اللغات وبلا
                  إعلانات مزعجة.
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setViewMode('stream')}
                className="text-xs"
              >
                <Play className="size-3.5 fill-current" />
                <span>Return to Watch</span>
              </Button>
            </div>

            {/* Quick Quality Cards (4K UHD, 1080p FHD, 720p HD) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-fg-muted uppercase">
                <span>روابط التحميل المباشرة (Direct Torrent & Magnet Downloads):</span>
                {torrentStreams.length > 0 && (
                  <span className="text-[11px] font-normal tracking-normal text-emerald-400 lowercase">
                    {torrentStreams.length} verified streams found
                  </span>
                )}
              </div>

              {isTorrentLoading ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-10">
                  <Spinner className="size-6 text-emerald-400" />
                  <p className="text-xs text-fg-muted">Searching fastest download mirrors...</p>
                </div>
              ) : torrentStreams.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* 1080p Full HD Card */}
                  {downloadOptions.fhd && (
                    <div className="flex flex-col justify-between space-y-3 rounded-xl border border-line bg-surface-2 p-4 transition hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-500/20 font-bold text-blue-300">
                            Full HD 1080p
                          </Badge>
                          {downloadOptions.fhd.size && (
                            <span className="font-mono text-xs text-fg-muted">
                              💾 {downloadOptions.fhd.size}
                            </span>
                          )}
                        </div>
                        <p
                          className="truncate font-mono text-xs text-fg-subtle"
                          title={downloadOptions.fhd.releaseTitle}
                        >
                          {downloadOptions.fhd.releaseTitle}
                        </p>
                        {downloadOptions.fhd.seeders !== null && (
                          <p className="text-[11px] font-medium text-emerald-400">
                            👤 {downloadOptions.fhd.seeders} seeders (سريع جداً)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDirectDownload(downloadOptions.fhd!.magnetLink)}
                          className="flex-1 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Download className="size-3.5" />
                          <span>تحميل الآن</span>
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
                          className="text-xs"
                          title="Copy Magnet Link"
                        >
                          {copiedHash === downloadOptions.fhd.stream.infoHash ? (
                            <Check className="size-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 720p HD Card */}
                  {downloadOptions.hd && (
                    <div className="flex flex-col justify-between space-y-3 rounded-xl border border-line bg-surface-2 p-4 transition hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-500/20 font-bold text-emerald-300">
                            HD 720p (سريع & خفيف)
                          </Badge>
                          {downloadOptions.hd.size && (
                            <span className="font-mono text-xs text-fg-muted">
                              💾 {downloadOptions.hd.size}
                            </span>
                          )}
                        </div>
                        <p
                          className="truncate font-mono text-xs text-fg-subtle"
                          title={downloadOptions.hd.releaseTitle}
                        >
                          {downloadOptions.hd.releaseTitle}
                        </p>
                        {downloadOptions.hd.seeders !== null && (
                          <p className="text-[11px] font-medium text-emerald-400">
                            👤 {downloadOptions.hd.seeders} seeders
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDirectDownload(downloadOptions.hd!.magnetLink)}
                          className="flex-1 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Download className="size-3.5" />
                          <span>تحميل الآن</span>
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
                          className="text-xs"
                          title="Copy Magnet Link"
                        >
                          {copiedHash === downloadOptions.hd.stream.infoHash ? (
                            <Check className="size-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 4K Ultra HD Card */}
                  {downloadOptions.uhd && (
                    <div className="flex flex-col justify-between space-y-3 rounded-xl border border-line bg-surface-2 p-4 transition hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-purple-500/20 font-bold text-purple-300">
                            4K Ultra HD (2160p HDR)
                          </Badge>
                          {downloadOptions.uhd.size && (
                            <span className="font-mono text-xs text-fg-muted">
                              💾 {downloadOptions.uhd.size}
                            </span>
                          )}
                        </div>
                        <p
                          className="truncate font-mono text-xs text-fg-subtle"
                          title={downloadOptions.uhd.releaseTitle}
                        >
                          {downloadOptions.uhd.releaseTitle}
                        </p>
                        {downloadOptions.uhd.seeders !== null && (
                          <p className="text-[11px] font-medium text-purple-400">
                            👤 {downloadOptions.uhd.seeders} seeders
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDirectDownload(downloadOptions.uhd!.magnetLink)}
                          className="flex-1 bg-purple-600 text-xs font-semibold text-white hover:bg-purple-700"
                        >
                          <Download className="size-3.5" />
                          <span>تحميل 4K</span>
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
                          className="text-xs"
                          title="Copy Magnet Link"
                        >
                          {copiedHash === downloadOptions.uhd.stream.infoHash ? (
                            <Check className="size-3.5 text-purple-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-6 text-center text-xs text-fg-muted">
                  <p>Searching for episode torrent sources...</p>
                  <p>
                    You can also open this title in Stremio or watch online in the player above.
                  </p>
                </div>
              )}
            </div>

            {/* All Torrents Filterable List */}
            {torrentStreams.length > 0 && (
              <div className="space-y-3 rounded-xl border border-line bg-surface-2/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-fg">
                    All Available Streams ({filteredStreams.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(['all', '4k', '1080p', '720p'] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQualityFilter(q)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium uppercase transition',
                          qualityFilter === q
                            ? 'bg-accent font-bold text-accent-fg'
                            : 'bg-surface-3 text-fg-muted hover:text-fg',
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {filteredStreams.map((s, idx) => (
                    <div
                      key={`${s.stream.infoHash}-${idx}`}
                      className="flex flex-col justify-between gap-2.5 rounded-lg border border-line bg-surface-1 p-2.5 text-xs transition hover:border-emerald-500/40 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className="bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                            {s.quality}
                          </Badge>
                          {s.size && <span className="font-mono text-fg-muted">{s.size}</span>}
                          {s.seeders !== null && (
                            <span className="font-medium text-emerald-400">
                              👤 {s.seeders} seeds
                            </span>
                          )}
                          {s.provider && (
                            <span className="font-mono text-[10px] text-fg-subtle">
                              ⚙️ {s.provider}
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
                        <Button
                          size="sm"
                          onClick={() => handleDirectDownload(s.magnetLink)}
                          className="h-7 bg-emerald-600 px-2.5 text-xs text-white hover:bg-emerald-700"
                        >
                          <Download className="size-3" />
                          <span>Download</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyMagnet(s.magnetLink, s.stream.infoHash)}
                          className="h-7 px-2 text-xs"
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

            {/* UNIVERSAL MULTILINGUAL SUBTITLES VAULT (مركز تحميل ملفات الترجمة بجميع اللغات) */}
            <div className="space-y-4 rounded-xl border border-line bg-surface-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-fg">
                  <Subtitles className="size-4 text-emerald-400" />
                  <span>مركز تحميل ملفات الترجمة (.SRT Subtitles Hub):</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">10+ اللغات متوفرة</span>
              </div>

              {/* Multilingual Download Grid: 1-Click for each language */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-fg-muted">
                  تحميل الترجمة بضغطة زر واحدة (Download .SRT by Language):
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPORTED_SUBTITLE_LANGUAGES.map((lang) => {
                    const langOpenSubUrl = getOpenSubtitlesUrl({
                      title: details.title,
                      mediaType: details.mediaType,
                      imdbId: details.imdbId,
                      season: isSeries ? currentSeason : undefined,
                      episode: isSeries ? currentEpisode : undefined,
                      langCode: lang.code,
                    });

                    const isArabic = lang.code === 'ar';

                    return (
                      <a
                        key={lang.code}
                        href={langOpenSubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-2.5 text-xs transition',
                          isArabic
                            ? 'border-emerald-500/50 bg-emerald-950/30 font-bold text-emerald-300 hover:bg-emerald-900/40'
                            : 'border-line bg-surface-1 text-fg hover:border-emerald-500/40 hover:bg-surface-3',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-fg-muted">
                          <Download className="size-3 text-emerald-400" />
                          <span>.SRT</span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Selected Language Primary Action & External Hubs */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">{activeSubLangObj.flag}</span>
                  <div>
                    <span className="font-bold text-fg">اللغة المختارة حالياً: </span>
                    <span className="font-semibold text-emerald-400">{activeSubLangObj.name}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={openSubtitlesSelectedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Download className="size-3.5" />
                    <span>
                      {selectedSubLang === 'ar'
                        ? 'تحميل الترجمة العربية (.SRT)'
                        : `تحميل ترجمة ${activeSubLangObj.nativeName} (.SRT)`}
                    </span>
                  </a>

                  <a
                    href={subDlSelectedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-surface-3"
                  >
                    <Globe2 className="size-3.5 text-blue-400" />
                    <span>SubDL Hub</span>
                  </a>

                  {!isSeries && (
                    <a
                      href={ytsSelectedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-surface-3"
                    >
                      <HardDrive className="size-3.5 text-purple-400" />
                      <span>YIFY Subtitles</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Instructions on how to play downloaded videos with subtitles */}
              <div className="space-y-1 rounded-lg border border-line/60 bg-surface-1/60 p-3 text-xs text-fg-muted">
                <p className="font-semibold text-fg">
                  💡 كيفاش تخدم الترجمة فـ التيليفون أو الكمبيوتر أو التلفزة:
                </p>
                <ol className="list-inside list-decimal space-y-0.5 text-fg-subtle">
                  <li>
                    تيليشارجي الفيديو وملف الترجمة <strong>(.SRT)</strong> من الأزرار الفوق.
                  </li>
                  <li>حط ملف الفيديو والترجمة فـ نفس المجلد ودير ليهم نفس السمية.</li>
                  <li>
                    افتح الفيديو ببرنامج <strong>VLC</strong> أو مشغل الهاتف أو Smart TV وغادي تخدم
                    الترجمة أوتوماتيكياً.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Torrentio Dedicated Dashboard */}
        {(viewMode === 'torrentio' || selectedServerId === 'torrentio') && (
          <div className="space-y-6 rounded-2xl border border-line bg-surface-1/90 p-5 backdrop-blur-sm">
            {/* Torrentio Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="border-indigo-500/30 bg-indigo-500/20 font-bold text-indigo-300">
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
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="text-xs"
                >
                  <Settings className="size-3.5" />
                  {torrentioConfig ? 'Custom Config: Active' : 'Configure Addon / Debrid'}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setViewMode('stream');
                    setSelectedServerId('vidlink');
                  }}
                  className="text-xs"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>Watch Online</span>
                </Button>
              </div>
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
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedServerId('vidlink');
                    setViewMode('stream');
                  }}
                >
                  <Play className="size-3.5 fill-current" />
                  <span>Switch to Server 1 (VidLink)</span>
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
                            onClick={() => {
                              setDirectVideoUrl(s.stream.url!);
                              setViewMode('stream');
                            }}
                            className="bg-indigo-600 text-xs hover:bg-indigo-700"
                          >
                            <Play className="size-3.5 fill-current" />
                            <span>Stream Debrid</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleDirectDownload(s.magnetLink)}
                          className="bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          <Download className="size-3.5" />
                          <span>Download</span>
                        </Button>

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
