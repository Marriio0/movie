import {
  ChevronLeft,
  ChevronRight,
  Film,
  Info,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useId, useState } from 'react';
import { paths } from '@/shared/config/paths';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { IconButton } from '@/shared/ui/IconButton';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useTitleTrailer } from '../catalog.hooks';
import type { MediaSummary } from '../catalog.types';
import { TMDB_CONTENT_LANG } from '../catalog.types';
import { youtubeEmbedUrl } from '../lib/youtube';
import { Backdrop } from './Backdrop';
import { Rating } from './Rating';

export interface HeroBillboardProps {
  media?: MediaSummary & { backdropPath: string };
  items?: (MediaSummary & { backdropPath: string })[];
}

const HERO_BODY =
  'container-page relative z-10 flex min-h-[min(82vh,46rem)] flex-col justify-end pb-12 pt-28 sm:pb-16 md:pt-36';

export function HeroBillboard({ media, items }: HeroBillboardProps) {
  const headingId = useId();
  const list = items && items.length > 0 ? items : media ? [media] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const activeItem = list[currentIndex] || list[0];

  // Auto-advance billboard carousel every 7s if not paused / trailer not open
  useEffect(() => {
    if (list.length <= 1 || isPaused || trailerOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [list.length, isPaused, trailerOpen]);

  // Query trailer for active featured item
  const trailerQuery = useTitleTrailer(
    activeItem?.mediaType ?? 'movie',
    activeItem?.id ?? 0,
  );
  const trailer = trailerQuery.data;

  if (!activeItem) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  return (
    <section
      aria-labelledby={headingId}
      className="relative overflow-hidden bg-canvas"
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
    >
      {/* High-definition cinematic backdrop with multi-stop gradient masks */}
      <div className="transition-opacity duration-700 ease-out">
        <Backdrop
          key={activeItem.id}
          path={activeItem.backdropPath}
          className="animate-fade-in"
        />
      </div>

      {/* Dynamic Animated Ambient Neon Aura */}
      <div className="pointer-events-none absolute -top-24 -start-24 z-1 size-96 rounded-full bg-accent/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute top-1/3 -end-24 z-1 size-80 rounded-full bg-purple-600/20 blur-3xl" />

      {/* Atmospheric ambient top and bottom glow */}
      <div className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-t from-canvas via-canvas/40 to-canvas/15 md:bg-gradient-to-r md:from-canvas md:via-canvas/80 md:to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 h-24 bg-gradient-to-t from-canvas to-transparent" />

      {/* Billboard Hero Body */}
      <div className={HERO_BODY}>
        <div className="max-w-2xl">
          {/* Spotlight Badges with Eye-Catching Pulsing VIP Indicator */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-bold text-accent shadow-sm shadow-accent/20">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              <span>NETFARJO VIP • جودة 4K فوري</span>
            </div>

            <Badge tone="accent" className="flex items-center gap-1.5 shadow-sm font-semibold">
              <Sparkles className="size-3.5" />
              <span>تريند اليوم · Trending #{currentIndex + 1}</span>
            </Badge>
            <span className="rounded-md bg-surface-2/80 px-2 py-0.5 font-medium text-fg-muted backdrop-blur-sm border border-line">
              {activeItem.mediaType === 'movie' ? 'فيلم سينمائي' : 'مسلسل'}
            </span>
            <span className="rounded-md bg-surface-2/80 px-2 py-0.5 font-semibold text-fg-muted backdrop-blur-sm border border-line">
              4K Ultra HD
            </span>
          </div>

          {/* Title */}
          <h2
            id={headingId}
            className="mt-4 font-display text-display-md sm:text-display-lg leading-none tracking-tight text-balance text-fg drop-shadow-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
          >
            {activeItem.title}
          </h2>

          {/* Metadata row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-fg-muted">
            <span className="font-medium text-fg">
              {activeItem.mediaType === 'movie' ? 'Movie' : 'Series'}
            </span>
            {activeItem.year && (
              <>
                <span className="text-fg-subtle">•</span>
                <span className="tabular-nums font-medium">{activeItem.year}</span>
              </>
            )}
            {activeItem.rating !== null && (
              <>
                <span className="text-fg-subtle">•</span>
                <Rating value={activeItem.rating} />
              </>
            )}
          </div>

          {/* Overview / Synopsis */}
          {activeItem.overview && (
            <p
              lang={TMDB_CONTENT_LANG}
              className="mt-4 line-clamp-3 text-sm sm:text-base leading-relaxed text-pretty text-fg-muted drop-shadow-sm max-w-xl"
            >
              {activeItem.overview}
            </p>
          )}

          {/* Action Buttons: Watch Now, Watch Trailer, View Details */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {/* Direct Play Link with animated pulse glow */}
            <ButtonLink
              to={paths.title(activeItem.mediaType, activeItem.id)}
              size="lg"
              className="group relative shadow-xl shadow-accent/25 bg-accent text-accent-fg hover:bg-accent-hover font-bold transition-all hover:scale-105 active:scale-95"
            >
              <span className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-accent to-purple-600 opacity-50 blur-xs transition group-hover:opacity-100 animate-pulse" />
              <span className="relative flex items-center gap-2">
                <Play className="size-5 fill-current transition-transform duration-200 group-hover:scale-110" />
                <span>تشغيل الآن · Watch Now</span>
              </span>
            </ButtonLink>

            {/* Watch Live Trailer Modal Button */}
            {trailer ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setTrailerOpen(true)}
                className="bg-surface-2/90 backdrop-blur-md border border-line-strong hover:bg-surface-3 transition-colors text-fg font-medium"
              >
                <Film className="size-5 text-accent" />
                <span>الإعلان · Trailer</span>
              </Button>
            ) : null}

            {/* View Details Link */}
            <ButtonLink
              to={paths.title(activeItem.mediaType, activeItem.id)}
              variant="ghost"
              size="lg"
              className="text-fg-muted hover:text-fg hover:bg-surface-2/60 backdrop-blur-sm"
            >
              <Info className="size-5" />
              <span>View details</span>
            </ButtonLink>
          </div>
        </div>

        {/* Carousel controls & mini thumbnails (Netflix / Apple TV+ style) */}
        {list.length > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line/40 pt-5">
            {/* Arrows */}
            <div className="flex items-center gap-2">
              <IconButton
                label="العنوان السابق"
                size="sm"
                variant="secondary"
                onClick={handlePrev}
                className="bg-surface-2/80 backdrop-blur-sm hover:bg-surface-3"
              >
                <ChevronLeft className="size-4" />
              </IconButton>
              <IconButton
                label="العنوان التالي"
                size="sm"
                variant="secondary"
                onClick={handleNext}
                className="bg-surface-2/80 backdrop-blur-sm hover:bg-surface-3"
              >
                <ChevronRight className="size-4" />
              </IconButton>
            </div>

            {/* Slide Indicators / Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {list.map((item, idx) => (
                <button
                  key={`${item.mediaType}:${item.id}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'group relative flex h-10 w-20 items-center justify-center overflow-hidden rounded-md border text-xs transition-all duration-200',
                    idx === currentIndex
                      ? 'border-accent ring-2 ring-accent/30 shadow-md scale-105'
                      : 'border-line/60 opacity-60 hover:opacity-100 hover:border-line-strong',
                  )}
                  aria-label={`الانتقال إلى ${item.title}`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w300${item.backdropPath}`}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/30" />
                  <span className="relative z-1 line-clamp-1 px-1 font-semibold text-white drop-shadow">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Live Trailer Dialog */}
      {trailer && (
        <Dialog.Root open={trailerOpen} onOpenChange={setTrailerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-black/90 backdrop-blur-md data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) w-[min(70rem,calc(100vw-2*var(--gutter)))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface-1 p-4 shadow-pop outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in">
              <div className="mb-3 flex items-center justify-between gap-4">
                <Dialog.Title className="flex items-center gap-2.5 truncate text-base font-semibold text-fg">
                  <Film className="size-5 text-accent shrink-0" />
                  <span className="truncate">
                    {activeItem.title} · {trailer.name || 'Official Trailer'}
                  </span>
                </Dialog.Title>
                <Dialog.Close asChild>
                  <IconButton
                    label="إغلاق الإعلان"
                    className="text-fg-muted hover:bg-surface-3 hover:text-fg"
                  >
                    <X className="size-5" />
                  </IconButton>
                </Dialog.Close>
              </div>

              <Dialog.Description className="sr-only">
                {`Trailer for ${activeItem.title}, streamed directly from YouTube in high quality.`}
              </Dialog.Description>

              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
                {trailerOpen && (
                  <iframe
                    src={youtubeEmbedUrl(trailer.youtubeKey)}
                    title={`${activeItem.title} Official Trailer`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="size-full"
                  />
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
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
