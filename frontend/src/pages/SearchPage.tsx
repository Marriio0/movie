import { Search, SearchX, Sparkles, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MIN_SEARCH_LENGTH, useTitleSearch, useTrendingToday } from '@/features/catalog/catalog.hooks';
import { MediaGrid } from '@/features/catalog/components/MediaGrid';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { EmptyState } from '@/shared/ui/EmptyState';
import { IconButton } from '@/shared/ui/IconButton';

const DEBOUNCE_MS = 300;

/**
 * The URL (?q=) is the source of truth for what is searched; the input is local state that
 * writes to the URL after a pause in typing. Back/forward updates the input.
 */
function useSearchQuery() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q')?.trim() ?? '';

  const [text, setText] = useState(urlQuery);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  const debounced = useDebouncedValue(text.trim(), DEBOUNCE_MS);

  // The URL changed. If it already matches the input, this was our own write; otherwise it came
  // from outside (back/forward, a link), so show that query.
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    if (urlQuery !== text.trim()) setText(urlQuery);
  }

  // Latest values for the write effect below. setParams changes identity on every URL change,
  // so depending on it would re-run the effect after back/forward and write stale text back.
  const latest = useRef({ urlQuery, setParams });
  useEffect(() => {
    latest.current = { urlQuery, setParams };
  }, [urlQuery, setParams]);

  // Typing settled: write it to the URL. Replace, so each keystroke is not a history entry.
  useEffect(() => {
    if (debounced === latest.current.urlQuery) return;
    latest.current.setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced]);

  return { text, setText, query: urlQuery };
}

export function SearchPage() {
  const { text, setText, query } = useSearchQuery();
  const search = useTitleSearch(query);
  const trending = useTrendingToday();
  const inputId = useId();
  const ready = query.length >= MIN_SEARCH_LENGTH;
  useDocumentTitle(ready ? `Search: ${query}` : 'Search');

  const count = search.data?.items.length ?? 0;
  const announcement =
    !ready || search.isPending || search.isPlaceholderData
      ? ''
      : search.isError
        ? 'Search failed.'
        : count === 0
          ? `No matches for ${query}.`
          : `${count} ${count === 1 ? 'match' : 'matches'} for ${query}.`;

  return (
    <div className="container-page py-(--section-y)">
      <header className="space-y-1">
        <h1 className="font-display text-display-md text-fg">Search</h1>
        <p className="text-xs text-fg-muted">Search for any movie or series, or pick from today's trending titles below</p>
      </header>

      <form role="search" className="mt-6 max-w-2xl" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={inputId} className="sr-only">
          Search movies and series
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id={inputId}
            type="search"
            value={text}
            autoFocus
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && text) {
                event.preventDefault();
                setText('');
              }
            }}
            placeholder="Search movies and series"
            autoComplete="off"
            enterKeyHint="search"
            spellCheck={false}
            className="h-14 w-full rounded-lg bg-surface-1 pr-14 pl-12 text-base text-fg shadow-card ring-1 ring-line-strong transition-shadow outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <IconButton
              label="Clear search"
              size="sm"
              className="absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setText('')}
            >
              <X aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </form>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="mt-10">
        {ready ? (
          <MediaGrid
            query={search}
            showType
            errorTitle="Search failed"
            header={
              <h2 className="mb-6 text-lg font-semibold tracking-tight text-fg">
                Top matches for “{query}”
              </h2>
            }
            empty={{
              icon: SearchX,
              title: `No matches for “${query}”`,
              description: 'Check the spelling, or try the original title.',
            }}
          />
        ) : (
          <div className="space-y-8">
            <EmptyState
              icon={Search}
              title="Find a movie or series"
              description={
                text.trim().length > 0
                  ? `Keep typing: searches start at ${MIN_SEARCH_LENGTH} characters.`
                  : 'Search by title. Results include both movies and series.'
              }
            />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-fg">
                <Sparkles className="size-4 text-accent" />
                <h2 className="text-base font-bold sm:text-lg">
                  Trending Titles
                </h2>
              </div>
              <MediaGrid
                query={trending}
                showType
                errorTitle="Couldn’t load suggestions"
                empty={{
                  icon: Search,
                  title: 'No suggestions available',
                  description: 'Search by title above.',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
