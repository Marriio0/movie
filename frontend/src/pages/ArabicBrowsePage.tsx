import { Clapperboard, Loader2, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import {
  useArabicClassic,
  useArabicEgyptian,
  useArabicMoroccan,
  useArabicMoroccanSeries,
  useArabicSeries,
  useArabicTrending,
} from '@/features/catalog/catalog.hooks';
import type { MediaSummary } from '@/features/catalog/catalog.types';
import { MediaGrid } from '@/features/catalog/components/MediaGrid';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useLanguage } from '@/shared/i18n/language-context';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';

type ArabicCategory = 'all' | 'moroccan' | 'moroccan-series' | 'egyptian' | 'classic' | 'trending' | 'series';

const ARABIC_CATEGORIES = [
  { id: 'all' as ArabicCategory, en: '🌟 All Arabic (10,000+)', ar: '🌟 الكل (أكثر من 10,000 عمل)', fr: '🌟 Tout (10 000+)' },
  { id: 'moroccan' as ArabicCategory, en: '🇲🇦 Moroccan Movies', ar: '🇲🇦 أفلام مغربية', fr: '🇲🇦 Films Marocains' },
  { id: 'moroccan-series' as ArabicCategory, en: '📺 Moroccan Series', ar: '📺 مسلسلات مغربية', fr: '📺 Séries Marocaines' },
  { id: 'egyptian' as ArabicCategory, en: '🇪🇬 Egyptian Hits', ar: '🇪🇬 سينما مصرية', fr: '🇪🇬 Cinéma Égyptien' },
  { id: 'classic' as ArabicCategory, en: '🎬 Golden Age Classics', ar: '🎬 كلاسيكيات الزمن الجميل', fr: '🎬 Grands Classiques' },
  { id: 'trending' as ArabicCategory, en: '✨ Trending Arabic', ar: '✨ أقوى الأعمال العربية', fr: '✨ Tendances Arabes' },
  { id: 'series' as ArabicCategory, en: '📺 Arabic TV Series', ar: '📺 مسلسلات عربية', fr: '📺 Séries Arabes' },
];

