import { useId } from 'react';
import { THEME_OPTIONS } from '@/shared/theme/theme-options';
import { useTheme } from '@/shared/theme/useTheme';

/** Full-width theme picker for the mobile menu. Native radios give keyboard and SR support. */
export function ThemeSegmentedControl() {
  const { preference, setPreference } = useTheme();
  const name = useId();

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-fg-subtle">Theme</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-1 p-1 ring-1 ring-line">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md text-sm text-fg-muted transition-colors duration-(--dur-1) select-none hover:text-fg has-checked:bg-surface-3 has-checked:text-fg has-focus-visible:ring-2 has-focus-visible:ring-focus"
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={preference === value}
              onChange={() => setPreference(value)}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
