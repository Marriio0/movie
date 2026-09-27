import { Film, Loader2, Search, Star, Tv, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import type { MediaSummary } from '@/features/catalog/catalog.types';
import { tmdbImageUrl } from '@/features/catalog/lib/tmdb-image';
import { paths } from '@/shared/config/paths';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useLanguage } from '@/shared/i18n/language-context';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/Badge';

export function InstantSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  const { t } = useLanguage();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), 200);

  // Live query execution as user types
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    catalogApi
      .search(debouncedQuery)
      .then((res) => {
        if (active) {
          setResults(res.items.slice(0, 8)); // Top 8 immediate matches
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setResults([]);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsExpandedMobile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: MediaSummary) => {
    setIsOpen(false);
    setIsExpandedMobile(false);
    setQuery('');
    const targetUrl = paths.title(item.mediaType, item.id);
    navigate(targetUrl);
  };

  const handleFullSearch = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    setIsExpandedMobile(false);
    navigate(paths.search(query.trim()));
  };

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Search Input Box */}
      <div
        className="flex w-full items-center rounded-full border border-line/80 bg-surface-2/90 px-2.5 sm:px-3 py-1 sm:py-1.5 transition-all duration-200 backdrop-blur-md focus-within:border-accent focus-within:bg-surface-1 focus-within:ring-2 focus-within:ring-accent/30"
      >
        <Search className="size-4 shrink-0 text-fg-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsExpandedMobile(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleFullSearch();
            } else if (e.key === 'Escape') {
              setIsOpen(false);
              setIsExpandedMobile(false);
            }
          }}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-transparent px-2.5 text-xs text-fg placeholder:text-fg-subtle outline-none"
        />

        {isLoading ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="text-fg-subtle hover:text-fg"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Floating Netflix-Style Live Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          className={cn(
            'absolute top-full mt-2 w-72 sm:w-88 md:w-96 rounded-xl border border-line bg-surface-1/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2',
            // Align start for RTL / LTR dynamically
            'start-0 sm:start-auto sm:end-0',
            isExpandedMobile && 'fixed inset-x-3 top-16 w-auto max-h-[75vh] overflow-y-auto',
          )}
        >
          <div className="flex items-center justify-between border-b border-line/60 px-2.5 py-1.5 text-[11px] font-semibold text-fg-muted">
            <span>{t('instantSearchMatches')}</span>
            <span className="font-mono text-[10px] text-accent">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          <div className="mt-1 max-h-80 overflow-y-auto space-y-1 pr-1">
            {isLoading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-fg-muted">
                <Loader2 className="size-4 animate-spin text-accent" />
                <span>{t('loading')}</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-xs text-fg-muted">
                <p>{t('noResults')}</p>
                <p className="mt-1 text-[11px] text-fg-subtle">تأكد من كتابة اسم الفيلم أو المسلسل بشكل صحيح</p>
              </div>
            ) : (
              results.map((item) => {
                const poster = item.posterPath ? tmdbImageUrl(item.posterPath, 185) : null;
                const isSeries = item.mediaType === 'tv';
                return (
                  <button
                    key={`${item.mediaType}:${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-2.5 rounded-lg p-2 text-start transition-all hover:bg-surface-2 focus-visible:bg-surface-2 outline-none group"
                  >
                    {/* Poster thumbnail */}
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-surface-3 shadow-xs">
                      {poster ? (
                        <img
                          src={poster}
                          alt={item.title}
                          className="size-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-fg-subtle">
                          {isSeries ? <Tv className="size-4" /> : <Film className="size-4" />}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          tone={isSeries ? 'neutral' : 'accent'}
                          className="px-1.5 py-0 text-[9px] font-bold uppercase"
                        >
                          {isSeries ? 'مسلسل' : 'فيلم'}
                        </Badge>
                        {item.year && (
                          <span className="font-mono text-[10px] text-fg-subtle">{item.year}</span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 ms-auto">
                            <Star className="size-2.5 fill-current" />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <p className="truncate text-xs font-semibold text-fg group-hover:text-accent transition-colors mt-0.5">
                        {item.title}
                      </p>
                      {item.overview && (
                        <p className="line-clamp-1 text-[10px] text-fg-muted mt-0.5">
                          {item.overview}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Full Search Footer Action */}
          <div className="border-t border-line/60 pt-1.5 mt-1 px-1">
            <button
              type="button"
              onClick={handleFullSearch}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-surface-2 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-surface-3"
            >
              <Search className="size-3" />
              <span>{t('viewAllResults')} ({query})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
