import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

/**
 * Bottom notice while the browser is offline. The live region is always mounted, so screen
 * readers announce the message when it appears.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex justify-center px-(--gutter) pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {!online && (
        <p className="pointer-events-auto flex max-w-full animate-pop-in items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm text-fg shadow-pop ring-1 ring-line-strong">
          <WifiOff aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
          <span>You’re offline. Showing saved content where available.</span>
        </p>
      )}
    </div>
  );
}
