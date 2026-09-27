import { useRef } from 'react';
import { Outlet } from 'react-router';
import { Footer } from '../shell/Footer';
import { Navbar } from '../shell/Navbar';
import { SkipLink } from '../shell/SkipLink';
import { MAIN_CONTENT_ID, useFocusMainOnNavigate } from '../shell/useFocusMainOnNavigate';

/** Layout for every browsing screen: navbar, content, footer. */
export function MainLayout() {
  const mainRef = useRef<HTMLElement>(null);
  useFocusMainOnNavigate(mainRef);

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Navbar />
      <main id={MAIN_CONTENT_ID} ref={mainRef} tabIndex={-1} className="flex-1 pt-(--nav-h)">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
