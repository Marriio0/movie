import { Clock, Play, X } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/shared/i18n/language-context';
import { paths } from '@/shared/config/paths';
import { useContinueWatching, type ContinueWatchingItem } from '../lib/continue-watching';

export function ContinueWatchingRail() {
  const { items, remove } = useContinueWatching();
  const { language } = useLanguage();

  if (!items || items.length === 0) return null;

  return (
    <section
      aria-label="Continue Watching"
      className="container-page py-6 animate-fade-in"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-accent/20 text-accent">
            <Clock className="size-4" />
          </div>
          <h2 className="text-lg font-bold text-fg tracking-tight">
            {language === 'ar'
              ? 'كمّل الفرجة'
              : language === 'fr'
                ? 'Reprendre la lecture'
                : 'Continue Watching'}
          </h2>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-fg-muted">
            {items.length}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item: ContinueWatchingItem) => {
          const targetUrl =
            item.mediaType === 'movie'
              ? `${paths.title(item.mediaType, item.id)}#watch-player`
              : `${paths.title(item.mediaType, item.id)}?season=${item.season || 1}&episode=${item.episode || 1}#watch-player`;

          const imageUrl = item.backdropPath
            ? `https://image.tmdb.org/t/p/w500${item.backdropPath}`
            : item.posterPath
              ? `https://image.tmdb.org/t/p/w500${item.posterPath}`
              : null;

          return (
            <div
              key={`${item.mediaType}:${item.id}`}
              className="group relative flex-none w-56 sm:w-64 overflow-hidden rounded-xl border border-line bg-surface-2 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-xl"
            >
              {/* Thumbnail Container */}
              <Link to={targetUrl} className="block relative aspect-video w-full overflow-hidden bg-surface-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-surface-3 text-fg-muted text-xs">
                    {item.title}
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-colors group-hover:from-black/75" />

                {/* Hover Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-black/50 transition-all duration-300 group-hover:scale-110">
                    <Play className="size-4.5 fill-current translate-x-0.5" />
                  </div>
                </div>

                {/* Progress bar line simulating resume state */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <div className="h-full bg-accent shadow-sm" style={{ width: '68%' }} />
                </div>
              </Link>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(item.mediaType, item.id);
                }}
                className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 backdrop-blur-md transition hover:bg-black hover:text-white group-hover:opacity-100"
                title="Remove from history"
                aria-label="Remove from history"
              >
                <X className="size-3.5" />
              </button>

              {/* Title & Metadata */}
              <div className="p-3">
                <Link to={targetUrl} className="block">
                  <h3 className="line-clamp-1 text-sm font-bold text-fg transition-colors group-hover:text-accent">
                    {item.title}
                  </h3>
                </Link>
                <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
                  <span>
                    {item.mediaType === 'movie'
                      ? (language === 'ar' ? 'فيلم' : language === 'fr' ? 'Film' : 'Movie')
                      : `S${item.season || 1} • Ep ${item.episode || 1}`}
                  </span>
                  {item.rating !== null && (
                    <span className="font-semibold text-amber-500 dark:text-amber-400">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
