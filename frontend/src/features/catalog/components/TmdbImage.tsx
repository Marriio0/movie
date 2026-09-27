import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { tmdbDefaultSrc, tmdbSrcSet, type TmdbImageKind } from '../lib/tmdb-image';

export interface TmdbImageProps {
  path: string | null;
  kind: TmdbImageKind;
  /** '' when surrounding text already names the title (cards); otherwise describe the image. */
  alt: string;
  /** The rendered width at each breakpoint, so the browser picks the right rendition. */
  sizes: string;
  /** Above-the-fold images: eager load and high fetch priority. */
  priority?: boolean;
  className?: string;
}

/**
 * Fills its parent, which sets the aspect ratio and background, so nothing shifts while loading.
 * Fades in once loaded; shows a neutral placeholder when TMDB has no image or it fails.
 */
export function TmdbImage({ path, kind, alt, sizes, priority = false, className }: TmdbImageProps) {
  // Keyed by path, so state never leaks between different images in the same slot.
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [failedPath, setFailedPath] = useState<string | null>(null);

  if (!path || failedPath === path) {
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn('grid size-full place-items-center bg-surface-3 text-fg-subtle', className)}
      >
        <ImageOff aria-hidden="true" className="size-6" />
      </div>
    );
  }

  return (
    <img
      src={tmdbDefaultSrc(path, kind)}
      srcSet={tmdbSrcSet(path, kind)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setLoadedPath(path)}
      onError={() => setFailedPath(path)}
      className={cn(
        'size-full object-cover transition-opacity duration-(--dur-4) ease-out',
        loadedPath === path ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  );
}
