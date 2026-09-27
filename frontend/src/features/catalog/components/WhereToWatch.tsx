import { ExternalLink } from 'lucide-react';
import { useId, useState } from 'react';
import { regionName } from '@/shared/lib/format';
import type { MediaType } from '@/shared/types/media';
import { ErrorState } from '@/shared/ui/ErrorState';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useWatchProviders } from '../catalog.hooks';
import type { RegionOffers, WatchProvider } from '../catalog.types';
import { OfflineNotice } from './OfflineNotice';
import { useWaitingForNetwork } from './query-state';
import { TmdbImage } from './TmdbImage';

export const WHERE_TO_WATCH_ID = 'where-to-watch';

const REGION_STORAGE_KEY = 'marquee:watch-region';
/** Default country order when the viewer has not picked one. Morocco first, then fallbacks. */
const PREFERRED_REGIONS = ['MA', 'FR', 'US'];

const GROUPS: { key: keyof Omit<RegionOffers, 'link'>; label: string }[] = [
  { key: 'stream', label: 'Stream' },
  { key: 'free', label: 'Free' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

function readStoredRegion(): string | null {
  try {
    return localStorage.getItem(REGION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeRegion(region: string): void {
  try {
    localStorage.setItem(REGION_STORAGE_KEY, region);
  } catch {
    // Not remembered, but still applied for this page.
  }
}

function ProviderList({ providers, link }: { providers: WatchProvider[]; link: string }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {providers.map((provider) => (
        <li key={provider.id}>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            title={provider.name}
            className="block size-12 overflow-hidden rounded-lg bg-surface-3 ring-1 ring-line transition-transform duration-(--dur-2) hover:-translate-y-0.5 motion-reduce:transform-none"
          >
            <TmdbImage path={provider.logoPath} kind="logo" alt={provider.name} sizes="48px" />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Legal places to stream, rent or buy the title in the chosen country (TMDB data by JustWatch).
 * Only countries with offers are selectable; the choice is remembered in this browser.
 */
export function WhereToWatch({ mediaType, id }: { mediaType: MediaType; id: number }) {
  const query = useWatchProviders(mediaType, id);
  const offline = useWaitingForNetwork(query);
  const headingId = useId();
  const selectId = useId();
  const [chosen, setChosen] = useState<string | null>(readStoredRegion);

  const regions = query.data?.regions ?? [];
  const wanted = chosen ?? PREFERRED_REGIONS[0]!;
  const region = regions.includes(wanted)
    ? wanted
    : (PREFERRED_REGIONS.find((code) => regions.includes(code)) ?? regions[0]);
  const offers = region ? query.data?.byRegion[region] : undefined;

  const picker = regions.length > 0 && region && (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={selectId} className="text-fg-muted">
        Country
      </label>
      <select
        id={selectId}
        value={region}
        onChange={(event) => {
          setChosen(event.target.value);
          storeRegion(event.target.value);
        }}
        className="h-9 max-w-44 rounded-md bg-surface-1 px-2 text-sm text-fg ring-1 ring-line-strong outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {regions
          .map((code) => ({ code, name: regionName(code) }))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
      </select>
    </div>
  );

  return (
    <section id={WHERE_TO_WATCH_ID} aria-labelledby={headingId} className="scroll-mt-(--nav-h)">
      <SectionHeader id={headingId} title="Where to watch" action={picker} />
      <div className="mt-5">
        {offline ? (
          <OfflineNotice compact />
        ) : query.isPending ? (
          <div aria-busy="true" aria-label="Loading where to watch" className="flex gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-12 rounded-lg" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            compact
            title="Couldn’t load where to watch"
            description={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : !offers || !region ? (
          <p className="text-sm text-fg-muted">
            No streaming, rental or purchase offers are listed for this title yet.
          </p>
        ) : (
          <>
            {region !== wanted && (
              <p className="mb-4 text-sm text-fg-muted">
                No offers listed for {regionName(wanted)}. Showing {regionName(region)}.
              </p>
            )}
            <dl className="space-y-5">
              {GROUPS.filter(({ key }) => offers[key].length > 0).map(({ key, label }) => (
                <div key={key} className="grid gap-2 sm:grid-cols-[5rem_1fr] sm:items-center">
                  <dt className="text-sm font-medium text-fg-muted">{label}</dt>
                  <dd>
                    <ProviderList providers={offers[key]} link={offers.link} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-subtle">
              <a
                href={offers.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-fg-muted underline-offset-2 hover:text-fg hover:underline"
              >
                All options in {regionName(region)}
                <ExternalLink aria-hidden="true" className="size-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <span>Availability data by JustWatch.</span>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
