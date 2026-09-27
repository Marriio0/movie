import type { UseQueryResult } from '@tanstack/react-query';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

/**
 * True while a query has no data because the browser is offline.
 *
 * `fetchStatus === 'paused'` alone does not mean offline: TanStack Query also pauses retries while
 * the tab is hidden (focusManager) and resumes them when it becomes visible again. Those pauses
 * keep showing the loading state rather than an offline message.
 */
export function useWaitingForNetwork(
  query: Pick<UseQueryResult, 'isPending' | 'fetchStatus'>,
): boolean {
  const online = useOnlineStatus();
  return !online && query.isPending && query.fetchStatus === 'paused';
}
