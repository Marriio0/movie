import { Dices, Film, Play, RefreshCw, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import { Link } from 'react-router';
import { paths } from '@/shared/config/paths';
import { useLanguage } from '@/shared/i18n/language-context';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import type { MediaSummary } from '../catalog.types';

export interface SurpriseModalProps {
  items: (MediaSummary & { backdropPath: string })[];
}

export function SurpriseModal({ items }: SurpriseModalProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const { language } = useLanguage();

  if (!items || items.length === 0) return null;

  const handleOpen = () => {
    // Pick a random item on open
    const randomIdx = Math.floor(Math.random() * items.length);
    setCurrentIndex(randomIdx);
    setOpen(true);
  };

  const handleReroll = () => {
    setIsRolling(true);
    setTimeout(() => {
      let nextIdx = Math.floor(Math.random() * items.length);
      if (nextIdx === currentIndex && items.length > 1) {
        nextIdx = (nextIdx + 1) % items.length;
      }
      setCurrentIndex(nextIdx);
      setIsRolling(false);
    }, 250);
  };

  const currentItem = items[currentIndex] || items[0];
  if (!currentItem) return null;

  const targetUrl = paths.title(currentItem.mediaType, currentItem.id);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleOpen}
        className="bg-surface-2/90 backdrop-blur-md border border-line-strong hover:bg-surface-3 transition-colors text-fg font-medium gap-2 hover:border-accent"
        title="Surprise Me"
      >
        <Dices className="size-5 text-accent" />
        <span>
          {language === 'ar'
            ? 'اقترح عليّ'
            : language === 'fr'
              ? 'Surprenez-moi'
              : 'Surprise Me'}
        </span>
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-black/85 backdrop-blur-md data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) w-[min(38rem,calc(100vw-2*var(--gutter)))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-line bg-surface-1 shadow-pop outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in">
            {/* Header / Media Backdrop Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-surface-3">
              {currentItem.backdropPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w780${currentItem.backdropPath}`}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-surface-3">
                  <Film className="size-12 text-fg-muted" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/40 to-black/60" />

              {/* Close Button */}
              <div className="absolute top-3 right-3 z-10">
                <Dialog.Close asChild>
                  <IconButton
                    label="Close"
                    className="bg-black/60 text-white/90 hover:bg-black hover:text-white backdrop-blur-md"
                  >
                    <X className="size-5" />
                  </IconButton>
                </Dialog.Close>
              </div>

              {/* Badge: Surprise Recommendation */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                  <Dices className="size-3.5" />
                  <span>
                    {language === 'ar' ? 'اقتراح عشوائي' : language === 'fr' ? 'Suggestion Surprise' : 'Surprise Pick'}
                  </span>
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 pt-2 space-y-4">
              <div>
                <Dialog.Title className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
                  {currentItem.title}
                </Dialog.Title>
                <div className="mt-2 flex items-center gap-3 text-xs sm:text-sm text-fg-muted font-medium">
                  <span className="font-semibold text-fg">
                    {currentItem.mediaType === 'movie'
                      ? (language === 'ar' ? 'فيلم' : language === 'fr' ? 'Film' : 'Movie')
                      : (language === 'ar' ? 'مسلسل' : language === 'fr' ? 'Série' : 'Series')}
                  </span>
                  {currentItem.year && (
                    <>
                      <span>•</span>
                      <span>{currentItem.year}</span>
                    </>
                  )}
                  {currentItem.rating !== null && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-500 dark:text-amber-400">
                        <span>★</span> {currentItem.rating.toFixed(1)}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-bold text-fg-muted uppercase">
                    HD
                  </span>
                </div>
              </div>

              {currentItem.overview && (
                <p className="line-clamp-3 text-xs sm:text-sm text-fg-muted leading-relaxed">
                  {currentItem.overview}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={targetUrl}
                  onClick={() => setOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-fg shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="size-4 fill-current" />
                  <span>
                    {language === 'ar' ? 'مشاهدة الآن' : language === 'fr' ? 'Regarder' : 'Watch Now'}
                  </span>
                </Link>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleReroll}
                  disabled={isRolling}
                  className="gap-2 border-line hover:border-accent"
                >
                  <RefreshCw className={isRolling ? 'size-4 animate-spin' : 'size-4'} />
                  <span>
                    {language === 'ar' ? 'اقتراح آخر' : language === 'fr' ? 'Autre idée' : 'Pick Another'}
                  </span>
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
