import { Menu, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { paths } from '@/shared/config/paths';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { IconButton } from '@/shared/ui/IconButton';
import { PRIMARY_NAV } from './nav-items';
import { ThemeSegmentedControl } from './ThemeSegmentedControl';

/** Slide-in navigation sheet for viewports below `md`. */
export function MobileNav() {
  const { pathname } = useLocation();
  // Open state is tied to the path it was opened on, so any navigation (link, back or forward)
  // closes the sheet with no effect needed.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  // After a link click, focus should go to the new page's <main>, not back to the menu button.
  const navigating = useRef(false);

  const closeFor = (to: string) => {
    navigating.current = to !== pathname;
    setOpenedOn(null);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => setOpenedOn(next ? pathname : null)}>
      <Dialog.Trigger asChild>
        <IconButton label="Open menu">
          <Menu aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-black/60 backdrop-blur-sm data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            if (navigating.current) event.preventDefault();
            navigating.current = false;
          }}
          className="fixed inset-y-0 right-0 z-(--z-overlay) flex w-[min(20rem,88vw)] flex-col gap-8 overflow-y-auto border-l border-line bg-surface-2 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-pop outline-none data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in"
        >
          <div className="flex h-(--nav-h) items-center justify-between">
            <Dialog.Title className="text-sm font-medium text-fg-subtle">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close menu" className="-mr-2">
                <X aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </div>

          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => closeFor(item.to)}
                    className="flex h-12 items-center rounded-md px-3 text-lg font-medium text-fg-muted transition-colors duration-(--dur-1) hover:bg-surface-3 hover:text-fg aria-[current=page]:bg-surface-3 aria-[current=page]:text-fg"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <ThemeSegmentedControl />

          <ButtonLink
            to={paths.login()}
            size="lg"
            className="mt-auto w-full"
            onClick={() => closeFor(paths.login())}
          >
            Sign in
          </ButtonLink>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
