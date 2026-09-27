import { Download, Search } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { Logo } from '@/shared/components/Logo';
import { APP_NAME } from '@/shared/config/app';
import { paths } from '@/shared/config/paths';
import { usePwaInstall } from '@/shared/hooks/usePwaInstall';
import { useScrolled } from '@/shared/hooks/useScrolled';
import { cn } from '@/shared/lib/cn';
import { iconButtonStyles } from '@/shared/ui/button-styles';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { Container } from '@/shared/ui/Container';
import { MobileNav } from './MobileNav';
import { PRIMARY_NAV } from './nav-items';
import { ThemeMenu } from './ThemeMenu';

const navLinkStyles =
  'relative inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-fg-muted ' +
  'transition-colors duration-(--dur-1) hover:text-fg aria-[current=page]:text-fg ' +
  'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-accent ' +
  'after:transition-transform after:duration-(--dur-2) aria-[current=page]:after:scale-x-100';

/**
 * Fixed top bar. Transparent over the top of the page, then solid with blur once scrolled,
 * which lets full-bleed heroes sit under it later.
 */
export function Navbar() {
  const scrolled = useScrolled();
  const { isInstallable, installApp } = usePwaInstall();

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-(--z-nav) h-(--nav-h) border-b transition-[background-color,border-color] duration-(--dur-2)',
        scrolled
          ? 'border-line bg-canvas/85 backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-full items-center gap-2 md:gap-8">
        <Link
          to={paths.home}
          aria-label={`${APP_NAME} home`}
          className="-mx-1 rounded-md px-1 py-1"
        >
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkStyles}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to={paths.search()}
            aria-label="Search"
            title="Search"
            className={iconButtonStyles()}
          >
            <Search aria-hidden="true" />
          </Link>
          {isInstallable && (
            <button
              type="button"
              onClick={installApp}
              className="hidden items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-600/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-600 hover:text-white sm:inline-flex"
              title="Install App"
            >
              <Download className="size-3.5" />
              <span>Install App</span>
            </button>
          )}
          <div className="hidden md:block">
            <ThemeMenu />
          </div>
          <ButtonLink to={paths.login()} size="sm" className="ml-2 hidden sm:inline-flex">
            Sign in
          </ButtonLink>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
