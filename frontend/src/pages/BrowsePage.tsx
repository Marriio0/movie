import { Film, Loader2, Sparkles, Tv } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { usePopular } from '@/features/catalog/catalog.hooks';
import type { MediaSummary } from '@/features/catalog/catalog.types';
import { MediaGrid } from '@/features/catalog/components/MediaGrid';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useLanguage } from '@/shared/i18n/language-context';
import type { MediaType } from '@/shared/types/media';
import { Button } from '@/shared/ui/Button';

const COPY: Record<MediaType, { title: string; noun: string }> = {
  movie: { title: 'Movies', noun: 'movies' },
  tv: { title: 'Series', noun: 'series' },
};

function Browse({ mediaType }: { mediaType: MediaType }) {
  const { title, noun } = COPY[mediaType];
  const { t } = useLanguage();
  useDocumentTitle(title);
  const query = usePopular(mediaType);

  // Paginated extra items for infinite browsing
  const [extraItems, setExtraItems] = useState<MediaSummary[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Reset pagination state when media type changes
  useEffect(() => {
    setExtraItems([]);
    setPage(1);
    setHasMore(true);
  }, [mediaType]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await catalogApi.popularPaged(mediaType, nextPage);
      if (!res.items || res.items.length === 0) {
        setHasMore(false);
      } else {
        setExtraItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const queryIds = new Set(query.data?.items.map((i) => i.id) ?? []);
          const fresh = res.items.filter((i) => !existingIds.has(i.id) && !queryIds.has(i.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        if (res.totalPages && nextPage >= res.totalPages) {
          setHasMore(false);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, mediaType, query.data?.items]);

  // Infinite scroll trigger via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || query.isPending || query.isError) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '500px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, query.isPending, query.isError]);

  const allItems = [...(query.data?.items ?? []), ...extraItems];

  return (
    <div className="container-page py-(--section-y)">
      <header className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Sparkles className="size-3.5" />
          <span>Unlimited Streaming Catalog</span>
        </div>
        <h1 className="font-display text-display-md text-fg">{title}</h1>
        <p className="text-fg-muted">
          {mediaType === 'tv'
            ? 'Browse the latest and most popular series in high quality with full seasons.'
            : 'The latest blockbuster movies available in the highest quality.'}
        </p>
      </header>

      <div className="mt-8 sm:mt-10">
        <MediaGrid
          query={query}
          items={allItems}
          errorTitle={`Couldn’t load popular ${noun}`}
          empty={{
            icon: mediaType === 'movie' ? Film : Tv,
            title: `No ${noun} to show right now`,
            description: 'Please check back later.',
          }}
          footer={
            query.data && query.data.items.length > 0 && (
              <div className="mt-12 flex flex-col items-center justify-center space-y-4">
                {/* Intersection Sentinel element */}
                <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />

                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-fg-muted">
                    <Loader2 className="size-5 animate-spin text-accent" />
                    <span>{t('loading')}</span>
                  </div>
                ) : hasMore ? (
                  <Button
                    variant="secondary"
                    onClick={() => void loadMore()}
                    className="h-10 px-6 text-xs font-bold text-fg ring-1 ring-line hover:bg-surface-2"
                  >
                    <span>{t('loadMore')}</span>
                  </Button>
                ) : (
                  <span className="text-xs text-fg-subtle">{t('noMoreResults')}</span>
                )}
              </div>
            )
          }
        />
      </div>
    </div>
  );
}

export function MoviesBrowsePage() {
  return <Browse mediaType="movie" />;
}

export function SeriesBrowsePage() {
  return <Browse mediaType="tv" />;
}
