import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router';

export const MAIN_CONTENT_ID = 'main';

/**
 * Moves focus to <main> when the pathname changes, so keyboard and screen-reader users start
 * at the new page's content instead of the link they activated.
 * Query-string changes (search typing, tabs) are ignored on purpose.
 */
export function useFocusMainOnNavigate(mainRef: RefObject<HTMLElement | null>): void {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, mainRef]);
}
