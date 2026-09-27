import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// TanStack Query's onlineManager already tracks online/offline events and pauses queries while
// offline. Reading it here keeps the UI and the query layer on one source of truth.
const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getSnapshot = () => onlineManager.isOnline();

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
