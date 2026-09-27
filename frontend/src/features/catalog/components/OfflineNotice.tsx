import { WifiOff } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { EmptyState } from '@/shared/ui/EmptyState';

/**
 * Shown instead of a skeleton when a query is paused because the browser is offline and nothing
 * is cached. TanStack Query resumes it automatically on reconnect.
 */
export function OfflineNotice({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <p
        className={cn(
          'flex items-center gap-3 rounded-lg border border-line bg-surface-1 px-4 py-3 text-sm text-fg-muted',
          className,
        )}
      >
        <WifiOff aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
        You’re offline. This will load when you reconnect.
      </p>
    );
  }
  return (
    <EmptyState
      icon={WifiOff}
      title="You’re offline"
      description="This will load automatically when you reconnect."
      className={className}
    />
  );
}
