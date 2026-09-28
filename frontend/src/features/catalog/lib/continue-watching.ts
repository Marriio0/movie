import { useSyncExternalStore } from 'react';
import type { MediaType } from '@/shared/types/media';

export interface ContinueWatchingItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  year: number | null;
  season?: number;
  episode?: number;
  updatedAt: number;
}

const STORAGE_KEY = 'netfarjo:continue-watching';
const MAX_ITEMS = 12;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

let cachedRaw: string | null = null;
let cachedItems: ContinueWatchingItem[] = [];
const SERVER_SNAPSHOT: ContinueWatchingItem[] = [];

export function getContinueWatching(): ContinueWatchingItem[] {
  try {
    if (typeof window === 'undefined') return SERVER_SNAPSHOT;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedItems;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedItems = [];
      return cachedItems;
    }
    const parsed = JSON.parse(raw);
    cachedItems = Array.isArray(parsed) ? parsed : [];
    return cachedItems;
  } catch {
    cachedItems = [];
    return cachedItems;
  }
}

export function saveContinueWatching(item: Omit<ContinueWatchingItem, 'updatedAt'>): void {
  try {
    const list = getContinueWatching();
    // Remove if already exists to push to front
    const filtered = list.filter((i) => !(i.id === item.id && i.mediaType === item.mediaType));
    const updated: ContinueWatchingItem = {
      ...item,
      updatedAt: Date.now(),
    };
    const next = [updated, ...filtered].slice(0, MAX_ITEMS);
    const nextRaw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, nextRaw);
    cachedRaw = nextRaw;
    cachedItems = next;
    notify();
  } catch {
    // localStorage may be disabled
  }
}

export function removeContinueWatching(mediaType: MediaType, id: number): void {
  try {
    const list = getContinueWatching();
    const next = list.filter((i) => !(i.id === id && i.mediaType === mediaType));
    const nextRaw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, nextRaw);
    cachedRaw = nextRaw;
    cachedItems = next;
    notify();
  } catch {
    // localStorage may be disabled
  }
}

export const continueWatchingStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): ContinueWatchingItem[] {
    return getContinueWatching();
  },
  getServerSnapshot(): ContinueWatchingItem[] {
    return SERVER_SNAPSHOT;
  },
};

export function useContinueWatching() {
  const items = useSyncExternalStore(
    continueWatchingStore.subscribe,
    continueWatchingStore.getSnapshot,
    continueWatchingStore.getServerSnapshot,
  );

  return {
    items,
    remove: removeContinueWatching,
  };
}
