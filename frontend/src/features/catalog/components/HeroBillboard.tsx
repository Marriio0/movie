import {
  ChevronLeft,
  ChevronRight,
  Film,
  Info,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useId, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/shared/i18n/language-context';
import { paths } from '@/shared/config/paths';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { IconButton } from '@/shared/ui/IconButton';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useTitleTrailer } from '../catalog.hooks';
import type { MediaSummary } from '../catalog.types';
import { TMDB_CONTENT_LANG } from '../catalog.types';
import { youtubeBackgroundTrailerUrl, youtubeEmbedUrl } from '../lib/youtube';
import { SurpriseModal } from './SurpriseModal';

export interface HeroBillboardProps {
  media?: MediaSummary & { backdropPath: string };
  items?: (MediaSummary & { backdropPath: string })[];
}

const HERO_BODY =
  'container-page relative z-10 flex min-h-[min(85vh,48rem)] flex-col justify-end pb-12 pt-28 sm:pb-16 md:pt-36';

export function HeroBillboard({ media, items }: HeroBillboardProps) {
  const headingId = useId();
  const { t, language } = useLanguage();
  const list = items && items.length > 0 ? items : media ? [media] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [bgVideoReady, setBgVideoReady] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the thumbnail rail to keep the active preview centered
  useEffect(() => {
    if (
      activeThumbnailRef.current &&
      thumbnailContainerRef.current &&
      typeof activeThumbnailRef.current.scrollIntoView === 'function'
    ) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

  const activeItem = list[currentIndex] || list[0];

  // Reset background video loading state when active title changes
  useEffect(() => {
    setBgVideoReady(false);
  }, [activeItem?.id]);

  // Auto-advance billboard carousel every 6.5s with smooth animated progress bar
  useEffect(() => {
    if (list.length <= 1 || isPaused || trailerOpen) {
      setProgress(0);
      return;
    }

    const duration = 6500;
    const intervalTime = 50;
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((current) => (current + 1) % list.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [list.length, isPaused, trailerOpen]);

  // Reset progress when index changes manually
  const handleSelectIndex = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
    setProgress(0);
  };

  // Query trailer for active featured item
  const trailerQuery = useTitleTrailer(
    activeItem?.mediaType ?? 'movie',
    activeItem?.id ?? 0,
  );
  const trailer = trailerQuery.data;

  if (!activeItem) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden bg-canvas min-h-[min(85vh,48rem)]"
    >
      {/* Absolute Full-Bleed Background Container: Backdrop Poster + Live Ambient Video Trailer */}
      <div className="absolute inset-0 size-full overflow-hidden pointer-events-none select-none z-0">
        {/* Layer 1: High-Definition Backdrop Poster Image (Reliable, instantaneous base) */}
        {activeItem.backdropPath ? (
          <img
            key={`backdrop-${activeItem.id}`}
            src={`https://image.tmdb.org/t/p/original${activeItem.backdropPath}`}
            alt=""
            className="size-full object-cover object-center scale-105 transition-transform duration-10000 ease-out"
          />
        ) : (
          <div className="size-full bg-surface-1" />
        )}

        {/* Layer 2: Live Seamless Video Trailer in Background (Netflix / Apple TV+ style) */}
        {trailer?.youtubeKey && (
          <div
            className={cn(
              'absolute inset-0 size-full overflow-hidden transition-opacity duration-1000 ease-out',
              bgVideoReady ? 'opacity-85' : 'opacity-0',
            )}
          >
            <iframe
              key={`bg-trailer-${activeItem.id}-${trailer.youtubeKey}-${isMuted ? 'muted' : 'unmuted'}`}
              src={youtubeBackgroundTrailerUrl(trailer.youtubeKey, isMuted)}
              title={`${activeItem.title} Ambient Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setBgVideoReady(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] min-w-[100vw] min-h-[56.25vw] pointer-events-none border-0"
            />
          </div>
        )}

        {/* Layer 3: Dynamic Animated Ambient Neon Glows (Dark Mode Only) */}
        <div className="pointer-events-none absolute -top-24 -start-24 z-1 size-96 rounded-full bg-accent/20 blur-3xl animate-pulse dark:block hidden" />
        <div className="pointer-events-none absolute top-1/3 -end-24 z-1 size-80 rounded-full bg-purple-600/20 blur-3xl dark:block hidden" />

        {/* Layer 4: Multi-Directional Gradient Overlays (Ensures title & text remain 100% readable) */}
        {/* Heavy fade from text side (left in LTR, right in RTL) */}
        <div className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/20 md:bg-gradient-to-r md:from-canvas md:via-canvas/80 md:via-40% md:to-transparent" />
        {/* Bottom seamless blend into rails below */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 h-36 bg-gradient-to-t from-canvas via-canvas/80 to-transparent" />
        {/* Top header navigation shade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-2 h-28 bg-gradient-to-b from-canvas/90 via-canvas/40 to-transparent" />
      </div>

      {/* Billboard Hero Body */}
      <div className={HERO_BODY}>
        <div className="max-w-2xl space-y-4">
          {/* Authentic Streaming-style Top 10 / Trending Badge */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center rounded bg-red-600 px-2 py-0.5 text-[11px] font-black tracking-wider text-white shadow-sm uppercase">
              {currentIndex < 10 ? 'TOP 10' : 'TRENDING'}
            </span>
            <span className="text-sm font-bold tracking-tight text-fg drop-shadow-sm">
              {language === 'ar'
                ? `المرتبة #${currentIndex + 1} في ${activeItem.mediaType === 'movie' ? t('movies') : t('series')} اليوم`
                : language === 'fr'
                  ? `N° ${currentIndex + 1} des ${activeItem.mediaType === 'movie' ? t('movies') : t('series')} aujourd'hui`
                  : `#${currentIndex + 1} in ${activeItem.mediaType === 'movie' ? t('movies') : t('series')} Today`}
            </span>
          </div>

          {/* Title */}
          <h2
            id={headingId}
            className="font-display text-display-md sm:text-display-lg leading-tight tracking-tight text-balance text-fg drop-shadow-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
          >
            {activeItem.title}
          </h2>

          {/* Clean Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-fg-muted font-medium">
            <span className="font-semibold text-fg">
              {activeItem.mediaType === 'movie' ? t('movieSingular') : t('seriesSingular')}
            </span>
            {activeItem.year && (
              <>
                <span className="text-fg-subtle">•</span>
                <span className="tabular-nums font-semibold text-fg">{activeItem.year}</span>
              </>
            )}
            {activeItem.rating !== null && (
              <>
                <span className="text-fg-subtle">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-500 dark:text-amber-400">
                  <span>★</span> {activeItem.rating.toFixed(1)}
                </span>
              </>
            )}
            <span className="text-fg-subtle">•</span>
            <span className="rounded border border-line px-1.5 py-0.5 text-[11px] font-bold text-fg-muted uppercase">
              HD
            </span>
          </div>

          {/* Overview / Synopsis */}
          {activeItem.overview && (
            <p
              lang={TMDB_CONTENT_LANG}
              className="line-clamp-3 text-sm sm:text-base leading-relaxed text-pretty text-fg-muted drop-shadow-sm max-w-xl"
            >
              {activeItem.overview}
            </p>
          )}

          {/* Action Buttons: Watch Now, Watch Trailer, View Details */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            {/* Direct Play Link with animated pulse glow */}
            <ButtonLink
              to={paths.title(activeItem.mediaType, activeItem.id)}
              size="lg"
              className="group relative flex-1 sm:flex-initial justify-center shadow-xl shadow-accent/25 bg-accent text-accent-fg hover:bg-accent-hover font-bold transition-all hover:scale-105 active:scale-95 min-w-[140px]"
            >
              <span className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-accent to-purple-600 opacity-50 blur-xs transition group-hover:opacity-100 animate-pulse" />
              <span className="relative flex items-center justify-center gap-2">
                <Play className="size-5 fill-current transition-transform duration-200 group-hover:scale-110" />
                <span>{t('watchNow')}</span>
              </span>
            </ButtonLink>

            {/* Watch Live Trailer Modal Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setTrailerOpen(true)}
              className="bg-surface-2/90 backdrop-blur-md border border-line-strong hover:bg-surface-3 transition-colors text-fg font-medium gap-2 hover:border-accent"
            >
              <Film className="size-5 text-accent" />
              <span className="hidden xs:inline sm:inline">{t('watchTrailer')}</span>
            </Button>

            {/* Surprise Me / Random Hit Generator */}
            <SurpriseModal items={list} />

            {/* Ambient Video Trailer Sound Toggle */}
            {trailer?.youtubeKey && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setIsMuted((prev) => !prev)}
                className="hidden sm:inline-flex bg-surface-2/90 backdrop-blur-md border border-line-strong hover:bg-surface-3 transition-colors text-fg font-medium gap-2 hover:border-accent"
                title={isMuted ? t('unmuteTrailer') : t('muteTrailer')}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="size-5 text-fg-muted" />
                    <span>{t('unmuteTrailer')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-5 text-accent animate-pulse" />
                    <span>{t('muteTrailer')}</span>
                  </>
                )}
              </Button>
            )}

            {/* View Details Link */}
            <ButtonLink
              to={paths.title(activeItem.mediaType, activeItem.id)}
              variant="ghost"
              size="lg"
              className="hidden md:inline-flex text-fg-muted hover:text-fg hover:bg-surface-2/60 backdrop-blur-sm"
            >
              <Info className="size-5" />
              <span>{t('viewDetails')}</span>
            </ButtonLink>
          </div>
        </div>

        {/* Carousel controls & mini thumbnails (Netflix / Apple TV+ style) */}
        {list.length > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line/40 pt-5">
            {/* Arrows */}
            <div className="flex items-center gap-2">
              <IconButton
                label={t('previousTitle')}
                size="sm"
                variant="secondary"
                onClick={handlePrev}
                className="bg-surface-2/80 backdrop-blur-sm hover:bg-surface-3"
              >
                <ChevronLeft className="size-4" />
              </IconButton>
              <IconButton
                label={t('nextTitle')}
                size="sm"
                variant="secondary"
                onClick={handleNext}
                className="bg-surface-2/80 backdrop-blur-sm hover:bg-surface-3"
              >
                <ChevronRight className="size-4" />
              </IconButton>
            </div>

            {/* Slide Indicators / Thumbnails with Live Active Progress Bar */}
            <div
              ref={thumbnailContainerRef}
              onPointerEnter={() => setIsPaused(true)}
              onPointerLeave={() => setIsPaused(false)}
              className="flex items-center gap-2.5 overflow-x-auto py-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {list.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={`${item.mediaType}:${item.id}`}
                    ref={isActive ? activeThumbnailRef : undefined}
                    onClick={() => handleSelectIndex(idx)}
                    className={cn(
                      'group relative flex h-11 w-24 sm:w-28 items-center justify-center overflow-hidden rounded-lg border text-xs transition-all duration-300',
                      isActive
                        ? 'border-accent ring-2 ring-accent/40 shadow-lg shadow-accent/20 scale-105'
                        : 'border-line/60 opacity-60 hover:opacity-100 hover:border-line-strong',
                    )}
                    aria-label={item.title}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w300${item.backdropPath}`}
                      alt=""
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/55 transition-colors group-hover:bg-black/35" />

                    {/* Rank Badge */}
                    <span className="relative z-1 flex items-center gap-1 px-1.5 font-bold text-white drop-shadow text-[11px] truncate">
                      <span className="text-accent font-extrabold">#{idx + 1}</span>
                      <span className="truncate">{item.title}</span>
                    </span>

                    {/* Active Slide Progress Line (Shows countdown to next trailer) */}
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 z-2 h-1 bg-white/20">
                        <div
                          className="h-full bg-accent transition-all duration-75 ease-linear shadow-sm shadow-accent"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Live Trailer Dialog (100% Ad-Free, Pure YouTube Theater Experience) */}
      <Dialog.Root open={trailerOpen} onOpenChange={setTrailerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-black/90 backdrop-blur-md data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) w-[min(72rem,calc(100vw-2*var(--gutter)))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface-1 p-4 shadow-pop outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in">
            <div className="mb-3 flex items-center justify-between gap-4">
              <Dialog.Title className="flex items-center gap-2.5 truncate text-base font-semibold text-fg">
                <Film className="size-5 text-accent shrink-0" />
                <span className="truncate font-bold">
                  {activeItem.title} · {trailer?.name || t('watchTrailer')}
                </span>
              </Dialog.Title>

              <div className="flex items-center gap-2 shrink-0">
                <ButtonLink
                  to={paths.title(activeItem.mediaType, activeItem.id)}
                  size="sm"
                  className="gap-1.5 bg-accent text-accent-fg font-bold text-xs"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>{t('watchNow')}</span>
                </ButtonLink>

                <Dialog.Close asChild>
                  <IconButton
                    label={t('closeTrailer')}
                    className="text-fg-muted hover:bg-surface-3 hover:text-fg"
                  >
                    <X className="size-5" />
                  </IconButton>
                </Dialog.Close>
              </div>
            </div>

            <Dialog.Description className="sr-only">
              {`Trailer for ${activeItem.title}, streamed directly in high quality without advertisements.`}
            </Dialog.Description>

            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10 flex items-center justify-center">
              {trailerOpen && trailer?.youtubeKey ? (
                <iframe
                  src={youtubeEmbedUrl(trailer.youtubeKey, language)}
                  title={`${activeItem.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  className="size-full border-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <Film className="size-12 text-accent animate-pulse" />
                  <p className="text-sm font-semibold text-fg">{activeItem.title}</p>
                  <p className="text-xs text-fg-muted max-w-sm">
                    {activeItem.overview || 'Stream full high-definition content directly:'}
                  </p>
                  <ButtonLink
                    to={paths.title(activeItem.mediaType, activeItem.id)}
                    size="lg"
                    className="gap-2 bg-accent text-accent-fg font-bold"
                  >
                    <Play className="size-5 fill-current" />
                    <span>{t('watchNow')}</span>
                  </ButtonLink>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

export function HeroBillboardSkeleton() {
  return (
    <div aria-hidden="true" className="relative bg-canvas">
      <Skeleton className="aspect-video w-full rounded-none md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[72%] md:opacity-50" />
      <div className={HERO_BODY}>
        <div className="w-full max-w-2xl">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="mt-4 h-16 w-4/5 rounded-lg" />
          <Skeleton className="mt-4 h-5 w-48 rounded-md" />
          <Skeleton className="mt-5 h-4 w-full rounded" />
          <Skeleton className="mt-2 h-4 w-11/12 rounded" />
          <div className="mt-7 flex gap-3">
            <Skeleton className="h-12 w-44 rounded-md" />
            <Skeleton className="h-12 w-36 rounded-md" />
            <Skeleton className="h-12 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
