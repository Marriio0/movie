import { useEffect, useState } from 'react';

/** True once the window is scrolled past `threshold` px. Re-renders only when that changes. */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(() =>
    typeof window === 'undefined' ? false : window.scrollY > threshold,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
