import { useRef } from 'react';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/shared/components/Logo';
import { APP_NAME } from '@/shared/config/app';
import { paths } from '@/shared/config/paths';
import { Container } from '@/shared/ui/Container';
import { SkipLink } from '../shell/SkipLink';
import { ThemeMenu } from '../shell/ThemeMenu';
import { MAIN_CONTENT_ID, useFocusMainOnNavigate } from '../shell/useFocusMainOnNavigate';

/** Minimal layout for sign-in screens: logo, one centered column, no browsing chrome. */
export function AuthLayout() {
  const mainRef = useRef<HTMLElement>(null);
  useFocusMainOnNavigate(mainRef);

  return (
    <div className="flex min-h-dvh flex-col glow-top">
      <SkipLink />
      <header>
        <Container className="flex h-(--nav-h) items-center justify-between">
          <Link
            to={paths.home}
            aria-label={`${APP_NAME} home`}
            className="-mx-1 rounded-md px-1 py-1"
          >
            <Logo />
          </Link>
          <ThemeMenu />
        </Container>
      </header>
      <main
        id={MAIN_CONTENT_ID}
        ref={mainRef}
        tabIndex={-1}
        className="flex flex-1 justify-center px-(--gutter) py-8 sm:items-center sm:py-12"
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
