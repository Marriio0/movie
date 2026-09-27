import { Play, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useState } from 'react';
import type { MediaType } from '@/shared/types/media';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useTitleTrailer } from '../catalog.hooks';
import { youtubeEmbedUrl } from '../lib/youtube';

export interface TrailerButtonProps {
  mediaType: MediaType;
  id: number;
  title: string;
}

/**
 * "Watch trailer" button that plays the title's YouTube trailer in a dialog, with captions on.
 * Renders nothing when TMDB has no trailer (or the lookup fails): the trailer is optional.
 */
export function TrailerButton({ mediaType, id, title }: TrailerButtonProps) {
  const query = useTitleTrailer(mediaType, id);
  const [open, setOpen] = useState(false);

  if (query.isPending) return <Skeleton className="h-12 w-44" />;
  const trailer = query.data;
  if (!trailer) return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="lg">
          <Play aria-hidden="true" className="fill-current" />
          Watch {trailer.kind}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-black/85 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) w-[min(64rem,calc(100vw-2*var(--gutter)))] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in">
          <div className="mb-3 flex items-center justify-between gap-4">
            <Dialog.Title className="truncate text-sm font-medium text-white">
              {trailer.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton
                label="Close trailer"
                className="text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {`Trailer for ${title}, played from YouTube. Captions are shown when the video has them.`}
          </Dialog.Description>
          <div className="aspect-video overflow-hidden rounded-lg bg-black shadow-pop">
            {open && (
              <iframe
                src={youtubeEmbedUrl(trailer.youtubeKey)}
                title={`${trailer.name} (YouTube video player)`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="size-full"
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
