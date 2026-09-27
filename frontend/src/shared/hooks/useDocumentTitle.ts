import { useEffect } from 'react';
import { APP_NAME } from '@/shared/config/app';

/** Sets `<title>` to "Page · Marquee", or just "Marquee" when no title is given. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
