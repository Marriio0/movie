import { useNavigation } from 'react-router';
import { cn } from '@/shared/lib/cn';

/**
 * Thin amber bar at the top while a lazy route chunk loads. The 150ms delay keeps it
 * hidden on fast navigations.
 */
export function NavigationProgress() {
  const busy = useNavigation().state !== 'idle';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-(--z-toast) h-0.5 origin-left bg-accent',
        busy
          ? 'animate-progress opacity-100 transition-opacity delay-150'
          : 'opacity-0 transition-opacity duration-(--dur-3)',
      )}
    />
  );
}
