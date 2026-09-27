/**
 * Theme preference store: a tiny external store read with useSyncExternalStore.
 * It is the app's only client-side global state that isn't server data or URL state,
 * which is why there is no state library.
 *
 * The inline script in index.html applies the saved theme before first paint.
 * Keep THEME_STORAGE_KEY, DEFAULT_THEME and THEME_COLORS in sync with it.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeSnapshot {
  preference: ThemePreference;
  resolved: ResolvedTheme;
}

export const THEME_STORAGE_KEY = 'marquee:theme';
export const DEFAULT_THEME: ThemePreference = 'dark';

const THEME_COLORS: Record<ResolvedTheme, string> = { dark: '#0b0b0d', light: '#f6f4ef' };
const LIGHT_QUERY = '(prefers-color-scheme: light)';

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // storage blocked (private mode, sandboxed iframe)
  }
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
}

function applyToDocument(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolved]);
}

function createSnapshot(preference: ThemePreference): ThemeSnapshot {
  return { preference, resolved: resolve(preference) };
}

const listeners = new Set<() => void>();
let snapshot: ThemeSnapshot = createSnapshot(readStoredPreference());
applyToDocument(snapshot.resolved);

function commit(preference: ThemePreference): void {
  const next = createSnapshot(preference);
  if (next.preference === snapshot.preference && next.resolved === snapshot.resolved) return;
  snapshot = next;
  applyToDocument(next.resolved);
  listeners.forEach((listener) => listener());
}

const onSystemChange = () => {
  if (snapshot.preference === 'system') commit('system');
};

// Keeps several open tabs in sync.
const onStorage = (event: StorageEvent) => {
  if (event.key === THEME_STORAGE_KEY)
    commit(isThemePreference(event.newValue) ? event.newValue : DEFAULT_THEME);
};

export const themeStore = {
  getSnapshot: (): ThemeSnapshot => snapshot,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (listeners.size === 1) {
      window.matchMedia(LIGHT_QUERY).addEventListener('change', onSystemChange);
      window.addEventListener('storage', onStorage);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.matchMedia(LIGHT_QUERY).removeEventListener('change', onSystemChange);
        window.removeEventListener('storage', onStorage);
      }
    };
  },

  setPreference(preference: ThemePreference): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Not persisted, but still applied for this session.
    }
    commit(preference);
  },
};
