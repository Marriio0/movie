import { useSyncExternalStore } from 'react';
import { themeStore, type ThemePreference, type ThemeSnapshot } from './theme-store';

export interface UseThemeResult extends ThemeSnapshot {
  setPreference: (preference: ThemePreference) => void;
}

export function useTheme(): UseThemeResult {
  const snapshot = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot);
  return { ...snapshot, setPreference: themeStore.setPreference };
}
