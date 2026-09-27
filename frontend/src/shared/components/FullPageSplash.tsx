import { APP_NAME } from '@/shared/config/app';
import { LogoMark } from './Logo';

/** Shown only while the app shell or the first lazy route loads. */
export function FullPageSplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas">
      <div role="status" className="flex flex-col items-center gap-3">
        <LogoMark className="size-10 animate-pulse-soft text-accent motion-reduce:animate-none" />
        <span className="sr-only">Loading {APP_NAME}</span>
      </div>
    </div>
  );
}
