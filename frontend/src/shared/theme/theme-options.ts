import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import type { ThemePreference } from './theme-store';

export interface ThemeOption {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}

/** Shared by every theme control so labels and icons stay consistent. */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

export const getThemeOption = (value: ThemePreference): ThemeOption =>
  THEME_OPTIONS.find((option) => option.value === value) ?? THEME_OPTIONS[0]!;
