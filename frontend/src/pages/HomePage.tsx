import { usePopular } from '@/features/catalog/catalog.hooks';
import type { MediaSummary } from '@/features/catalog/catalog.types';
import { HeroBillboard, HeroBillboardSkeleton } from '@/features/catalog/components/HeroBillboard';
import { MediaRail } from '@/features/catalog/components/MediaRail';
import { paths } from '@/shared/config/paths';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

const hasBackdrop = (media: MediaSummary): media is MediaSummary & { backdropPath: string } =>
  media.backdropPath !== null;

export function HomePage() {
  useDocumentTitle();
  const movies = usePopular('movie');
  const series = usePopular('tv');
  const online = useOnlineStatus();
  // No trending endpoint exists yet, so the hero features the top popular movie with artwork.
  const featured = movies.data?.items.find(hasBackdrop);

  return (
    <>
      <h1 className="sr-only">Discover popular movies and series</h1>
      {movies.isPending && online ? (
        <HeroBillboardSkeleton />
      ) : (
        featured && <HeroBillboard media={featured} />
      )}
      <div className="container-page space-y-12 py-(--section-y) sm:space-y-14">
        <MediaRail title="Popular movies" href={paths.movies} query={movies} />
        <MediaRail title="Popular series" href={paths.series} query={series} />
      </div>
    </>
  );
}