export function ArabicBrowsePage() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCat = searchParams.get('category') as ArabicCategory | null;
  const initialCategory: ArabicCategory =
    rawCat && ['all', 'moroccan', 'moroccan-series', 'egyptian', 'classic', 'trending', 'series'].includes(rawCat)
      ? rawCat
      : 'all';

  const [activeCategory, setActiveCategory] = useState<ArabicCategory>(initialCategory);

  const title =
    language === 'ar'
      ? 'سينما وأعمال عربية'
      : language === 'fr'
        ? 'Cinéma & Séries Arabes'
        : 'Arabic Cinema & Series';

  useDocumentTitle(title);

  // Queries for the different Arabic categories
  const moroccanQuery = useArabicMoroccan(1);
  const moroccanSeriesQuery = useArabicMoroccanSeries(1);
  const egyptianQuery = useArabicEgyptian(1);
  const classicQuery = useArabicClassic(1);
  const trendingQuery = useArabicTrending(1);
  const seriesQuery = useArabicSeries(1);

  // Sync category from URL if changed externally
  useEffect(() => {
    if (rawCat && rawCat !== activeCategory) {
      setActiveCategory(rawCat);
    }
  }, [rawCat]);

  const handleSelectCategory = (cat: ArabicCategory) => {
    setActiveCategory(cat);
    setSearchParams(cat === 'all' ? {} : { category: cat });
    setExtraItems([]);
    setPage(1);
    setHasMore(true);
  };

  // Pagination for infinite scrolling
  const [extraItems, setExtraItems] = useState<MediaSummary[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Active query based on selected category
  const activeQuery = useMemo(() => {
    switch (activeCategory) {
      case 'moroccan':
        return moroccanQuery;
      case 'moroccan-series':
        return moroccanSeriesQuery;
      case 'egyptian':
        return egyptianQuery;
      case 'classic':
        return classicQuery;
      case 'trending':
        return trendingQuery;
      case 'series':
        return seriesQuery;
      case 'all':
      default:
        return trendingQuery;
    }
  }, [activeCategory, moroccanQuery, moroccanSeriesQuery, egyptianQuery, classicQuery, trendingQuery, seriesQuery]);

  // Combine results for 'all' or display selected category
  const baseItems = useMemo(() => {
    if (activeCategory === 'all') {
      const combined: MediaSummary[] = [];
      const seen = new Set<string>();

      const addItems = (list?: MediaSummary[]) => {
        if (!list) return;
        for (const item of list) {
          const key = `${item.mediaType}:${item.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(item);
          }
        }
      };

      // In 'all', interleave Moroccan hits, series, Egyptian classics, and trending Arabic
      addItems(moroccanQuery.data?.items);
      addItems(moroccanSeriesQuery.data?.items);
      addItems(classicQuery.data?.items);
      addItems(trendingQuery.data?.items);
      addItems(egyptianQuery.data?.items);
      addItems(seriesQuery.data?.items);
      return combined;
    }

    return activeQuery.data?.items ?? [];
  }, [
    activeCategory,
    activeQuery.data?.items,
    moroccanQuery.data?.items,
    moroccanSeriesQuery.data?.items,
    classicQuery.data?.items,
    trendingQuery.data?.items,
    egyptianQuery.data?.items,
    seriesQuery.data?.items,
  ]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      let freshItems: MediaSummary[] = [];
      let reachedEnd = false;

      if (activeCategory === 'moroccan') {
        const res = await catalogApi.arabicMoroccan(nextPage);
        freshItems = res.items || [];
        reachedEnd = !!(res.totalPages && nextPage >= res.totalPages);
      } else if (activeCategory === 'moroccan-series') {
        const res = await catalogApi.arabicMoroccanSeries(nextPage);
        freshItems = res.items || [];
        reachedEnd = !!(res.totalPages && nextPage >= res.totalPages);
      } else if (activeCategory === 'egyptian') {
        const res = await catalogApi.arabicEgyptian(nextPage);
        freshItems = res.items || [];
        reachedEnd = !!(res.totalPages && nextPage >= res.totalPages);
      } else if (activeCategory === 'classic') {
        const res = await catalogApi.arabicClassic(nextPage);
        freshItems = res.items || [];
        reachedEnd = !!(res.totalPages && nextPage >= res.totalPages);
      } else if (activeCategory === 'series') {
        const res = await catalogApi.arabicSeries(nextPage);
        freshItems = res.items || [];
        reachedEnd = !!(res.totalPages && nextPage >= res.totalPages);
      } else if (activeCategory === 'trending') {
        const res = await catalogApi.arabicTrending(nextPage);
        freshItems = res.items || [];
        reachedEnd = !!(res.totalPages && nextPage >= res.totalPages);
      } else {
        // 'all' category: simultaneously fetch across Moroccan, Egyptian, Series, and Trending
        const [morRes, egRes, serRes, trendRes] = await Promise.allSettled([
          catalogApi.arabicMoroccan(nextPage),
          catalogApi.arabicEgyptian(nextPage),
          catalogApi.arabicSeries(nextPage),
          catalogApi.arabicTrending(nextPage),
        ]);

        const gathered: MediaSummary[] = [];
        if (morRes.status === 'fulfilled' && morRes.value.items) gathered.push(...morRes.value.items);
        if (egRes.status === 'fulfilled' && egRes.value.items) gathered.push(...egRes.value.items);
        if (serRes.status === 'fulfilled' && serRes.value.items) gathered.push(...serRes.value.items);
        if (trendRes.status === 'fulfilled' && trendRes.value.items) gathered.push(...trendRes.value.items);
        freshItems = gathered;
        // TMDB allows up to 500 pages of Arabic titles (thousands of titles)
        reachedEnd = nextPage >= 500 || freshItems.length === 0;
      }

      if (freshItems.length === 0) {
        setHasMore(false);
      } else {
        setExtraItems((prev) => {
          const existingIds = new Set(prev.map((i) => `${i.mediaType}:${i.id}`));
          const baseIds = new Set(baseItems.map((i) => `${i.mediaType}:${i.id}`));
          const deduped = freshItems.filter(
            (i) => !existingIds.has(`${i.mediaType}:${i.id}`) && !baseIds.has(`${i.mediaType}:${i.id}`),
          );
          return [...prev, ...deduped];
        });
        setPage(nextPage);
        if (reachedEnd) {
          setHasMore(false);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, activeCategory, baseItems]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || activeQuery.isPending || activeQuery.isError) return;
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
  }, [loadMore, hasMore, activeQuery.isPending, activeQuery.isError]);

  const allDisplayedItems = [...baseItems, ...extraItems];

  return (
    <div className="container-page py-(--section-y)">
      <header className="max-w-3xl space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Sparkles className="size-3.5" />
            <span>🇲🇦 🇪🇬 🌟 {language === 'ar' ? 'باقة السينما والدراما العربية' : 'Arabic Cinema & Series Collection'}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <span>⚡ {language === 'ar' ? '+10,000 فيلم ومسلسل متوفر' : '10,000+ Titles Available'}</span>
          </div>
        </div>
        <h1 className="font-display text-display-md text-fg">{title}</h1>
        <p className="text-fg-muted">
          {language === 'ar'
            ? 'مكتبة شاملة تضم أكثر من 10,000 فيلم ومسلسل مغربي ومصري وعربي، مع تحديث فوري وسيرفرات مشاهدة مباشرة بجودة عالية وترجمة مدمجة.'
            : 'Explore the massive catalog of over 10,000 Moroccan, Egyptian, and Arabic movies and TV series with direct fast streaming and subtitles.'}
        </p>
      </header>

      {/* Arabic Filter Pills Bar */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ARABIC_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const label = language === 'ar' ? cat.ar : language === 'fr' ? cat.fr : cat.en;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={cn(
                'flex-none rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer',
                isSelected
                  ? 'bg-amber-500 text-black font-bold shadow-amber-500/30 scale-105'
                  : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg border border-line',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-10">
        <MediaGrid
          query={activeQuery}
          items={allDisplayedItems}
          errorTitle="Couldn’t load Arabic titles"
          empty={{
            icon: Clapperboard,
            title: language === 'ar' ? 'لا توجد أعمال في هذا القسم حالياً' : 'No titles found in this category',
            description: language === 'ar' ? 'يرجى مراجعة الأقسام الأخرى أو المحاولة لاحقاً.' : 'Please try another category or check back later.',
          }}
          footer={
            allDisplayedItems.length > 0 && (
              <div className="mt-12 flex flex-col items-center justify-center space-y-4">
                <div ref={sentinelRef} className="h-6 w-full" aria-hidden="true" />

                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-fg-muted">
                    <Loader2 className="size-5 animate-spin text-amber-400" />
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
