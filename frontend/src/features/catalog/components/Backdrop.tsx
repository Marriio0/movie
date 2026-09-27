import { cn } from '@/shared/lib/cn';
import { TmdbImage } from './TmdbImage';

/**
 * Decorative backdrop that blends into the page in both themes:
 * - CSS masks fade the image's edges into the page background.
 * - A scrim in the canvas color sits behind any overlapping text (bottom on phones, left on
 *   md+), so body text keeps its token contrast whatever the image shows. In light mode the
 *   scrim is paper-colored, so dark text never lands on a dark photo.
 * Phones: full-width 16:9 image. md+: right-aligned image behind the text column.
 */
export function Backdrop({ path, className }: { path: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none relative aspect-video w-full overflow-hidden',
        '[mask-image:linear-gradient(to_top,transparent,black_55%)]',
        'md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[72%]',
        'md:[mask-image:linear-gradient(to_right,transparent,black_45%),linear-gradient(to_top,transparent,black_35%)] md:[mask-composite:intersect]',
        className,
      )}
    >
      <TmdbImage
        path={path}
        kind="backdrop"
        alt=""
        sizes="(min-width: 768px) 72vw, 100vw"
        priority
      />
      <div className="absolute inset-0 bg-linear-to-t from-canvas from-10% via-canvas/60 via-40% to-transparent md:bg-linear-to-r md:from-canvas/95 md:from-15% md:via-canvas/75 md:via-55% md:to-canvas/10" />
    </div>
  );
}
