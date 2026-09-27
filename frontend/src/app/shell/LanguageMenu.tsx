import { Check, Globe } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import {
  type AppLanguage,
  SUPPORTED_LANGUAGES,
  useLanguage,
} from '@/shared/i18n/language-context';

export function LanguageMenu() {
  const { language, setLanguage, langObj } = useLanguage();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Language: ${langObj.nativeName}`}
          className="flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Globe className="size-4 shrink-0 text-accent" />
          <span className="hidden sm:inline-block">{langObj.flag} {langObj.nativeName}</span>
          <span className="sm:hidden">{langObj.flag}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-(--z-overlay) min-w-44 rounded-lg bg-surface-2 p-1.5 shadow-pop data-[state=open]:animate-pop-in border border-line"
        >
          <DropdownMenu.Label className="px-2 py-1 text-[11px] font-semibold text-fg-subtle">
            اختر لغة الموقع / Langue / Language
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={language}
            onValueChange={(val) => setLanguage(val as AppLanguage)}
          >
            {SUPPORTED_LANGUAGES.map((item) => (
              <DropdownMenu.RadioItem
                key={item.code}
                value={item.code}
                className="flex cursor-pointer items-center justify-between gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-fg-muted outline-none select-none hover:bg-surface-3 hover:text-fg data-[state=checked]:bg-surface-3 data-[state=checked]:text-fg data-[state=checked]:font-bold"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <span>{item.nativeName}</span>
                  <span className="text-[10px] text-fg-subtle font-mono">({item.code.toUpperCase()})</span>
                </div>
                <DropdownMenu.ItemIndicator>
                  <Check aria-hidden="true" className="size-3.5 text-emerald-400" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
