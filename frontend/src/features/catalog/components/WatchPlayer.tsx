import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Server,
  SkipForward,
  Subtitles,
  Tv,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { MediaDetails } from '../catalog.types';
import { STREAMING_SERVERS, type StreamingServer } from '../lib/streaming-servers';
import {
  fetchLiveSubtitles,
  downloadSubtitleBlob,
} from '../lib/subtitles';
import { fetchTorrentioStreams, type ParsedTorrentioStream } from '../lib/torrentio';
import { cn } from '@/shared/lib/cn';
import { usePwaInstall } from '@/shared/hooks/usePwaInstall';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { Spinner } from '@/shared/ui/Spinner';

export interface WatchPlayerProps {
  details: MediaDetails;
}

const PREFERRED_SUB_LANG_KEY = 'marquee:preferred-subtitle-lang';

type ViewMode = 'stream' | 'download';

export function WatchPlayer({ details }: WatchPlayerProps) {
  const isSeries = details.mediaType === 'tv';
  const { isInstallable, isInstalled, installApp } = usePwaInstall();

  // Active view mode: stream player or download center
  const [viewMode, setViewMode] = useState<ViewMode>('stream');

  // Server selection (default Server 1: VidLink with multi-subs)
  const [selectedServerId, setSelectedServerId] = useState<string>('vidlink');

  // Subtitle language preference (defaults to Arabic 'ar' or user saved preference)
  const selectedSubLang = useMemo(() => {
    try {
      return localStorage.getItem(PREFERRED_SUB_LANG_KEY) || 'ar';
    } catch {
      return 'ar';
    }
  }, []);

  // Season and episode state for series
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);

  // Theater / Cinema mode
  const [isTheater, setIsTheater] = useState(false);

  // Reload key to force iframe remount if stream gets stuck
  const [reloadKey, setReloadKey] = useState(0);

  const [torrentioConfig] = useState('');

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
    enabled: viewMode === 'download' && Boolean(details.imdbId),
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
    }
    setViewMode('stream');
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
              onClick={() => setViewMode('stream')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'stream'
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

        {/* Server Selector Bar (when in streaming mode) */}
        {viewMode === 'stream' && (
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
                <span className="font-semibold text-fg">{activeServer?.name}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Subtitles className="size-3.5" />
                  الترجمة متوفرة تلقائياً في المشغل (CC)
                </span>
                {bestArabicSub && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
                    🟢 ترجمة عربية مدمجة
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
                  className="h-6 px-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Download className="size-3" />
                  <span>{isSeries ? `تحميل وترجمة الحلقة ${currentEpisode}` : 'سيرفرات التحميل والترجمة'}</span>
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

            {/* Install App on Device Banner (PWA) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Download className="size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-fg">تثبيت تطبيق Netfarjo على جهازك</p>
                  <p className="text-fg-muted">
                    ثبّت الموقع كتطبيق أصلي على هاتفك أو حاسوبك لتشغيل وتنزيل الأفلام والمسلسلات مباشرة بدون متصفح
                  </p>
                </div>
              </div>
              {isInstallable ? (
                <Button
                  size="sm"
                  onClick={installApp}
                  className="h-7 bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <span>تثبيت التطبيق الآن</span>
                </Button>
              ) : isInstalled ? (
                <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  ✓ التطبيق مثبت على جهازك
                </span>
              ) : null}
            </div>

            {/* Clean one-line note */}
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs">
              <Info className="size-3.5 shrink-0 text-emerald-400" />
              <span className="text-fg-muted">اضغط تشغيل للمشاهدة مباشرة بجودة عالية، أو حمّل الفيديو MP4 لجهازك.</span>
            </div>

            {/* Direct Quality Downloads */}
            {isTorrentLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-8">
                <Spinner className="size-5 text-emerald-400" />
                <p className="text-xs text-fg-muted">جاري البحث عن روابط التحميل المباشرة...</p>
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
                          title="تحميل فيديو MP4 مباشر لجهازك"
                        >
                          <Download className="size-3.5" />
                          <span>تحميل فيديو مباشر (MP4)</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleWatchVideoNow()}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          title="مشاهدة وتشغيل الفيديو فوراً في المشغل"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>تشغيل الفيديو (1080p)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWatchVideoNow(downloadOptions.fhd?.stream.url)}
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-surface-3 px-1 text-[11px] font-medium text-fg ring-1 ring-line hover:bg-surface-1 transition"
                          title="مشاهدة مباشرة في المشغل"
                        >
                          <Play className="size-2.5 fill-current" />
                          <span>▶ مشاهدة مباشرة</span>
                        </Button>

                        {bestArabicSub && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={handleDownloadArabicSub}
                            className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                            title="تحميل ملف الترجمة العربية المزامنة (.SRT)"
                          >
                            <Download className="size-3" />
                            <span>الترجمة</span>
                          </Button>
                        )}
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
                          title="تحميل فيديو MP4 مباشر لجهازك"
                        >
                          <Download className="size-3.5" />
                          <span>تحميل فيديو مباشر (MP4)</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleWatchVideoNow()}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                          title="مشاهدة وتشغيل الفيديو فوراً في المشغل"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>تشغيل الفيديو (720p)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWatchVideoNow(downloadOptions.hd?.stream.url)}
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-surface-3 px-1 text-[11px] font-medium text-fg ring-1 ring-line hover:bg-surface-1 transition"
                          title="مشاهدة مباشرة في المشغل"
                        >
                          <Play className="size-2.5 fill-current" />
                          <span>▶ مشاهدة مباشرة</span>
                        </Button>

                        {bestArabicSub && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={handleDownloadArabicSub}
                            className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                            title="تحميل ملف الترجمة العربية المزامنة (.SRT)"
                          >
                            <Download className="size-3" />
                            <span>الترجمة</span>
                          </Button>
                        )}
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
                          title="تحميل فيديو MP4 مباشر لجهازك"
                        >
                          <Download className="size-3.5" />
                          <span>تحميل فيديو مباشر (MP4)</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleWatchVideoNow()}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-purple-600 px-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
                          title="مشاهدة وتشغيل الفيديو فوراً في المشغل"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>تشغيل الفيديو (4K)</span>
                        </Button>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleWatchVideoNow(downloadOptions.uhd?.stream.url)}
                          className="flex h-7 flex-1 items-center justify-center gap-1 rounded bg-surface-3 px-1 text-[11px] font-medium text-fg ring-1 ring-line hover:bg-surface-1 transition"
                          title="مشاهدة مباشرة في المشغل"
                        >
                          <Play className="size-2.5 fill-current" />
                          <span>▶ مشاهدة مباشرة</span>
                        </Button>

                        {bestArabicSub && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={handleDownloadArabicSub}
                            className="h-7 px-2.5 text-xs text-emerald-400 hover:text-emerald-300"
                            title="تحميل ملف الترجمة العربية المزامنة (.SRT)"
                          >
                            <Download className="size-3" />
                            <span>الترجمة</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-surface-2 p-4 text-center text-xs text-fg-muted">
                <span>
                  روابط التنزيل المباشرة التلقائية غير متوفرة لهذا العنوان حالياً. يمكنك الاستمتاع
                  بالمشاهدة المباشرة بجودة عالية عبر المشغل في الأعلى.
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
                الترجمة متوفرة تلقائياً في المشغل ومتزامنة مع الصوت.
              </span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
