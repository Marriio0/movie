import { Film, Tv } from 'lucide-react';
import { usePopular } from '@/features/catalog/catalog.hooks';
import { MediaGrid } from '@/features/catalog/components/MediaGrid';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { MediaType } from '@/shared/types/media';

const COPY: Record<MediaType, { title: string; noun: string }> = {
  movie: { title: 'Movies', noun: 'movies' },
  tv: { title: 'Series', noun: 'series' },
};

function Browse({ mediaType }: { mediaType: MediaType }) {
  const { title, noun } = COPY[mediaType];
  useDocumentTitle(title);
  const query = usePopular(mediaType);

  return (
    <div className="container-page py-(--section-y)">
      <header className="max-w-2xl">
        <h1 className="font-display text-display-md text-fg">{title}</h1>
        <p className="mt-2 text-fg-muted">The most popular {noun} on TMDB right now.</p>
      </header>
      <div className="mt-8 sm:mt-10">
        <MediaGrid
          query={query}
          errorTitle={`Couldn’t load popular ${noun}`}
          empty={{
            icon: mediaType === 'movie' ? Film : Tv,
            title: `No ${noun} to show right now`,
            description: 'Please check back later.',
          }}
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
