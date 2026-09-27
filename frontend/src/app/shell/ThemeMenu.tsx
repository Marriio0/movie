import { Check } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { getThemeOption, THEME_OPTIONS } from '@/shared/theme/theme-options';
import { isThemePreference } from '@/shared/theme/theme-store';
import { useTheme } from '@/shared/theme/useTheme';
import { IconButton } from '@/shared/ui/IconButton';

/** Compact theme picker for the desktop navbar and the auth header. */
export function ThemeMenu() {
  const { preference, setPreference } = useTheme();
  const { icon: CurrentIcon, label } = getThemeOption(preference);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton label={`Theme: ${label}`}>
          <CurrentIcon aria-hidden="true" />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-(--z-overlay) min-w-40 rounded-lg bg-surface-2 p-1 shadow-pop data-[state=open]:animate-pop-in"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-fg-subtle">
            Theme
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={preference}
            onValueChange={(value) => isThemePreference(value) && setPreference(value)}
          >
            {THEME_OPTIONS.map(({ value, label: optionLabel, icon: Icon }) => (
              <DropdownMenu.RadioItem
                key={value}
                value={value}
                className="flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm text-fg-muted outline-none select-none data-highlighted:bg-surface-3 data-highlighted:text-fg data-[state=checked]:text-fg"
              >
                <Icon aria-hidden="true" className="size-4" />
                {optionLabel}
                <DropdownMenu.ItemIndicator className="ml-auto">
                  <Check aria-hidden="true" className="size-4 text-accent-text" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
