import { useCallback, useEffect, useState } from 'react';

interface RailEdges {
  atStart: boolean;
  atEnd: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tracks whether a horizontal scroller can move left/right and scrolls it by one viewport.
 * `setTrack` is a callback ref (pass it as `ref`), so tracking starts whenever the scroller
 * mounts, including after loading finishes.
 */
export function useScrollRail<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [edges, setEdges] = useState<RailEdges>({ atStart: true, atEnd: true });

  useEffect(() => {
    if (!node) return;
    const update = () => {
      const max = node.scrollWidth - node.clientWidth;
      const next = { atStart: node.scrollLeft <= 1, atEnd: node.scrollLeft >= max - 1 };
      setEdges((prev) =>
        prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
      );
    };
    const observer = new ResizeObserver(update); // also fires once on observe
    observer.observe(node);
    node.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener('scroll', update);
    };
  }, [node]);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      node?.scrollBy({
        left: direction * node.clientWidth * 0.9,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    },
    [node],
  );

  return { setTrack: setNode, ...edges, scrollByPage };
}
